import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { emitStats } from '@/lib/event-bus'
import { incrementInfluencerCountersByClickId } from '@/lib/attribution'
import { UserService } from '@/lib/user-service'

const clickSchema = z.object({
  // Required fields
  ip: z.string(),

  // Optional identification
  email: z.string().email().optional(),
  phone: z.string().optional(),
  clickId: z.string().optional(),
  deviceId: z.string().optional(),
  sessionId: z.string().optional(),
  fingerprint: z.string().optional(),

  // Attribution
  campaign: z.string().optional(),
  source: z.string().optional(),
  medium: z.string().optional(),
  content: z.string().optional(),
  term: z.string().optional(),

  // RedTrack
  subId1: z.string().optional(),
  subId2: z.string().optional(),
  subId3: z.string().optional(),
  subId4: z.string().optional(),
  subId5: z.string().optional(),

  // Operator/Brand
  operatorId: z.string().optional(),

  // Technical
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  landingPage: z.string().optional(),

  // Geographic
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  isp: z.string().optional(),

  // Device
  device: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  isMobile: z.boolean().optional(),
  isTablet: z.boolean().optional(),
  isDesktop: z.boolean().optional(),

  // Quality flags
  isBot: z.boolean().optional(),
  isVPN: z.boolean().optional(),
  isFraud: z.boolean().optional(),

  // Timing
  clickTime: z.string().datetime().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = clickSchema.parse(body)

    // Find or create user
    const user = await UserService.findOrCreateUser({
      email: validatedData.email,
      phone: validatedData.phone,
      clickId: validatedData.clickId,
      deviceId: validatedData.deviceId,
      sessionId: validatedData.sessionId,
      fingerprint: validatedData.fingerprint,
      ip: validatedData.ip,
      userAgent: validatedData.userAgent,
    }, {
      country: validatedData.country,
      region: validatedData.region,
      city: validatedData.city,
    })

    // Create click record
    const clickData: any = {
      customerId: user?.id,
      clickId: validatedData.clickId,
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
      isp: validatedData.isp,
      device: validatedData.device,
      browser: validatedData.browser,
      os: validatedData.os,
      isMobile: validatedData.isMobile || false,
      isTablet: validatedData.isTablet || false,
      isDesktop: validatedData.isDesktop || false,
      isBot: validatedData.isBot || false,
      isVPN: validatedData.isVPN || false,
      isFraud: validatedData.isFraud || false,
      clickTime: validatedData.clickTime ? new Date(validatedData.clickTime) : new Date(),
    }

    const click = await prisma.click.create({
      data: clickData
    })

    // Update user click count
    if (user) {
      await prisma.customer.update({
        where: { id: user.id },
        data: {
          totalClicks: { increment: 1 },
          lastSeen: new Date()
        }
      })
    }

    // Find existing campaign (case-insensitive) and update stats
    if (validatedData.campaign) {
      const existingCampaign = await prisma.campaign.findFirst({
        where: {
          OR: [
            { slug: { equals: validatedData.campaign, mode: 'insensitive' } },
            { name: { equals: validatedData.campaign, mode: 'insensitive' } }
          ]
        }
      })

      if (existingCampaign) {
        await prisma.campaign.update({
          where: { id: existingCampaign.id },
          data: {
            totalClicks: { increment: 1 }
          }
        })
        console.log(`📈 [CLICK API] Updated campaign stats for: ${existingCampaign.name} (matched: ${validatedData.campaign})`)
      } else {
        console.log(`⚠️ [CLICK API] Campaign not found: ${validatedData.campaign}`)
      }
    }

    // Attribute click to influencer via link mapping
    await incrementInfluencerCountersByClickId(validatedData.clickId, { clicks: 1 })
    emitStats({ type: 'click', payload: { campaign: validatedData.campaign, clickId: validatedData.clickId } })

    // Auto-start acquisition journey if operatorId provided and customer has email/phone
    let journeyStarted = false
    if (validatedData.operatorId && user) {
      // Check if journey already exists for this operator
      const existingJourney = await prisma.customerJourneyState.findFirst({
        where: {
          customerId: user.id,
          operatorId: validatedData.operatorId
        }
      })

      // Only start if no journey exists yet
      if (!existingJourney && (validatedData.email || validatedData.phone)) {
        try {
          // Start acquisition journey
          const journeyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3005'}/api/journey/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: user.id,
              operatorId: validatedData.operatorId,
              journeyType: 'acquisition',
              operatorName: validatedData.operatorId.charAt(0).toUpperCase() + validatedData.operatorId.slice(1)
            })
          })

          if (journeyResponse.ok) {
            journeyStarted = true
            console.log(`🚀 [CLICK API] Auto-started acquisition journey for customer ${user.id} on ${validatedData.operatorId}`)
          }
        } catch (journeyError) {
          console.error('⚠️ [CLICK API] Failed to auto-start journey:', journeyError)
          // Don't fail the whole request if journey fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      clickId: click.id,
      userId: user?.id,
      journeyStarted,
      message: 'Click tracked successfully'
    })

  } catch (error) {
    console.error('Click tracking error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from URL
    const { searchParams } = new URL(request.url)

    // Convert query params to object for validation
    const queryData: any = {
      // Redtrack typically sends sub1={clickid}
      clickId: searchParams.get('sub1') || searchParams.get('clickid') || searchParams.get('clickId'),
      subId1: searchParams.get('sub1'),
      subId2: searchParams.get('sub2'),
      subId3: searchParams.get('sub3'),
      subId4: searchParams.get('sub4'),
      subId5: searchParams.get('sub5'),

      // Get IP from header or query param
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          searchParams.get('ip') ||
          '0.0.0.0',

      // Get user agent from header or query param
      userAgent: request.headers.get('user-agent') || searchParams.get('user_agent'),

      // Attribution params
      campaign: searchParams.get('campaign'),
      source: searchParams.get('source'),
      medium: searchParams.get('medium'),
      content: searchParams.get('content'),
      term: searchParams.get('term'),

      // Identification
      email: searchParams.get('email'),
      phone: searchParams.get('phone'),
      deviceId: searchParams.get('device_id') || searchParams.get('deviceId'),
      sessionId: searchParams.get('session_id') || searchParams.get('sessionId'),
      fingerprint: searchParams.get('fingerprint'),

      // Technical
      referrer: searchParams.get('referrer') || request.headers.get('referer'),
      landingPage: searchParams.get('landing_page') || searchParams.get('landingPage'),

      // Operator
      operatorId: searchParams.get('operator_id') || searchParams.get('operatorId'),
    }

    // Remove undefined values
    Object.keys(queryData).forEach(key => {
      if (queryData[key] === null || queryData[key] === undefined) {
        delete queryData[key]
      }
    })

    const validatedData = clickSchema.parse(queryData)

    // Find or create user
    const user = await UserService.findOrCreateUser({
      email: validatedData.email,
      phone: validatedData.phone,
      clickId: validatedData.clickId,
      deviceId: validatedData.deviceId,
      sessionId: validatedData.sessionId,
      fingerprint: validatedData.fingerprint,
      ip: validatedData.ip,
      userAgent: validatedData.userAgent,
    }, {
      country: validatedData.country,
      region: validatedData.region,
      city: validatedData.city,
    })

    // Create click record
    const clickData: any = {
      customerId: user?.id,
      clickId: validatedData.clickId,
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
      isp: validatedData.isp,
      device: validatedData.device,
      browser: validatedData.browser,
      os: validatedData.os,
      isMobile: validatedData.isMobile || false,
      isTablet: validatedData.isTablet || false,
      isDesktop: validatedData.isDesktop || false,
      isBot: validatedData.isBot || false,
      isVPN: validatedData.isVPN || false,
      isFraud: validatedData.isFraud || false,
      clickTime: validatedData.clickTime ? new Date(validatedData.clickTime) : new Date(),
    }

    const click = await prisma.click.create({
      data: clickData
    })

    // Update user click count
    if (user) {
      await prisma.customer.update({
        where: { id: user.id },
        data: {
          totalClicks: { increment: 1 },
          lastSeen: new Date()
        }
      })
    }

    // Find existing campaign and update stats
    if (validatedData.campaign) {
      const existingCampaign = await prisma.campaign.findFirst({
        where: {
          OR: [
            { slug: { equals: validatedData.campaign, mode: 'insensitive' } },
            { name: { equals: validatedData.campaign, mode: 'insensitive' } }
          ]
        }
      })

      if (existingCampaign) {
        await prisma.campaign.update({
          where: { id: existingCampaign.id },
          data: {
            totalClicks: { increment: 1 }
          }
        })
        console.log(`📈 [CLICK API GET] Updated campaign stats for: ${existingCampaign.name}`)
      }
    }

    // Attribute click to influencer
    await incrementInfluencerCountersByClickId(validatedData.clickId, { clicks: 1 })
    emitStats({ type: 'click', payload: { campaign: validatedData.campaign, clickId: validatedData.clickId } })

    // Auto-start acquisition journey if operatorId provided
    let journeyStarted = false
    if (validatedData.operatorId && user) {
      const existingJourney = await prisma.customerJourneyState.findFirst({
        where: {
          customerId: user.id,
          operatorId: validatedData.operatorId
        }
      })

      if (!existingJourney && (validatedData.email || validatedData.phone)) {
        try {
          const journeyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3005'}/api/journey/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: user.id,
              operatorId: validatedData.operatorId,
              journeyType: 'acquisition',
              operatorName: validatedData.operatorId.charAt(0).toUpperCase() + validatedData.operatorId.slice(1)
            })
          })

          if (journeyResponse.ok) {
            journeyStarted = true
            console.log(`🚀 [CLICK API GET] Auto-started acquisition journey for customer ${user.id}`)
          }
        } catch (journeyError) {
          console.error('⚠️ [CLICK API GET] Failed to auto-start journey:', journeyError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      clickId: click.id,
      userId: user?.id,
      journeyStarted,
      message: 'Click tracked successfully'
    })

  } catch (error) {
    console.error('Click tracking error (GET):', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
