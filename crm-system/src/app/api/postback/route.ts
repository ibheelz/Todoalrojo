import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const postbackSchema = z.object({
  clickid: z.string().min(1),
  status: z.enum(['approved', 'pending', 'rejected', 'cancelled']).optional().default('approved'),
  type: z.string().optional().default('Conversion'),
  value: z.number().optional(),
  currency: z.string().optional().default('USD'),
  campaign: z.string().optional(),
  source: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  client: z.string().optional(),
  custom_data: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  console.log('🎯 [POSTBACK API] Starting conversion tracking...')
  const startTime = Date.now()

  try {
    console.log('📥 [POSTBACK API] Parsing request body...')
    const body = await request.json()
    console.log('📄 [POSTBACK API] Raw postback data:', JSON.stringify(body, null, 2))

    console.log('✅ [POSTBACK API] Validating data with schema...')
    const validatedData = postbackSchema.parse(body)
    console.log('✅ [POSTBACK API] Validation successful:', JSON.stringify(validatedData, null, 2))

    // Find customer by clickId
    console.log('🔍 [POSTBACK API] Finding customer by clickId:', validatedData.clickid)
    const customer = await prisma.customer.findFirst({
      where: {
        identifiers: {
          some: {
            type: 'CLICK_ID',
            value: validatedData.clickid
          }
        }
      },
      include: {
        identifiers: true,
        leads: true,
        events: true
      }
    })

    if (!customer) {
      console.log('❌ [POSTBACK API] Customer not found for clickId:', validatedData.clickid)
      return NextResponse.json({
        success: false,
        error: 'Customer not found for provided clickId'
      }, { status: 404 })
    }

    console.log('👤 [POSTBACK API] Customer found:', customer.id, customer.masterEmail)

    // Create conversion event - inherit data from customer if not provided
    console.log('💾 [POSTBACK API] Creating conversion event...')

    // Get latest lead for this customer to inherit campaign/source info
    const latestLead = customer.leads?.[0] || null

    const eventData: any = {
      customerId: customer.id,
      eventType: validatedData.type || 'Conversion',
      eventName: `${validatedData.type || 'Conversion'}_${validatedData.status || 'approved'}`,
      category: 'conversion',
      properties: {
        status: validatedData.status || 'approved',
        postbackTimestamp: validatedData.timestamp || new Date().toISOString(),
        originalPostback: body,
        customData: validatedData.custom_data || {},
        inheritedFromLead: latestLead ? {
          campaign: latestLead.campaign,
          source: latestLead.source,
          medium: latestLead.medium
        } : null
      },
      value: validatedData.value || 0,
      currency: validatedData.currency || 'USD',
      clickId: validatedData.clickid,
      // Inherit from customer's latest lead if not provided in postback
      campaign: validatedData.campaign || latestLead?.campaign || 'unknown',
      source: validatedData.source || latestLead?.source || 'unknown',
      clientId: validatedData.client || latestLead?.clientId,
      isConverted: (validatedData.status || 'approved') === 'approved',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'postback-system',
    }

    console.log('💾 [POSTBACK API] Event data to be saved:', JSON.stringify(eventData, null, 2))

    const event = await prisma.event.create({
      data: eventData
    })

    console.log('✅ [POSTBACK API] Event created successfully:', event.id)

    // Update customer revenue and stats
    console.log('👤 [POSTBACK API] Updating customer statistics...')
    const updateData: any = {
      lastSeen: new Date()
    }

    // Only add revenue for approved conversions with value
    const finalStatus = validatedData.status || 'approved'
    if (finalStatus === 'approved' && validatedData.value && validatedData.value > 0) {
      updateData.totalRevenue = { increment: validatedData.value }
      updateData.totalEvents = { increment: 1 }
      console.log('💰 [POSTBACK API] Adding revenue to customer:', validatedData.value)
    } else {
      updateData.totalEvents = { increment: 1 }
    }

    console.log('👤 [POSTBACK API] Customer update data:', updateData)

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: updateData
    })

    console.log('✅ [POSTBACK API] Customer updated successfully:', updatedCustomer.id)

    // Update campaign stats if campaign is provided or inherited
    const finalCampaign = validatedData.campaign || latestLead?.campaign
    if (finalCampaign) {
      console.log('📈 [POSTBACK API] Updating campaign statistics for:', finalCampaign)
      const campaignUpdateData: any = {}

      if (finalStatus === 'approved') {
        campaignUpdateData.totalEvents = { increment: 1 }
        if (validatedData.value && validatedData.value > 0) {
          campaignUpdateData.totalRevenue = { increment: validatedData.value }
        }
      }

      if (Object.keys(campaignUpdateData).length > 0) {
        const campaignResult = await prisma.campaign.upsert({
          where: { slug: finalCampaign },
          update: campaignUpdateData,
          create: {
            name: finalCampaign,
            slug: finalCampaign,
            totalEvents: finalStatus === 'approved' ? 1 : 0,
            totalRevenue: (finalStatus === 'approved' && validatedData.value) ? validatedData.value : 0,
          }
        })
        console.log('✅ [POSTBACK API] Campaign updated:', campaignResult.id)
      }
    }

    const processingTime = Date.now() - startTime
    console.log(`🎉 [POSTBACK API] Conversion tracking completed successfully in ${processingTime}ms`)
    console.log('📤 [POSTBACK API] Returning success response:', {
      eventId: event.id,
      customerId: customer.id,
      conversionType: validatedData.type,
      status: validatedData.status,
      value: validatedData.value,
      processingTime
    })

    return NextResponse.json({
      success: true,
      eventId: event.id,
      customerId: customer.id,
      conversionType: validatedData.type || 'Conversion',
      status: finalStatus,
      value: validatedData.value,
      campaign: finalCampaign,
      source: validatedData.source || latestLead?.source || 'unknown',
      processingTime,
      message: 'Conversion tracked successfully'
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ [POSTBACK API] Conversion tracking error after ${processingTime}ms:`, error)
    console.error('❌ [POSTBACK API] Error stack:', error instanceof Error ? error.stack : 'No stack trace available')

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
    endpoint: 'Conversion Postback',
    method: 'POST',
    description: 'Track conversions from affiliate networks and clients - only clickid is required!',
    parameters: {
      clickid: 'string (required) - Click ID to identify the customer',
      status: 'enum (optional) - approved|pending|rejected|cancelled (default: approved)',
      type: 'string (optional) - Any conversion type (default: Conversion)',
      value: 'number (optional) - Conversion value',
      currency: 'string (optional) - Currency code (default: USD)',
      campaign: 'string (optional) - Campaign identifier (inherits from customer lead if not provided)',
      source: 'string (optional) - Traffic source (inherits from customer lead if not provided)',
      timestamp: 'string (optional) - ISO datetime string',
      client: 'string (optional) - Client/brand identifier',
      custom_data: 'object (optional) - Additional custom data'
    },
    examples: [
      {
        note: 'Minimal - Only clickid required (everything else inherited from customer data)',
        clickid: 'click_123456'
      },
      {
        note: 'With value - Simple deposit conversion',
        clickid: 'click_123456',
        value: 100
      },
      {
        note: 'Custom type - Registration conversion',
        clickid: 'click_123456',
        type: 'Registration'
      },
      {
        note: 'Full data - Override inherited values',
        clickid: 'click_123456',
        status: 'approved',
        type: 'Deposit',
        value: 100,
        currency: 'USD',
        campaign: 'todoalrojo',
        source: 'naxo',
        client: 'betsson'
      }
    ]
  })
}