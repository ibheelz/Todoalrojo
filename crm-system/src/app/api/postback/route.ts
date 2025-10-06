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
    console.log('📥 [POSTBACK API] Parsing request data...')

    // Parse URL parameters
    const { searchParams } = new URL(request.url)
    const urlParams = Object.fromEntries(searchParams.entries())
    console.log('🔗 [POSTBACK API] URL parameters:', JSON.stringify(urlParams, null, 2))

    // Parse JSON body (if any)
    let bodyData = {}
    try {
      bodyData = await request.json()
      console.log('📄 [POSTBACK API] JSON body data:', JSON.stringify(bodyData, null, 2))
    } catch (error) {
      console.log('📄 [POSTBACK API] No JSON body or invalid JSON, using URL params only')
    }

    // Merge URL params and body data (URL params take precedence for duplicates)
    const combinedData = { ...bodyData, ...urlParams }

    // Convert string numbers to actual numbers (from URL params)
    if (combinedData.value && typeof combinedData.value === 'string') {
      combinedData.value = parseFloat(combinedData.value)
    }

    console.log('📄 [POSTBACK API] Combined postback data:', JSON.stringify(combinedData, null, 2))

    console.log('✅ [POSTBACK API] Validating data with schema...')
    const validatedData = postbackSchema.parse(combinedData)
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
      eventName: `${validatedData.type || 'Conversion'} ${validatedData.status ? validatedData.status.charAt(0).toUpperCase() + validatedData.status.slice(1) : 'Approved'}`,
      category: 'conversion',
      properties: {
        status: validatedData.status || 'approved',
        postbackTimestamp: validatedData.timestamp || new Date().toISOString(),
        originalPostback: combinedData,
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
      console.log('📈 [POSTBACK API] Looking up campaign for:', finalCampaign)
      const existingCampaign = await prisma.campaign.findFirst({
        where: {
          OR: [
            { slug: { equals: finalCampaign, mode: 'insensitive' } },
            { name: { equals: finalCampaign, mode: 'insensitive' } }
          ]
        }
      })

      if (existingCampaign) {
        const updateCampaignData: any = {}

        if (finalStatus === 'approved') {
          updateCampaignData.totalEvents = { increment: 1 }
          if (validatedData.value && validatedData.value > 0) {
            updateCampaignData.totalRevenue = { increment: validatedData.value }
          }

          // Increment specific conversion type columns based on conversion type (case-insensitive)
          const conversionTypeLower = (validatedData.type || 'conversion').toLowerCase()

          // Map conversion types to campaign stat fields (only if configured - not null)
          if (conversionTypeLower.includes('reg') || conversionTypeLower.includes('registration') || conversionTypeLower.includes('signup')) {
            if (existingCampaign.registrations !== null) {
              updateCampaignData.registrations = { increment: 1 }
              console.log(`🎯 [POSTBACK API] Incrementing registrations for campaign: ${existingCampaign.name}`)
            } else {
              console.log(`⚠️ [POSTBACK API] Registrations not configured for campaign: ${existingCampaign.name}`)
            }
          }

          if (conversionTypeLower.includes('ftd') || conversionTypeLower.includes('deposit') || conversionTypeLower.includes('first_deposit')) {
            if (existingCampaign.ftd !== null) {
              updateCampaignData.ftd = { increment: 1 }
              console.log(`💰 [POSTBACK API] Incrementing FTD for campaign: ${existingCampaign.name}`)
            } else {
              console.log(`⚠️ [POSTBACK API] FTD not configured for campaign: ${existingCampaign.name}`)
            }
          }

          // Handle other common conversion types
          if (conversionTypeLower.includes('areg') || conversionTypeLower.includes('approved_registration')) {
            if (existingCampaign.approvedRegistrations !== null) {
              updateCampaignData.approvedRegistrations = { increment: 1 }
              console.log(`✅ [POSTBACK API] Incrementing approved registrations for campaign: ${existingCampaign.name}`)
            } else {
              console.log(`⚠️ [POSTBACK API] Approved registrations not configured for campaign: ${existingCampaign.name}`)
            }
          }

          if (conversionTypeLower.includes('qftd') || conversionTypeLower.includes('qualified_deposit')) {
            if (existingCampaign.qualifiedDeposits !== null) {
              updateCampaignData.qualifiedDeposits = { increment: 1 }
              console.log(`💎 [POSTBACK API] Incrementing qualified deposits for campaign: ${existingCampaign.name}`)
            } else {
              console.log(`⚠️ [POSTBACK API] Qualified deposits not configured for campaign: ${existingCampaign.name}`)
            }
          }
        }

        if (Object.keys(updateCampaignData).length > 0) {
          await prisma.campaign.update({
            where: { id: existingCampaign.id },
            data: updateCampaignData
          })
          console.log(`📈 [POSTBACK API] Updated campaign stats for: ${existingCampaign.name} (${validatedData.type}, matched: ${finalCampaign})`)
        }
      } else {
        console.log(`⚠️ [POSTBACK API] Campaign not found: ${finalCampaign}`)
      }
    }

    // Update journey stage if this is a deposit/FTD
    const conversionTypeLower = (validatedData.type || 'conversion').toLowerCase()
    if (conversionTypeLower.includes('deposit') || conversionTypeLower.includes('ftd')) {
      console.log('🎯 [POSTBACK API] Detected deposit/FTD, updating journey stages...')

      // Find all journey states for this customer
      const journeyStates = await prisma.customerJourneyState.findMany({
        where: { customerId: customer.id }
      })

      for (const journeyState of journeyStates) {
        // Only update if in acquisition stage (-1 or 0)
        if (journeyState.stage <= 0 && journeyState.currentJourney === 'acquisition') {
          console.log(`🔄 [POSTBACK API] Updating journey for operator ${journeyState.operatorId}: stage ${journeyState.stage} → 1, acquisition → retention`)

          // Update to retention journey, stage 1
          await prisma.customerJourneyState.update({
            where: { id: journeyState.id },
            data: {
              stage: 1,
              currentJourney: 'retention',
              depositCount: { increment: 1 },
              totalDepositValue: { increment: validatedData.value || 0 },
              lastDepositAt: new Date()
            }
          })

          // Cancel pending acquisition messages
          await prisma.journeyMessage.updateMany({
            where: {
              journeyStateId: journeyState.id,
              status: { in: ['PENDING', 'SCHEDULED'] },
              journeyType: 'ACQUISITION'
            },
            data: {
              status: 'CANCELLED'
            }
          })

          // Start retention journey (schedule retention messages)
          try {
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3005'}/api/journey/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerId: customer.id,
                operatorId: journeyState.operatorId,
                journeyType: 'retention',
                operatorName: journeyState.operatorId.charAt(0).toUpperCase() + journeyState.operatorId.slice(1)
              })
            })
            console.log(`✅ [POSTBACK API] Started retention journey for ${journeyState.operatorId}`)
          } catch (err) {
            console.error('⚠️ [POSTBACK API] Failed to start retention journey:', err)
          }
        }
      }
    }

    // Forward to Redtrack (async, don't wait for response)
    console.log('🔗 [POSTBACK API] Forwarding to Redtrack...')
    let redtrackForwarded = false
    try {
      const redtrackUrl = 'https://track.todoalrojo.club/postback'
      const redtrackData = new URLSearchParams({
        clickid: validatedData.clickid,
        status: validatedData.status || 'approved',
        type: validatedData.type || 'Deposit'
      }).toString()

      // Fire and forget to Redtrack
      fetch(`${redtrackUrl}?${redtrackData}`, {
        method: 'GET',
        headers: { 'User-Agent': 'CRM-Postback-Forwarder/1.0' }
      }).then(() => {
        console.log('✅ [POSTBACK API] Redtrack forward successful')
      }).catch(err => console.log('⚠️ [POSTBACK API] Redtrack forward failed:', err.message))

      redtrackForwarded = true
      console.log('✅ [POSTBACK API] Redtrack forward initiated')
    } catch (redtrackError) {
      console.log('⚠️ [POSTBACK API] Redtrack forward error:', redtrackError)
    }

    // Forward to Zapier webhook (async, don't wait for response)
    console.log('🔗 [POSTBACK API] Forwarding to Zapier webhook...')
    let zapierForwarded = false
    try {
      const zapierUrl = 'https://hooks.zapier.com/hooks/catch/23120323/udholkd/'
      const zapierData = new URLSearchParams({
        clickid: validatedData.clickid,
        status: validatedData.status || 'approved',
        type: validatedData.type || 'Conversion',
        value: validatedData.value?.toString() || '0',
        campaign: finalCampaign || 'unknown',
        source: validatedData.source || latestLead?.source || 'unknown'
      }).toString()

      // Fire and forget to Zapier
      fetch(`${zapierUrl}?${zapierData}`, {
        method: 'GET',
        headers: { 'User-Agent': 'CRM-Postback-Forwarder/1.0' }
      }).catch(err => console.log('⚠️ [POSTBACK API] Zapier forward failed:', err.message))

      zapierForwarded = true
      console.log('✅ [POSTBACK API] Zapier forward initiated')
    } catch (zapierError) {
      console.log('⚠️ [POSTBACK API] Zapier forward error:', zapierError)
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
      zapierForwarded: true,
      message: 'Conversion tracked successfully and forwarded to Zapier'
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