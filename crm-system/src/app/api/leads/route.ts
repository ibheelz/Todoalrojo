import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const leadsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  campaign: z.string().optional(),
  source: z.string().optional(),
  country: z.string().optional(),
  isDuplicate: z.string().optional(),
  qualityScore: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = leadsQuerySchema.parse(Object.fromEntries(searchParams))

    const page = parseInt(params.page)
    const limit = parseInt(params.limit)
    const skip = (page - 1) * limit

    console.log('📋 Fetching leads with parameters:', {
      page,
      limit,
      campaign: params.campaign,
      source: params.source,
      country: params.country,
      isDuplicate: params.isDuplicate,
      qualityScore: params.qualityScore,
      search: params.search,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      timestamp: new Date().toISOString()
    })

    // Build where clause
    const where: any = {}

    if (params.campaign) {
      where.campaign = { contains: params.campaign, mode: 'insensitive' }
    }

    if (params.source) {
      where.source = { contains: params.source, mode: 'insensitive' }
    }

    if (params.country) {
      where.country = params.country
    }

    if (params.isDuplicate) {
      where.isDuplicate = params.isDuplicate === 'true'
    }

    if (params.qualityScore) {
      const score = parseInt(params.qualityScore)
      where.qualityScore = { gte: score }
    }

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) {
        where.createdAt.gte = new Date(params.dateFrom)
      }
      if (params.dateTo) {
        where.createdAt.lte = new Date(params.dateTo)
      }
    }

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    console.log('🔍 Applying where conditions for leads:', {
      whereConditions: where,
      totalConditions: Object.keys(where).length
    })

    // Get leads with user data and enhanced customer information
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              masterEmail: true,
              masterPhone: true,
              firstName: true,
              lastName: true,
              totalRevenue: true,
              profileImage: true,
              source: true,
              country: true,
              _count: {
                select: {
                  clicks: true,
                  events: true,
                  leads: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where })
    ])

    console.log('📊 Leads data loaded:', {
      totalLeads: leads.length,
      totalCount: total,
      recognizedCustomers: leads.filter(l => l.customer).length,
      duplicateLeads: leads.filter(l => l.isDuplicate).length,
      avgQualityScore: leads.reduce((sum, l) => sum + (l.qualityScore || 0), 0) / leads.length
    })

    // Get filter options with campaign stats
    const [campaigns, sources, countries, campaignStats] = await Promise.all([
      prisma.lead.findMany({
        where: { campaign: { not: null } },
        select: { campaign: true },
        distinct: ['campaign'],
        orderBy: { campaign: 'asc' }
      }),
      prisma.lead.findMany({
        where: { source: { not: null } },
        select: { source: true },
        distinct: ['source'],
        orderBy: { source: 'asc' }
      }),
      prisma.lead.findMany({
        where: { country: { not: null } },
        select: { country: true },
        distinct: ['country'],
        orderBy: { country: 'asc' }
      }),
      // Get campaign statistics
      prisma.lead.groupBy({
        by: ['campaign'],
        where: { campaign: { not: null } },
        _count: { campaign: true },
        _avg: { qualityScore: true },
        _sum: { value: true },
        orderBy: { _count: { campaign: 'desc' } }
      })
    ])

    console.log('✅ Lead filters and stats calculated:', {
      campaignsAvailable: campaigns.length,
      sourcesAvailable: sources.length,
      countriesAvailable: countries.length,
      campaignStatsCalculated: campaignStats.length,
      topCampaign: campaignStats[0]?.campaign || 'None',
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        campaigns: campaigns.map(c => c.campaign).filter(Boolean),
        sources: sources.map(s => s.source).filter(Boolean),
        countries: countries.map(c => c.country).filter(Boolean)
      },
      stats: {
        totalLeads: total,
        currentPageLeads: leads.length,
        recognizedCustomers: leads.filter(l => l.customer).length,
        duplicateLeads: leads.filter(l => l.isDuplicate).length,
        avgQualityScore: Math.round((leads.reduce((sum, l) => sum + (l.qualityScore || 0), 0) / leads.length) * 100) / 100,
        totalValue: leads.reduce((sum, l) => sum + (l.value || 0), 0),
        campaignStats: campaignStats.map(cs => ({
          campaign: cs.campaign,
          count: cs._count.campaign,
          avgQualityScore: Math.round((cs._avg.qualityScore || 0) * 100) / 100,
          totalValue: Number(cs._sum.value || 0)
        }))
      }
    })

  } catch (error) {
    console.error('❌ Get leads error:', error)
    console.error('📊 Error details:', {
      name: error?.constructor?.name,
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'), // Limit stack trace
      timestamp: new Date().toISOString()
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch leads'
    }, { status: 500 })
  }
}