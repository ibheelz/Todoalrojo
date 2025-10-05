import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('dateFilter') || 'today'
    const eventType = searchParams.get('eventType') || 'all'
    const search = searchParams.get('search') || ''
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    const campaign = searchParams.get('campaign') || 'all'

    // Check cache
    const cacheKey = `conversions:${dateFilter}:${eventType}:${search}:${fromDate}:${toDate}:${page}:${campaign}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    console.log('🔄 Fetching conversions with parameters:', {
      dateFilter,
      eventType,
      search,
      fromDate,
      toDate,
      page,
      limit,
      campaign,
      timestamp: new Date().toISOString()
    })

    // Calculate date range for filtering
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

    // Event type filtering
    let eventTypeWhere = {}
    if (eventType && eventType !== 'all') {
      eventTypeWhere = { eventType: eventType }
    }

    // Campaign filtering
    let campaignWhere = {}
    if (campaign && campaign !== 'all') {
      campaignWhere = { campaign: campaign }
    }

    // Search filtering
    let searchWhere = {}
    if (search) {
      searchWhere = {
        OR: [
          { eventName: { contains: search, mode: 'insensitive' } },
          { eventType: { contains: search, mode: 'insensitive' } },
          { campaign: { contains: search, mode: 'insensitive' } },
          { source: { contains: search, mode: 'insensitive' } },
          { customer: {
            OR: [
              { masterEmail: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }}
        ]
      }
    }

    // Combine all where conditions
    const whereConditions = {
      ...dateWhere,
      ...eventTypeWhere,
      ...campaignWhere,
      ...searchWhere
    }

    console.log('🔍 Applying where conditions for conversions:', {
      whereConditions,
      totalConditions: Object.keys(whereConditions).length
    })

    // Get events with pagination and influencer data via clickId
    const events = await prisma.event.findMany({
      where: whereConditions,
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            clicks: {
              where: {
                clickId: { not: null }
              },
              select: {
                clickId: true
              },
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    // Enrich events with influencer data by looking up clicks
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        let influencer = null

        if (event.clickId) {
          // Try to find the click and its associated influencer
          const click = await prisma.click.findUnique({
            where: { clickId: event.clickId },
            select: { id: true }
          })

          if (click) {
            // Look for link influencer association
            const linkInfluencer = await prisma.linkInfluencer.findFirst({
              where: { linkId: click.id },
              include: {
                influencer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    socialHandle: true,
                    profileImage: true
                  }
                }
              }
            })

            if (linkInfluencer) {
              influencer = linkInfluencer.influencer
            }
          }
        }

        return {
          ...event,
          influencer
        }
      })
    )

    console.log('📊 Conversions data loaded:', {
      totalEvents: events.length,
      recognizedCustomers: events.filter(e => e.customer).length,
      anonymousEvents: events.filter(e => !e.customer).length
    })

    // Get total count for pagination
    const totalCount = await prisma.event.count({
      where: whereConditions
    })

    // Calculate summary statistics
    const summaryStats = await prisma.event.aggregate({
      where: whereConditions,
      _count: true,
      _sum: { value: true }
    })

    // Get unique customers count
    const uniqueCustomers = await prisma.event.findMany({
      where: whereConditions,
      select: { customerId: true },
      distinct: ['customerId']
    })

    // Get event types for the current filter
    const eventTypes = await prisma.event.groupBy({
      by: ['eventType'],
      where: whereConditions,
      _count: { eventType: true },
      orderBy: { _count: { eventType: 'desc' } }
    })

    // Get campaigns for the current filter
    const campaigns = await prisma.event.groupBy({
      by: ['campaign'],
      where: {
        ...whereConditions,
        campaign: { not: null }
      },
      _count: { campaign: true },
      orderBy: { _count: { campaign: 'desc' } }
    })

    // Calculate conversion rate by comparing with clicks for same period
    let conversionRate = 0
    try {
      const totalClicks = await prisma.click.count({
        where: {
          ...dateWhere,
          ...(campaign !== 'all' ? { campaign } : {})
        }
      })
      conversionRate = totalClicks > 0 ? Math.round((summaryStats._count / totalClicks) * 100 * 100) / 100 : 0
    } catch (error) {
      console.log('⚠️ Warning: Could not calculate conversion rate:', error.message)
    }

    const summary = {
      totalConversions: summaryStats._count || 0,
      totalValue: Number(summaryStats._sum.value || 0),
      uniqueCustomers: uniqueCustomers.length,
      conversionRate,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      eventTypes: eventTypes.map(et => ({
        type: et.eventType,
        count: et._count.eventType
      })),
      campaigns: campaigns.map(c => ({
        name: c.campaign,
        count: c._count.campaign
      }))
    }

    console.log('✅ Conversions summary calculated:', {
      totalConversions: summary.totalConversions,
      totalValue: summary.totalValue,
      uniqueCustomers: summary.uniqueCustomers,
      conversionRate: summary.conversionRate + '%',
      eventTypesFound: eventTypes.length,
      campaignsFound: campaigns.length,
      timestamp: new Date().toISOString()
    })

    const result = {
      success: true,
      events: enrichedEvents,
      summary
    }

    cache.set(cacheKey, result, 120) // 2 minute TTL
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Get conversions error:', error)
    console.error('📊 Error details:', {
      name: error?.constructor?.name,
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'), // Limit stack trace
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch conversions',
      details: error?.message
    }, { status: 500 })
  }
}
