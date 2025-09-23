import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { incrementCampaignCounters, incrementInfluencerCountersByClickId } from '@/lib/attribution'

export const dynamic = 'force-dynamic'

const leadFormSchema = z.object({
  // Form data
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  countryCode: z.string().min(1, 'Country code is required'),
  ageVerification: z.boolean(),
  promotionalConsent: z.boolean().optional().default(false),

  // Verification status
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),

  // Tracking data
  clickId: z.string().optional(),
  campaign: z.string().optional(),
  source: z.string().optional(),
  landingPage: z.string().optional(),
  redirectUrl: z.string().optional(),
  referrer: z.string().optional(),

  // Geo data
  ip: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  userAgent: z.string().optional(),
  language: z.string().optional(),
  platform: z.string().optional(),

  // Timestamps
  timestamp: z.string().optional(),

  // External IDs
  airtableId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [LEAD-FORM] Processing lead form submission')

    const body = await request.json()
    console.log('📝 [LEAD-FORM] Request body:', body)

    // Validate input
    const validatedData = leadFormSchema.parse(body)
    console.log('✅ [LEAD-FORM] Data validated:', validatedData)

    // Extract names from fullName
    const names = validatedData.fullName.trim().split(' ')
    const firstName = names[0] || ''
    const lastName = names.slice(1).join(' ') || ''

    // Format phone number
    const fullPhone = `${validatedData.countryCode} ${validatedData.phone.replace(/\D/g, '')}`

    // Create or find customer based on click_id, email, or phone
    let customer = null

    // First try to find by click_id if provided
    if (validatedData.clickId) {
      console.log('🔍 [LEAD-FORM] Looking for customer by click_id:', validatedData.clickId)

      // Check if we have a click record with this click_id
      const clickRecord = await prisma.click.findUnique({
        where: { clickId: validatedData.clickId },
        include: { customer: true }
      })

      if (clickRecord && clickRecord.customer) {
        customer = clickRecord.customer
        console.log('👤 [LEAD-FORM] Found existing customer via click_id:', customer.id)
      }
    }

    // If no customer found by click_id, try by email
    if (!customer && validatedData.email) {
      console.log('🔍 [LEAD-FORM] Looking for customer by email:', validatedData.email)

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
        console.log('👤 [LEAD-FORM] Found existing customer via email:', customer.id)
      }
    }

    // If no customer found by email, try by phone
    if (!customer && fullPhone) {
      console.log('🔍 [LEAD-FORM] Looking for customer by phone:', fullPhone)

      const identifier = await prisma.identifier.findUnique({
        where: {
          type_value: {
            type: 'PHONE',
            value: fullPhone
          }
        },
        include: { customer: true }
      })

      if (identifier) {
        customer = identifier.customer
        console.log('👤 [LEAD-FORM] Found existing customer via phone:', customer.id)
      }
    }

    // Create new customer if none found
    if (!customer) {
      console.log('➕ [LEAD-FORM] Creating new customer')

      customer = await prisma.customer.create({
        data: {
          masterEmail: validatedData.email?.toLowerCase(),
          masterPhone: fullPhone,
          firstName,
          lastName,
          source: validatedData.source || 'lead-form',
          country: validatedData.country,
          city: validatedData.city,
          language: validatedData.language,
          totalLeads: 1,
        }
      })

      console.log('✅ [LEAD-FORM] Created new customer:', customer.id)

      // Create identifiers for the new customer
      const identifiersToCreate = []

      if (validatedData.email) {
        identifiersToCreate.push({
          customerId: customer.id,
          type: 'EMAIL',
          value: validatedData.email.toLowerCase(),
          isVerified: validatedData.emailVerified,
          isPrimary: true,
          source: validatedData.source
        })
      }

      if (fullPhone) {
        identifiersToCreate.push({
          customerId: customer.id,
          type: 'PHONE',
          value: fullPhone,
          isVerified: validatedData.phoneVerified,
          isPrimary: true,
          source: validatedData.source
        })
      }

      if (validatedData.clickId) {
        identifiersToCreate.push({
          customerId: customer.id,
          type: 'CLICK_ID',
          value: validatedData.clickId,
          isVerified: true,
          source: validatedData.source
        })
      }

      if (identifiersToCreate.length > 0) {
        await prisma.identifier.createMany({
          data: identifiersToCreate
        })
        console.log('🆔 [LEAD-FORM] Created identifiers:', identifiersToCreate.length)
      }
    } else {
      // Update existing customer
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalLeads: { increment: 1 },
          lastSeen: new Date(),
          // Update fields if they were empty
          firstName: customer.firstName || firstName,
          lastName: customer.lastName || lastName,
          country: customer.country || validatedData.country,
          city: customer.city || validatedData.city,
          language: customer.language || validatedData.language,
        }
      })
      console.log('🔄 [LEAD-FORM] Updated existing customer:', customer.id)
    }

    // Create the lead record
    console.log('📋 [LEAD-FORM] Creating lead record')

    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        email: validatedData.email?.toLowerCase(),
        phone: fullPhone,
        firstName,
        lastName,
        clickId: validatedData.clickId,
        campaign: validatedData.campaign,
        source: validatedData.source || 'direct',
        ip: validatedData.ip || '',
        userAgent: validatedData.userAgent,
        referrer: validatedData.referrer,
        landingPage: validatedData.landingPage,
        country: validatedData.country,
        city: validatedData.city,
        isEmailValid: true,
        isPhoneValid: true,
        customFields: {
          countryCode: validatedData.countryCode,
          redirectUrl: validatedData.redirectUrl,
          language: validatedData.language,
          platform: validatedData.platform,
          isEmailVerified: validatedData.emailVerified,
          isPhoneVerified: validatedData.phoneVerified,
          ageVerification: validatedData.ageVerification,
          promotionalConsent: validatedData.promotionalConsent,
          submissionSource: 'lead-form',
          airtableId: validatedData.airtableId
        },
      }
    })

    console.log('✅ [LEAD-FORM] Created lead record:', lead.id)

    // Create LEAD event for journey tracking
    console.log('📊 [LEAD-FORM] Creating LEAD event')

    await prisma.event.create({
      data: {
        customerId: customer.id,
        eventType: 'LEAD',
        eventName: 'Lead Form Submission',
        category: 'conversion',
        properties: {
          formType: 'lead-form',
          emailVerified: validatedData.emailVerified,
          phoneVerified: validatedData.phoneVerified,
          ageVerification: validatedData.ageVerification,
          promotionalConsent: validatedData.promotionalConsent,
        },
        campaign: validatedData.campaign,
        source: validatedData.source,
        clickId: validatedData.clickId,
        ip: validatedData.ip,
        userAgent: validatedData.userAgent,
        pageUrl: validatedData.landingPage,
        isConverted: true,
      }
    })

    // Update campaign aggregates and influencer mapping for consistency
    await incrementCampaignCounters({ campaign: validatedData.campaign, leads: 1, clicks: 1 })
    await incrementInfluencerCountersByClickId(validatedData.clickId, { leads: 1 })

    console.log('🎉 [LEAD-FORM] Lead form submission processed successfully')

    return NextResponse.json({
      success: true,
      data: {
        customerId: customer.id,
        isNewCustomer: !customer.createdAt || (new Date().getTime() - customer.createdAt.getTime()) < 5000,
      }
    })

  } catch (error) {
    console.error('❌ [LEAD-FORM] Error processing lead form:', error)

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
