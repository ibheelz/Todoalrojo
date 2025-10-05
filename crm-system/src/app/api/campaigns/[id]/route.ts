import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { cache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

const updateCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').optional(),
  slug: z.string().min(1, 'Campaign slug is required').optional(),
  description: z.string().optional(),
  clientId: z.string().optional(),
  brandId: z.string().optional(),
  logoUrl: z.string().optional(),
  conversionTypes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string()
  })).optional(),
  // Conversion configuration for enabling/disabling conversion types
  conversionConfig: z.object({
    registrations: z.number().nullable().optional(),
    ftd: z.number().nullable().optional(),
    approvedRegistrations: z.number().nullable().optional(),
    qualifiedDeposits: z.number().nullable().optional()
  }).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    // Check cache
    const cacheKey = `campaign:${campaignId}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get campaign with stats
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign not found'
      }, { status: 404 })
    }

    // Get campaign stats
    const [clicks, leads, events] = await Promise.all([
      prisma.click.count({ where: { campaign: campaign.slug } }),
      prisma.lead.count({ where: { campaign: campaign.slug } }),
      prisma.event.count({ where: { campaign: campaign.slug } })
    ])

    // Get unique users
    const allClickCustomers = await prisma.click.findMany({
      where: { campaign: campaign.slug },
      select: { customerId: true },
      distinct: ['customerId']
    })

    const allLeadCustomers = await prisma.lead.findMany({
      where: { campaign: campaign.slug },
      select: { customerId: true },
      distinct: ['customerId']
    })

    const allEventCustomers = await prisma.event.findMany({
      where: { campaign: campaign.slug },
      select: { customerId: true },
      distinct: ['customerId']
    })

    const uniqueCustomerIds = new Set([
      ...allClickCustomers.filter(c => c.customerId).map(c => c.customerId),
      ...allLeadCustomers.filter(c => c.customerId).map(c => c.customerId),
      ...allEventCustomers.filter(c => c.customerId).map(c => c.customerId)
    ])

    // Get quality metrics
    const [duplicateLeads, fraudClicks, leadStats, eventStats] = await Promise.all([
      prisma.lead.count({ where: { campaign: campaign.slug, isDuplicate: true } }),
      prisma.click.count({ where: { campaign: campaign.slug, isFraud: true } }),
      prisma.lead.aggregate({
        where: { campaign: campaign.slug },
        _avg: { qualityScore: true },
        _sum: { value: true }
      }),
      prisma.event.aggregate({
        where: { campaign: campaign.slug },
        _sum: { value: true }
      })
    ])

    const stats = {
      totalClicks: clicks,
      totalLeads: leads,
      totalEvents: events,
      uniqueUsers: uniqueCustomerIds.size,
      duplicateLeads,
      fraudClicks,
      conversionRate: clicks > 0 ? (events / clicks) * 100 : 0,
      duplicateRate: leads > 0 ? (duplicateLeads / leads) * 100 : 0,
      fraudRate: clicks > 0 ? (fraudClicks / clicks) * 100 : 0,
      avgQualityScore: leadStats._avg.qualityScore || 0,
      totalLeadValue: Number(leadStats._sum.value || 0),
      totalEventValue: Number(eventStats._sum.value || 0),
      totalRevenue: Number(eventStats._sum.value || 0)
    }

    const result = {
      success: true,
      campaign: {
        ...campaign,
        stats
      }
    }

    cache.set(cacheKey, result, 180) // 3 minute TTL
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Get campaign error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch campaign',
      details: error?.message
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log('📝 [CAMPAIGN API] Update request body:', JSON.stringify(body, null, 2))
    const validatedData = updateCampaignSchema.parse(body)

    // Clear cache when updating campaign
    cache.delete(`campaign:${params.id}`)
    cache.clear()

    // Build update data with only valid Campaign schema fields
    const updateData: {
      name?: string
      slug?: string
      description?: string | null
      clientId?: string | null
      brandId?: string | null
      logoUrl?: string | null
      conversionTypes?: any
      registrations?: number | null
      ftd?: number | null
      approvedRegistrations?: number | null
      qualifiedDeposits?: number | null
    } = {}

    // Basic campaign fields
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.slug) updateData.slug = validatedData.slug
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.clientId !== undefined) updateData.clientId = validatedData.clientId
    if (validatedData.brandId !== undefined) updateData.brandId = validatedData.brandId
    if (validatedData.logoUrl !== undefined) updateData.logoUrl = validatedData.logoUrl
    if (validatedData.conversionTypes !== undefined) updateData.conversionTypes = validatedData.conversionTypes

    // Handle conversion configuration updates - only include fields that are being set
    if (validatedData.conversionConfig) {
      const { conversionConfig } = validatedData

      // Handle conversion type updates - use 0 for "deleted" types since null causes database errors
      if ('registrations' in conversionConfig) {
        updateData.registrations = conversionConfig.registrations === null ? 0 : conversionConfig.registrations
      }
      if ('ftd' in conversionConfig) {
        updateData.ftd = conversionConfig.ftd === null ? 0 : conversionConfig.ftd
      }
      if ('approvedRegistrations' in conversionConfig) {
        updateData.approvedRegistrations = conversionConfig.approvedRegistrations === null ? 0 : conversionConfig.approvedRegistrations
      }
      if ('qualifiedDeposits' in conversionConfig) {
        updateData.qualifiedDeposits = conversionConfig.qualifiedDeposits === null ? 0 : conversionConfig.qualifiedDeposits
      }
    }

    console.log('📝 [CAMPAIGN API] Final update data:', JSON.stringify(updateData, null, 2))

    // First get the current campaign to see what's in the database
    const currentCampaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        registrations: true,
        ftd: true,
        approvedRegistrations: true,
        qualifiedDeposits: true
      }
    })
    console.log('📝 [CAMPAIGN API] Current campaign values:', JSON.stringify(currentCampaign, null, 2))

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: updateData
    })

    console.log(`📝 [CAMPAIGN API] Updated campaign conversion configuration for: ${campaign.name}`, {
      conversions: {
        registrations: campaign.registrations,
        ftd: campaign.ftd,
        approvedRegistrations: campaign.approvedRegistrations,
        qualifiedDeposits: campaign.qualifiedDeposits
      }
    })

    return NextResponse.json({
      success: true,
      campaign
    })

  } catch (error) {
    console.error('❌ [CAMPAIGN API] Update campaign error:', error)
    console.error('❌ [CAMPAIGN API] Error type:', error?.constructor?.name)
    console.error('❌ [CAMPAIGN API] Error message:', error?.message)

    if (error instanceof z.ZodError) {
      console.error('❌ [CAMPAIGN API] Zod validation error:', JSON.stringify(error.errors, null, 2))
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update campaign',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Clear cache when deleting campaign
    cache.delete(`campaign:${params.id}`)
    cache.clear()

    await prisma.campaign.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Delete campaign error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete campaign'
    }, { status: 500 })
  }
}