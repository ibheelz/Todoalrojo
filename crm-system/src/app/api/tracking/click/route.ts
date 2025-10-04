import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { emitStats } from '@/lib/event-bus'
import { incrementCampaignCounters, incrementInfluencerCountersByClickId } from '@/lib/attribution'

export const dynamic = 'force-dynamic'

const clickTrackingSchema = z.object({
  // Required tracking data
  clickId: z.string().optional(), // From URL parameters
  ip: z.string().min(1, 'IP address is required'),
  userAgent: z.string().optional(),

  // Campaign attribution
  campaign: z.string().optional(),
  source: z.string().optional(),
  medium: z.string().optional(),
  content: z.string().optional(),
  term: z.string().optional(),

  // Sub IDs for detailed tracking
  subId1: z.string().optional(),
  subId2: z.string().optional(),
  subId3: z.string().optional(),
  subId4: z.string().optional(),
  subId5: z.string().optional(),

  // Page data
  referrer: z.string().optional(),
  landingPage: z.string().optional(),
  pageTitle: z.string().optional(),

  // Device data
  sessionId: z.string().optional(),
  deviceId: z.string().optional(),
  fingerprint: z.string().optional(),

  // Geo data (optional, can be determined server-side)
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),

  // Timestamp
  timestamp: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('🖱️ [CLICK-TRACKING] Processing click tracking')

    const body = await request.json()
    console.log('📝 [CLICK-TRACKING] Request body:', body)

    const validatedData = clickTrackingSchema.parse(body)
    console.log('✅ [CLICK-TRACKING] Data validated:', validatedData)

    // Extract device info from user agent
    const deviceInfo = parseUserAgent(validatedData.userAgent || '')

    // Generate click_id if not provided
    const clickId = validatedData.clickId || generateClickId()

    // Try to find existing customer by click_id or other identifiers
    let customer = null

    if (validatedData.clickId) {
      // Check if we already have this click_id
      const existingClick = await prisma.click.findUnique({
        where: { clickId: validatedData.clickId },
        include: { customer: true }
      })

      if (existingClick && existingClick.customer) {
        customer = existingClick.customer
        console.log('👤 [CLICK-TRACKING] Found existing customer via click_id:', customer.id)
      }
    }

    // If no customer found, check by other identifiers (device_id, fingerprint, etc.)
    if (!customer && validatedData.deviceId) {
      const deviceIdentifier = await prisma.identifier.findUnique({
        where: {
          type_value: {
            type: 'DEVICE_ID',
            value: validatedData.deviceId
          }
        },
        include: { customer: true }
      })

      if (deviceIdentifier) {
        customer = deviceIdentifier.customer
        console.log('👤 [CLICK-TRACKING] Found existing customer via device_id:', customer.id)
      }
    }

    // Create new customer if none found
    if (!customer) {
      console.log('➕ [CLICK-TRACKING] Creating new customer')

      customer = await prisma.customer.create({
        data: {
          source: validatedData.source || 'unknown',
          country: validatedData.country,
          city: validatedData.city,
          totalClicks: 1,
          firstSeen: new Date(),
          lastSeen: new Date()
        }
      })

      console.log('✅ [CLICK-TRACKING] Created new customer:', customer.id)

      // Create identifiers for the new customer
      const identifiersToCreate = []

      if (clickId) {
        identifiersToCreate.push({
          customerId: customer.id,
          type: 'CLICK_ID',
          value: clickId,
          isVerified: true,
          source: validatedData.source
        })
      }

      if (validatedData.deviceId) {
        identifiersToCreate.push({
          customerId: customer.id,
          type: 'DEVICE_ID',
          value: validatedData.deviceId,
          source: validatedData.source
        })
      }

      if (validatedData.sessionId) {
        identifiersToCreate.push({
          customerId: customer.id,
          type: 'SESSION_ID',
          value: validatedData.sessionId,
          source: validatedData.source
        })
      }

      if (validatedData.fingerprint) {
        identifiersToCreate.push({
          customerId: customer.id,
          type: 'FINGERPRINT',
          value: validatedData.fingerprint,
          source: validatedData.source
        })
      }

      if (validatedData.ip) {
        identifiersToCreate.push({
          customerId: customer.id,
          type: 'IP_ADDRESS',
          value: validatedData.ip,
          source: validatedData.source
        })
      }

      if (identifiersToCreate.length > 0) {
        await prisma.identifier.createMany({
          data: identifiersToCreate
        })
        console.log('🆔 [CLICK-TRACKING] Created identifiers:', identifiersToCreate.length)
      }
    } else {
      // Update existing customer
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalClicks: { increment: 1 },
          lastSeen: new Date(),
          // Update location if not set
          country: customer.country || validatedData.country,
          city: customer.city || validatedData.city
        }
      })
      console.log('🔄 [CLICK-TRACKING] Updated existing customer:', customer.id)
    }

    // Create click record
    console.log('📊 [CLICK-TRACKING] Creating click record')

    const clickRecord = await prisma.click.create({
      data: {
        customerId: customer.id,
        clickId,
        sessionId: validatedData.sessionId,
        deviceId: validatedData.deviceId,
        fingerprint: validatedData.fingerprint,
        campaign: validatedData.campaign,
        source: validatedData.source,
        medium: validatedData.medium,
        content: validatedData.content,
        term: validatedData.term,
        subId1: validatedData.subId1,
        subId2: validatedData.subId2,
        subId3: validatedData.subId3,
        subId4: validatedData.subId4,
        subId5: validatedData.subId5,
        ip: validatedData.ip,
        userAgent: validatedData.userAgent,
        referrer: validatedData.referrer,
        landingPage: validatedData.landingPage,
        country: validatedData.country,
        region: validatedData.region,
        city: validatedData.city,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        isMobile: deviceInfo.isMobile,
        isTablet: deviceInfo.isTablet,
        isDesktop: deviceInfo.isDesktop,
        clickTime: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date()
      }
    })

    console.log('✅ [CLICK-TRACKING] Created click record:', clickRecord.id)

    // Create CLICK event for journey tracking
    console.log('📊 [CLICK-TRACKING] Creating CLICK event')

    await prisma.event.create({
      data: {
        customerId: customer.id,
        eventType: 'CLICK',
        eventName: 'Landing Page Visit',
        category: 'engagement',
        properties: {
          landingPage: validatedData.landingPage,
          pageTitle: validatedData.pageTitle,
          referrer: validatedData.referrer,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          isMobile: deviceInfo.isMobile
        },
        campaign: validatedData.campaign,
        source: validatedData.source,
        medium: validatedData.medium,
        clickId,
        ip: validatedData.ip,
        userAgent: validatedData.userAgent,
        pageUrl: validatedData.landingPage,
        eventTime: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date()
      }
    })

    // Update campaign counters
    await incrementCampaignCounters({ campaign: validatedData.campaign, clicks: 1, events: 1 })
    // If this clickId later gets used by a short link redirect (unlikely here), the influencer increment will come via that path.
    await incrementInfluencerCountersByClickId(clickId, { clicks: 1 })

    console.log('🎉 [CLICK-TRACKING] Click tracking processed successfully')
    emitStats({ type: 'click', payload: { campaign: validatedData.campaign, clickId } })

    return NextResponse.json({
      success: true,
      data: {
        customerId: customer.id,
        clickId,
        clickRecordId: clickRecord.id,
        isNewCustomer: !customer.createdAt || (new Date().getTime() - customer.createdAt.getTime()) < 5000
      }
    })

  } catch (error) {
    console.error('❌ [CLICK-TRACKING] Error processing click tracking:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

function generateClickId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `click_${timestamp}_${random}`
}

function parseUserAgent(userAgent: string) {
  // Simple user agent parsing - in production you might want to use a library like ua-parser-js
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
  const isTablet = /iPad|Tablet/.test(userAgent)
  const isDesktop = !isMobile && !isTablet

  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Unknown'

  // Browser detection
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  // OS detection
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'

  // Device detection
  if (isMobile) device = 'Mobile'
  else if (isTablet) device = 'Tablet'
  else if (isDesktop) device = 'Desktop'

  return {
    browser,
    os,
    device,
    isMobile,
    isTablet,
    isDesktop
  }
}
