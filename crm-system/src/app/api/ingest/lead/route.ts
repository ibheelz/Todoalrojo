import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { UserService } from '@/lib/user-service'
import { incrementCampaignCounters, incrementInfluencerCountersByClickId } from '@/lib/attribution'
import { emitStats } from '@/lib/event-bus'

const leadSchema = z.object({
  // Required fields
  email: z.string().email().optional(),
  phone: z.string().optional(),
  ip: z.string(),

  // Personal data
  firstName: z.string().optional(),
  lastName: z.string().optional(),

  // Custom fields (flexible)
  customFields: z.record(z.any()).optional(),

  // Attribution
  clickId: z.string().optional(),
  campaign: z.string().optional(),
  source: z.string().optional(),
  medium: z.string().optional(),

  // Technical
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  landingPage: z.string().optional(),
  formUrl: z.string().optional(),

  // Geographic
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),

  // Client/Brand
  clientId: z.string().optional(),
  brandId: z.string().optional(),
  operatorId: z.string().optional(),

  // Value
  value: z.number().optional(),
  currency: z.string().optional(),

  // Additional identifiers
  deviceId: z.string().optional(),
  sessionId: z.string().optional(),
  fingerprint: z.string().optional(),

  // Timing
  submittedAt: z.string().datetime().optional(),
})

