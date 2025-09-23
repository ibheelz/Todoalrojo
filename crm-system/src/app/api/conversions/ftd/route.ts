import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { incrementCampaignCounters, incrementInfluencerCountersByClickId } from '@/lib/attribution'

export const dynamic = 'force-dynamic'

const ftdSchema = z.object({
  // User identification
  clickId: z.string().min(1, 'Click ID is required'),
  email: z.string().email().optional(),
  userId: z.string().optional(), // External user ID from casino/platform

  // Conversion data
  value: z.number().min(0, 'FTD value must be positive'),
  currency: z.string().default('USD'),
  conversionId: z.string().optional(), // External conversion ID

  // Platform data
  platform: z.string().optional(),
  paymentMethod: z.string().optional(),

  // Campaign attribution
  campaign: z.string().optional(),
  source: z.string().optional(),

  // Additional data
  timestamp: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    console.log('💰 [FTD] Processing FTD conversion')

    const body = await request.json()
    console.log('📝 [FTD] Request body:', body)

    const validatedData = ftdSchema.parse(body)
    console.log('✅ [FTD] Data validated:', validatedData)

    // Find customer by click_id
    console.log('🔍 [FTD] Looking for customer by click_id:', validatedData.clickId)

    let customer = null

    // First check Click records
    const clickRecord = await prisma.click.findUnique({
      where: { clickId: validatedData.clickId },
      include: { customer: true }
    })

    if (clickRecord && clickRecord.customer) {
      customer = clickRecord.customer
      console.log('👤 [FTD] Found customer via click record:', customer.id)
    }

    // If not found in clicks, check identifiers
    if (!customer) {
      const identifier = await prisma.identifier.findUnique({
        where: {
          type_value: {
            type: 'CLICK_ID',
            value: validatedData.clickId
          }
        },
        include: { customer: true }
      })

      if (identifier) {
        customer = identifier.customer
        console.log('👤 [FTD] Found customer via identifier:', customer.id)
      }
    }

    // If still no customer found, try by email if provided
    if (!customer && validatedData.email) {
      console.log('🔍 [FTD] Looking for customer by email:', validatedData.email)

      const identifier = await prisma.identifier.findUnique({
        where: {
          type_value: {
            type: 'EMAIL',
            value: validatedData.email.toLowerCase()
          }
        },
        include: { customer: true }
      })

      if (identifier) {
        customer = identifier.customer
        console.log('👤 [FTD] Found customer via email:', customer.id)
      }
    }

    if (!customer) {
      console.error('❌ [FTD] Customer not found for click_id:', validatedData.clickId)
      return NextResponse.json({
        success: false,
        error: 'Customer not found for provided click_id',
        details: { clickId: validatedData.clickId }
      }, { status: 404 })
    }

    // Check if this customer already has an FTD
    const existingFTD = await prisma.event.findFirst({
      where: {
        customerId: customer.id,
        eventType: 'FTD'
      }
    })

    if (existingFTD) {
      console.warn('⚠️ [FTD] Customer already has FTD, creating additional deposit event')
    }

    // Create FTD event
    console.log('💳 [FTD] Creating FTD event')

    const ftdEvent = await prisma.event.create({
      data: {
        customerId: customer.id,
        eventType: 'FTD',
        eventName: 'First Time Deposit',
        category: 'revenue',
        value: validatedData.value,
        currency: validatedData.currency,
        properties: {
          platform: validatedData.platform,
          paymentMethod: validatedData.paymentMethod,
          userId: validatedData.userId,
          isFirstDeposit: !existingFTD, // Mark if this is truly first deposit
          metadata: validatedData.metadata,
        },
        campaign: validatedData.campaign,
        source: validatedData.source,
        clickId: validatedData.clickId,
        conversionId: validatedData.conversionId,
        isConverted: true,
        isRevenue: true,
        eventTime: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
      }
    })

    console.log('✅ [FTD] Created FTD event:', ftdEvent.id)

    // Update customer totals
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalEvents: { increment: 1 },
        totalRevenue: { increment: validatedData.value },
        lastSeen: new Date(),
      }
    })

    console.log('📊 [FTD] Updated customer totals')

    // If this is their first FTD, send RedTrack notification
    if (!existingFTD && validatedData.clickId) {
      try {
        const redtrackUrl = `https://track.todoalrojo.club/postback?clickid=${encodeURIComponent(validatedData.clickId)}&status=approved&type=FTD&value=${validatedData.value}&currency=${validatedData.currency}`

        // Fire the conversion pixel
        const img = new Image()
        img.src = redtrackUrl

        console.log('🔔 [FTD] Sent RedTrack FTD notification:', redtrackUrl)

        // Update event to mark RedTrack as notified
        await prisma.event.update({
          where: { id: ftdEvent.id },
          data: { redtrackSent: true }
        })

      } catch (error) {
        console.error('❌ [FTD] Failed to send RedTrack notification:', error)
      }
    }

    // Update campaign and influencer aggregates
    await incrementCampaignCounters({
      campaign: validatedData.campaign || clickRecord?.campaign || undefined,
      events: 1,
      ftd: 1,
      revenue: validatedData.value
    })

    // Map clickId -> link -> influencer and increment FTD count
    await incrementInfluencerCountersByClickId(validatedData.clickId, { ftd: 1 })

    console.log('🎉 [FTD] FTD conversion processed successfully')

    return NextResponse.json({
      success: true,
      data: {
        customerId: customer.id,
        eventId: ftdEvent.id,
        value: validatedData.value,
        currency: validatedData.currency,
        isFirstFTD: !existingFTD,
        redtrackNotified: !existingFTD && !!validatedData.clickId
      }
    })

  } catch (error) {
    console.error('❌ [FTD] Error processing FTD conversion:', error)

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
