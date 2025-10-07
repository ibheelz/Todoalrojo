import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import OperatorService from '@/lib/operator-service'
import { cache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  slug: z.string().min(1, 'Campaign slug is required'),
  description: z.string().optional(),
  clientId: z.string().optional(),
  brandId: z.string().optional(),
  logoUrl: z.string().optional(),
  influencerIds: z.array(z.string()).optional(),
  conversionTypes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string()
  })).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'
    const dateFilter = searchParams.get('dateFilter') || 'all'
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // Generate cache key based on query params
    const cacheKey = `campaigns:${includeStats}:${dateFilter}:${fromDate}:${toDate}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Calculate date range for filtering metrics
    let dateWhere = {}
    if (dateFilter && dateFilter !== 'all') {
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      switch (dateFilter) {
        case 'today':
          dateWhere = { createdAt: { gte: startOfToday } }
          break
        case 'yesterday':
          const startOfYesterday = new Date(startOfToday)
          startOfYesterday.setDate(startOfYesterday.getDate() - 1)
          dateWhere = {
            createdAt: {
              gte: startOfYesterday,
              lt: startOfToday
            }
          }
          break
        case 'last7days':
          const sevenDaysAgo = new Date(startOfToday)
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          dateWhere = { createdAt: { gte: sevenDaysAgo } }
          break
        case 'last30days':
          const thirtyDaysAgo = new Date(startOfToday)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          dateWhere = { createdAt: { gte: thirtyDaysAgo } }
          break
        case 'custom':
          if (fromDate && toDate) {
            const from = new Date(fromDate)
            const to = new Date(toDate)
            to.setHours(23, 59, 59, 999) // Include the entire 'to' date
            dateWhere = {
              createdAt: {
                gte: from,
                lte: to
              }
            }
          }
          break
      }
    }

    if (includeStats) {
      // Get campaigns with detailed analytics - select only needed fields
      const campaigns = await prisma.campaign.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          clientId: true,
          brandId: true,
          logoUrl: true,
          isActive: true,
          status: true,
          conversionTypes: true,
          createdAt: true,
          updatedAt: true,
          resetAt: true,
          registrations: true,
          ftd: true,
          approvedRegistrations: true,
          qualifiedDeposits: true,
          campaignInfluencers: {
            select: {
              influencer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  platform: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // OPTIMIZED: Get all stats in bulk queries instead of per-campaign
      const campaignSlugs = campaigns.map(c => c.slug)

      // Build date filter condition
      let clickStatsRaw: any[] = []
      let leadStatsRaw: any[] = []
      let eventStatsRaw: any[] = []

      if (Object.keys(dateWhere).length > 0) {
        const filter = (dateWhere as any).createdAt
        if (filter?.gte && filter?.lt) {
          // Get all click stats in ONE query with date range
          clickStatsRaw = await prisma.$queryRaw`
            SELECT campaign,
                   COUNT(*)::int as total,
                   COUNT(CASE WHEN "isFraud" = true THEN 1 END)::int as fraud
            FROM clicks
            WHERE campaign = ANY(${campaignSlugs}::text[])
              AND "createdAt" >= ${filter.gte}
              AND "createdAt" < ${filter.lt}
            GROUP BY campaign`

          leadStatsRaw = await prisma.$queryRaw`
            SELECT campaign,
                   COUNT(*)::int as total,
                   COALESCE(SUM(value), 0)::numeric as total_value,
                   COALESCE(AVG("qualityScore"), 0)::numeric as avg_quality,
                   COUNT(CASE WHEN "isDuplicate" = true THEN 1 END)::int as duplicates
            FROM leads
            WHERE campaign = ANY(${campaignSlugs}::text[])
              AND "createdAt" >= ${filter.gte}
              AND "createdAt" < ${filter.lt}
            GROUP BY campaign`

          eventStatsRaw = await prisma.$queryRaw`
            SELECT campaign,
                   COUNT(*)::int as total,
                   COALESCE(SUM(value), 0)::numeric as total_value,
                   COUNT(CASE WHEN "eventType" IN ('registration', 'signup', 'register') THEN 1 END)::int as registrations,
                   COUNT(DISTINCT CASE WHEN ("eventType" IN ('deposit', 'ftd', 'first_deposit') OR "eventName" IN ('deposit', 'ftd', 'first_deposit')) AND "isRevenue" = true THEN "customerId" END)::int as ftd
            FROM events
            WHERE campaign = ANY(${campaignSlugs}::text[])
              AND "createdAt" >= ${filter.gte}
              AND "createdAt" < ${filter.lt}
            GROUP BY campaign`
        } else if (filter?.gte && filter?.lte) {
          clickStatsRaw = await prisma.$queryRaw`
            SELECT campaign,
                   COUNT(*)::int as total,
                   COUNT(CASE WHEN "isFraud" = true THEN 1 END)::int as fraud
            FROM clicks
            WHERE campaign = ANY(${campaignSlugs}::text[])
              AND "createdAt" >= ${filter.gte}
              AND "createdAt" <= ${filter.lte}
            GROUP BY campaign`

          leadStatsRaw = await prisma.$queryRaw`
            SELECT campaign,
                   COUNT(*)::int as total,
                   COALESCE(SUM(value), 0)::numeric as total_value,
                   COALESCE(AVG("qualityScore"), 0)::numeric as avg_quality,
                   COUNT(CASE WHEN "isDuplicate" = true THEN 1 END)::int as duplicates
            FROM leads
            WHERE campaign = ANY(${campaignSlugs}::text[])
              AND "createdAt" >= ${filter.gte}
              AND "createdAt" <= ${filter.lte}
            GROUP BY campaign`

          eventStatsRaw = await prisma.$queryRaw`
            SELECT campaign,
                   COUNT(*)::int as total,
                   COALESCE(SUM(value), 0)::numeric as total_value,
                   COUNT(CASE WHEN "eventType" IN ('registration', 'signup', 'register') THEN 1 END)::int as registrations,
                   COUNT(DISTINCT CASE WHEN ("eventType" IN ('deposit', 'ftd', 'first_deposit') OR "eventName" IN ('deposit', 'ftd', 'first_deposit')) AND "isRevenue" = true THEN "customerId" END)::int as ftd
            FROM events
            WHERE campaign = ANY(${campaignSlugs}::text[])
              AND "createdAt" >= ${filter.gte}
              AND "createdAt" <= ${filter.lte}
            GROUP BY campaign`
        } else if (filter?.gte) {
          clickStatsRaw = await prisma.$queryRaw`
            SELECT campaign,
                   COUNT(*)::int as total,
                   COUNT(CASE WHEN "isFraud" = true THEN 1 END)::int as fraud
            FROM clicks
            WHERE campaign = ANY(${campaignSlugs}::text[])
              AND "createdAt" >= ${filter.gte}
            GROUP BY campaign`

          leadStatsRaw = await prisma.$queryRaw`
            SELECT campaign,
                   COUNT(*)::int as total,
                   COALESCE(SUM(value), 0)::numeric as total_value,
                   COALESCE(AVG("qualityScore"), 0)::numeric as avg_quality,
                   COUNT(CASE WHEN "isDuplicate" = true THEN 1 END)::int as duplicates
            FROM leads
            WHERE campaign = ANY(${campaignSlugs}::text[])
              AND "createdAt" >= ${filter.gte}
            GROUP BY campaign`

          eventStatsRaw = await prisma.$queryRaw`
            SELECT campaign,
                   COUNT(*)::int as total,
                   COALESCE(SUM(value), 0)::numeric as total_value,
                   COUNT(CASE WHEN "eventType" IN ('registration', 'signup', 'register') THEN 1 END)::int as registrations,
                   COUNT(DISTINCT CASE WHEN ("eventType" IN ('deposit', 'ftd', 'first_deposit') OR "eventName" IN ('deposit', 'ftd', 'first_deposit')) AND "isRevenue" = true THEN "customerId" END)::int as ftd
            FROM events
            WHERE campaign = ANY(${campaignSlugs}::text[])
              AND "createdAt" >= ${filter.gte}
            GROUP BY campaign`
        }
      } else {
        // No date filter - get all stats
        clickStatsRaw = await prisma.$queryRaw`
          SELECT campaign,
                 COUNT(*)::int as total,
                 COUNT(CASE WHEN "isFraud" = true THEN 1 END)::int as fraud
          FROM clicks
          WHERE campaign = ANY(${campaignSlugs}::text[])
          GROUP BY campaign`

        leadStatsRaw = await prisma.$queryRaw`
          SELECT campaign,
                 COUNT(*)::int as total,
                 COALESCE(SUM(value), 0)::numeric as total_value,
                 COALESCE(AVG("qualityScore"), 0)::numeric as avg_quality,
                 COUNT(CASE WHEN "isDuplicate" = true THEN 1 END)::int as duplicates
          FROM leads
          WHERE campaign = ANY(${campaignSlugs}::text[])
          GROUP BY campaign`

        eventStatsRaw = await prisma.$queryRaw`
          SELECT campaign,
                 COUNT(*)::int as total,
                 COALESCE(SUM(value), 0)::numeric as total_value,
                 COUNT(CASE WHEN "eventType" IN ('registration', 'signup', 'register') THEN 1 END)::int as registrations,
                 COUNT(DISTINCT CASE WHEN ("eventType" IN ('deposit', 'ftd', 'first_deposit') OR "eventName" IN ('deposit', 'ftd', 'first_deposit')) AND "isRevenue" = true THEN "customerId" END)::int as ftd
          FROM events
          WHERE campaign = ANY(${campaignSlugs}::text[])
          GROUP BY campaign`
      }

      // Build lookup maps for O(1) access
      const clickMap = new Map(clickStatsRaw.map(r => [r.campaign, r]))
      const leadMap = new Map(leadStatsRaw.map(r => [r.campaign, r]))
      const eventMap = new Map(eventStatsRaw.map(r => [r.campaign, r]))

      // Transform campaigns with stats (no more async operations needed!)
      const campaignsWithStats = campaigns.map((campaign) => {
        const clicks = clickMap.get(campaign.slug) || { total: 0, fraud: 0 }
        const leads = leadMap.get(campaign.slug) || { total: 0, total_value: 0, avg_quality: 0, duplicates: 0 }
        const events = eventMap.get(campaign.slug) || { total: 0, total_value: 0, registrations: 0, ftd: 0 }

        const totalClicks = clicks.total || 0
        const totalLeads = leads.total || 0
        const totalEvents = events.total || 0
        const registrations = events.registrations || 0
        const ftd = events.ftd || 0
        const fraudClicks = clicks.fraud || 0
        const duplicateLeads = leads.duplicates || 0

        const conversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0
        const duplicateRate = totalLeads > 0 ? (duplicateLeads / totalLeads) * 100 : 0
        const fraudRate = totalClicks > 0 ? (fraudClicks / totalClicks) * 100 : 0

        return {
          ...campaign,
          influencerIds: campaign.campaignInfluencers.map(ci => ci.influencer.id),
          influencers: campaign.campaignInfluencers.map(ci => ci.influencer),
          stats: {
            totalClicks,
            totalLeads,
            totalEvents,
            registrations,
            ftd,
            approvedRegistrations: campaign.approvedRegistrations || 0,
            qualifiedDeposits: campaign.qualifiedDeposits || 0,
            uniqueCustomers: 0, // Not calculated in bulk for performance
            duplicateLeads,
            fraudClicks,
            conversionRate: Math.round(conversionRate * 100) / 100,
            duplicateRate: Math.round(duplicateRate * 100) / 100,
            fraudRate: Math.round(fraudRate * 100) / 100,
            avgQualityScore: Math.round(Number(leads.avg_quality || 0) * 100) / 100,
            totalLeadValue: Number(leads.total_value || 0),
            totalEventValue: Number(events.total_value || 0),
            totalRevenue: Number(leads.total_value || 0) + Number(events.total_value || 0)
          }
        }
      })

      const result = {
        success: true,
        campaigns: campaignsWithStats
      }
      cache.set(cacheKey, result, 300) // 5 minute TTL for faster repeated loads
      return NextResponse.json(result)
    } else {
      // Get basic campaign list with only necessary fields
      const campaigns = await prisma.campaign.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          clientId: true,
          brandId: true,
          logoUrl: true,
          isActive: true,
          status: true,
          conversionTypes: true,
          createdAt: true,
          updatedAt: true,
          registrations: true,
          ftd: true,
          approvedRegistrations: true,
          qualifiedDeposits: true,
          campaignInfluencers: {
            select: {
              influencer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  platform: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Transform campaigns to include influencer data
      const transformedCampaigns = campaigns.map(campaign => ({
        ...campaign,
        influencerIds: campaign.campaignInfluencers.map(ci => ci.influencer.id),
        influencers: campaign.campaignInfluencers.map(ci => ci.influencer)
      }))

      const result = {
        success: true,
        campaigns: transformedCampaigns
      }
      cache.set(cacheKey, result, 300) // 5 minute TTL for faster repeated loads
      return NextResponse.json(result)
    }

  } catch (error) {
    console.error('Get campaigns error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch campaigns'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCampaignSchema.parse(body)

    // Clear cache when creating new campaign
    cache.clear()

    // Check if slug already exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingCampaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign slug already exists'
      }, { status: 400 })
    }

    // Add comprehensive console debugging
    console.log('📊 Creating new campaign:', {
      name: validatedData.name,
      slug: validatedData.slug,
      influencerIds: validatedData.influencerIds,
      timestamp: new Date().toISOString()
    })

    // Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        clientId: validatedData.clientId,
        brandId: validatedData.brandId,
        logoUrl: validatedData.logoUrl,
        conversionTypes: validatedData.conversionTypes || []
      }
    })

    // Auto-create operator from brand
    let operator = null
    if (validatedData.brandId) {
      try {
        // Check if operator already exists for this brand
        const existingOperator = await OperatorService.getOperator(validatedData.brandId)

        if (!existingOperator) {
          // Create new operator for this brand
          operator = await OperatorService.createOperator({
            clientId: validatedData.clientId || 'default-client',
            name: validatedData.name, // Use campaign name as operator name
            slug: validatedData.brandId, // Use brandId as slug
            brand: validatedData.name,
            emailDomain: `${validatedData.slug}.com`,
            emailFromName: validatedData.name,
            emailFromAddress: `noreply@${validatedData.slug}.com`,
            logoUrl: validatedData.logoUrl,
            smsEnabled: true,
            smsProvider: 'laaffic',
            smsSender: validatedData.name.substring(0, 11).toUpperCase(), // SMS sender max 11 chars
            protectHighValue: true,
            recycleAfterDays: 30,
            minStageForRecycle: -1,
            maxStageForRecycle: 1,
          })

          console.log('🏢 Auto-created operator for brand:', {
            operatorId: operator.id,
            brandId: validatedData.brandId,
            name: validatedData.name,
          })
        } else {
          operator = existingOperator
          console.log('🏢 Using existing operator for brand:', {
            operatorId: existingOperator.id,
            brandId: validatedData.brandId,
          })
        }
      } catch (error) {
        console.error('Failed to auto-create operator:', error)
        // Continue even if operator creation fails
      }
    }

    // Create influencer relationships if provided
    if (validatedData.influencerIds && validatedData.influencerIds.length > 0) {
      const influencerRelationships = validatedData.influencerIds.map(influencerId => ({
        campaignId: campaign.id,
        influencerId: influencerId,
        assignedBy: 'api-create'
      }))

      await prisma.campaignInfluencer.createMany({
        data: influencerRelationships
      })
    }

    console.log('✅ Campaign created successfully:', {
      id: campaign.id,
      name: campaign.name,
      influencerIds: validatedData.influencerIds,
      operatorId: operator?.id,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      campaign
    })

  } catch (error) {
    console.error('Create campaign error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create campaign'
    }, { status: 500 })
  }
}
