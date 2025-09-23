import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
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

    return NextResponse.json({
      success: true,
      clickId: click.id,
      userId: user?.id,
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

export async function GET() {
  return NextResponse.json({
    endpoint: 'Click Tracking',
    method: 'POST',
    description: 'Track user clicks with attribution and device data'
  })
}