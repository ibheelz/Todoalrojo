import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('dateFilter') || 'today'
    const campaign = searchParams.get('campaign') || 'all'
    const source = searchParams.get('source') || 'all'
    const search = searchParams.get('search') || ''
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    console.log('🔍 Fetching clicks with parameters:', {
      dateFilter,
      campaign,
      source,
      search,
      fromDate,
      toDate,
      page,
      limit,
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

    // Campaign filtering
    let campaignWhere = {}
    if (campaign && campaign !== 'all') {
      campaignWhere = { campaign: campaign }
    }

    // Source filtering
    let sourceWhere = {}
    if (source && source !== 'all') {
      sourceWhere = { source: source }
    }

    // Search filtering
    let searchWhere = {}
    if (search) {
      searchWhere = {
        OR: [
          { campaign: { contains: search, mode: 'insensitive' } },
          { source: { contains: search, mode: 'insensitive' } },
          { medium: { contains: search, mode: 'insensitive' } },
          { clickId: { contains: search, mode: 'insensitive' } },
          { ip: { contains: search, mode: 'insensitive' } },
          { landingPage: { contains: search, mode: 'insensitive' } },
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
      ...campaignWhere,
      ...sourceWhere,
      ...searchWhere
    }

    console.log('🔍 Applying where conditions:', {
      whereConditions,
      totalConditions: Object.keys(whereConditions).length
    })

    // Get clicks with pagination
    const clicks = await prisma.click.findMany({
      where: whereConditions,
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.click.count({
      where: whereConditions
    })

    // Calculate summary statistics
    const summaryStats = await prisma.click.aggregate({
      where: whereConditions,
      _count: true
    })

    // Get unique customers count
    const uniqueCustomers = await prisma.click.findMany({
      where: whereConditions,
      select: { customerId: true },
      distinct: ['customerId']
    })

    // Get fraud clicks count
    const fraudClicks = await prisma.click.count({
      where: {
        ...whereConditions,
        isFraud: true
      }
    })

    // Get campaigns for the current filter
    const campaigns = await prisma.click.groupBy({
      by: ['campaign'],
      where: whereConditions,
      _count: { campaign: true },
      orderBy: { _count: { campaign: 'desc' } }
    })

    // Get sources for the current filter
    const sources = await prisma.click.groupBy({
      by: ['source'],
      where: whereConditions,
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } }
    })

    // Calculate customer recognition stats
    const recognizedCustomers = clicks.filter(click => click.customer).length
    const anonymousClicks = clicks.length - recognizedCustomers
    const recognitionRate = clicks.length > 0 ? Math.round((recognizedCustomers / clicks.length) * 100 * 100) / 100 : 0

    const summary = {
      totalClicks: summaryStats._count || 0,
      uniqueCustomers: uniqueCustomers.length,
      fraudClicks,
      fraudRate: summaryStats._count > 0 ? Math.round((fraudClicks / summaryStats._count) * 100 * 100) / 100 : 0,
      recognizedCustomers,
      anonymousClicks,
      recognitionRate,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      campaigns: campaigns.map(c => ({
        name: c.campaign,
        count: c._count.campaign
      })),
      sources: sources.map(s => ({
        name: s.source,
        count: s._count.source
      }))
    }

    console.log('✅ Clicks data processed successfully:', {
      totalClicks: clicks.length,
      recognizedCustomers,
      anonymousClicks,
      recognitionRate: `${recognitionRate}%`,
      fraudClicks,
      campaignsFound: campaigns.length,
      sourcesFound: sources.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      clicks,
      summary
    })

  } catch (error) {
    console.error('❌ Get clicks error:', error)
    console.error('📊 Error details:', {
      name: error?.constructor?.name,
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'), // Limit stack trace
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch clicks',
      details: error?.message
    }, { status: 500 })
  }
}