export async function POST(request: NextRequest) {
  console.log('🚀 [LEAD API] Starting lead ingestion process...')
  const startTime = Date.now()

  try {
    console.log('📥 [LEAD API] Parsing request body...')
    const body = await request.json()
    console.log('📄 [LEAD API] Raw request data:', JSON.stringify(body, null, 2))

    console.log('✅ [LEAD API] Validating data with schema...')
    const validatedData = leadSchema.parse(body)
    console.log('✅ [LEAD API] Validation successful:', JSON.stringify(validatedData, null, 2))

    // Validate at least one identifier
    console.log('🔍 [LEAD API] Checking for required identifiers...')
    const identifiers = {
      email: validatedData.email,
      phone: validatedData.phone,
      clickId: validatedData.clickId,
      deviceId: validatedData.deviceId
    }
    console.log('🔍 [LEAD API] Available identifiers:', identifiers)

    if (!validatedData.email && !validatedData.phone && !validatedData.clickId && !validatedData.deviceId) {
      console.log('❌ [LEAD API] No valid identifiers found')
      return NextResponse.json({
        success: false,
        error: 'At least one identifier (email, phone, clickId, or deviceId) is required'
      }, { status: 400 })
    }
    console.log('✅ [LEAD API] Valid identifiers found')

    // Find or create user
    console.log('👤 [LEAD API] Finding or creating user...')
    const userSearchData = {
      email: validatedData.email,
      phone: validatedData.phone,
      clickId: validatedData.clickId,
      deviceId: validatedData.deviceId,
      sessionId: validatedData.sessionId,
      fingerprint: validatedData.fingerprint,
      ip: validatedData.ip,
      userAgent: validatedData.userAgent,
    }
    const userProfileData = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      country: validatedData.country,
      region: validatedData.region,
      city: validatedData.city,
    }
    console.log('👤 [LEAD API] User search data:', userSearchData)
    console.log('👤 [LEAD API] User profile data:', userProfileData)

    // Temporary direct database test
    console.log('🔍 [LEAD API] Testing direct prisma access...')
    try {
      const testCustomer = await prisma.customer.findFirst({ take: 1 })
      console.log('✅ [LEAD API] Direct prisma test successful:', !!testCustomer)
    } catch (error) {
      console.log('❌ [LEAD API] Direct prisma test failed:', error)
    }

    const user = await UserService.findOrCreateUser(userSearchData, userProfileData)

    // Update identifiers with verification status from customFields
    if (user && validatedData.customFields) {
      const verificationData = {
        emailVerified: validatedData.customFields.emailVerified,
        smsVerified: validatedData.customFields.smsVerified
      }

      // Update email identifier if verified
      if (validatedData.email && verificationData.emailVerified) {
        await prisma.identifier.updateMany({
          where: {
            customerId: user.id,
            type: 'EMAIL',
            value: validatedData.email
          },
          data: { isVerified: true }
        })
      }

      // Update phone identifier if verified
      if (validatedData.phone && verificationData.smsVerified) {
        await prisma.identifier.updateMany({
          where: {
            customerId: user.id,
            type: 'PHONE',
            value: validatedData.phone
          },
          data: { isVerified: true }
        })
      }
    }
    console.log('👤 [LEAD API] User result:', user ? `Found/Created user ID: ${user.id}` : 'Failed to create user')

    if (!user) {
      throw new Error('Failed to create or find user')
    }

    // Check for duplicate leads
    console.log('🔍 [LEAD API] Checking for duplicate leads...')
    const duplicateSearchConditions = [
      validatedData.email ? { email: validatedData.email } : {},
      validatedData.phone ? { phone: validatedData.phone } : {},
    ].filter(condition => Object.keys(condition).length > 0)

    console.log('🔍 [LEAD API] Duplicate search conditions:', duplicateSearchConditions)

    const existingLead = await prisma.lead.findFirst({
      where: {
        customerId: user.id,
        OR: duplicateSearchConditions,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // within last 24 hours
        }
      }
    })

    const isDuplicate = !!existingLead
    console.log('🔍 [LEAD API] Duplicate check result:', isDuplicate ? `Duplicate found: ${existingLead?.id}` : 'No duplicates found')

    // Basic email validation
    const isEmailValid = validatedData.email ?
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validatedData.email) : false

    // Basic phone validation
    const isPhoneValid = validatedData.phone ?
      /^\+?[\d\s\-\(\)]{10,}$/.test(validatedData.phone) : false

    // Quality score calculation (0-100)
    console.log('📊 [LEAD API] Calculating quality score...')
    let qualityScore = 0
    const scoreBreakdown = []

    if (validatedData.email && isEmailValid) {
      qualityScore += 30
      scoreBreakdown.push('Valid email: +30')
    }
    if (validatedData.phone && isPhoneValid) {
      qualityScore += 30
      scoreBreakdown.push('Valid phone: +30')
    }
    if (validatedData.firstName) {
      qualityScore += 15
      scoreBreakdown.push('First name: +15')
    }
    if (validatedData.lastName) {
      qualityScore += 15
      scoreBreakdown.push('Last name: +15')
    }
    if (!isDuplicate) {
      qualityScore += 10
      scoreBreakdown.push('Not duplicate: +10')
    }

    console.log('📊 [LEAD API] Quality score breakdown:', scoreBreakdown)
    console.log('📊 [LEAD API] Final quality score:', qualityScore)

    // Create lead record
    console.log('💾 [LEAD API] Creating lead record...')
    const leadData: any = {
      customerId: user.id,
      email: validatedData.email,
      phone: validatedData.phone,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      customFields: validatedData.customFields,
      clickId: validatedData.clickId,
      campaign: validatedData.campaign,
      source: validatedData.source,
      medium: validatedData.medium,
      ip: validatedData.ip,
      userAgent: validatedData.userAgent,
      referrer: validatedData.referrer,
      landingPage: validatedData.landingPage,
      formUrl: validatedData.formUrl,
      country: validatedData.country,
      region: validatedData.region,
      city: validatedData.city,
      isEmailValid,
      isPhoneValid,
      isDuplicate,
      qualityScore,
      clientId: validatedData.clientId,
      brandId: validatedData.brandId,
      value: validatedData.value,
      currency: validatedData.currency || 'USD',
      submittedAt: validatedData.submittedAt ? new Date(validatedData.submittedAt) : new Date(),
    }

    console.log('💾 [LEAD API] Lead data to be saved:', JSON.stringify(leadData, null, 2))

    const lead = await prisma.lead.create({
      data: leadData
    })

    console.log('✅ [LEAD API] Lead created successfully:', lead.id)

    // Update user lead count and revenue
    console.log('👤 [LEAD API] Updating user statistics...')
    const updateData: any = {
      totalLeads: { increment: 1 },
      lastSeen: new Date()
    }

    if (validatedData.value && validatedData.value > 0) {
      updateData.totalRevenue = { increment: validatedData.value }
      console.log('💰 [LEAD API] Adding revenue to customer:', validatedData.value)
    }

    console.log('👤 [LEAD API] User update data:', updateData)

    const updatedUser = await prisma.customer.update({
      where: { id: user.id },
      data: updateData
    })

    console.log('✅ [LEAD API] User updated successfully:', updatedUser.id)

    // Update campaign aggregated counters consistently
    await incrementCampaignCounters({
      campaign: validatedData.campaign,
      leads: 1,
      clicks: 1,
      revenue: validatedData.value || 0
    })

    // Attribute to influencer via the short link (if clickId came from a tracked short link)
    await incrementInfluencerCountersByClickId(validatedData.clickId, { leads: 1 })
    emitStats({ type: 'lead', payload: { campaign: validatedData.campaign, clickId: validatedData.clickId } })

    // Auto-start acquisition journey if operatorId provided
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
      if (!existingJourney) {
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
            console.log(`🚀 [LEAD API] Auto-started acquisition journey for customer ${user.id} on ${validatedData.operatorId}`)
          }
        } catch (journeyError) {
          console.error('⚠️ [LEAD API] Failed to auto-start journey:', journeyError)
          // Don't fail the whole request if journey fails
        }
      }
    }

    const processingTime = Date.now() - startTime
    console.log(`🎉 [LEAD API] Lead processing completed successfully in ${processingTime}ms`)
    console.log('📤 [LEAD API] Returning success response:', {
      leadId: lead.id,
      customerId: user.id,
      isDuplicate,
      qualityScore,
      processingTime
    })

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      customerId: user.id,
      isDuplicate,
      qualityScore,
      journeyStarted,
      processingTime,
      message: 'Lead captured successfully'
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ [LEAD API] Lead capture error after ${processingTime}ms:`, error)
    console.error('❌ [LEAD API] Error stack:', error instanceof Error ? error.stack : 'No stack trace available')

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
    endpoint: 'Lead Capture',
    method: 'POST',
    description: 'Capture leads with deduplication and quality scoring'
  })
}
