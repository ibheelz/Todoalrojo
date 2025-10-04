import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('linkId')
    const dateFilter = searchParams.get('dateFilter') || 'last7days'
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    if (!linkId) {
      return NextResponse.json({
        success: false,
        error: 'Link ID is required'
      }, { status: 400 })
    }

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
            to.setHours(23, 59, 59, 999)
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

    const whereConditions = {
      linkId,
      ...dateWhere
    }

    // Get basic click statistics
    const clickStats = await prisma.linkClick.aggregate({
      where: whereConditions,
      _count: true,
      _avg: {
        redirectTime: true
      }
    })

    // Get unique clicks count
    const uniqueClicks = await prisma.linkClick.findMany({
      where: {
        ...whereConditions,
        isUnique: true
      },
      select: { id: true }
    })

    // Get clicks by hour for time-based analytics (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const hourlyClicks = await prisma.linkClick.groupBy({
      by: ['createdAt'],
      where: {
        linkId,
        createdAt: { gte: twentyFourHoursAgo }
      },
      _count: true,
      orderBy: { createdAt: 'asc' }
    })

    // Get clicks by device
    const deviceBreakdown = await prisma.linkClick.groupBy({
      by: ['device'],
      where: whereConditions,
      _count: true,
      orderBy: { _count: { device: 'desc' } }
    })

    // Get clicks by browser
    const browserBreakdown = await prisma.linkClick.groupBy({
      by: ['browser'],
      where: whereConditions,
      _count: true,
      orderBy: { _count: { browser: 'desc' } }
    })

    // Get clicks by operating system
    const osBreakdown = await prisma.linkClick.groupBy({
      by: ['os'],
      where: whereConditions,
      _count: true,
      orderBy: { _count: { os: 'desc' } }
    })

    // Get geographical breakdown
    const geoBreakdown = await prisma.linkClick.groupBy({
      by: ['country'],
      where: {
        ...whereConditions,
        country: { not: null }
      },
      _count: true,
      orderBy: { _count: { country: 'desc' } },
      take: 10
    })

    // Get referrer breakdown
    const referrerBreakdown = await prisma.linkClick.groupBy({
      by: ['referrer'],
      where: {
        ...whereConditions,
        referrer: { not: null }
      },
      _count: true,
      orderBy: { _count: { referrer: 'desc' } },
      take: 10
    })

    // Get bot traffic analysis
    const botStats = await prisma.linkClick.aggregate({
      where: {
        ...whereConditions,
        isBot: true
      },
      _count: true
    })

    // Get fraud traffic analysis
    const fraudStats = await prisma.linkClick.aggregate({
      where: {
        ...whereConditions,
        isFraud: true
      },
      _count: true
    })

    // Get daily click trends for chart
    const dailyTrends = await prisma.linkClick.groupBy({
      by: ['createdAt'],
      where: whereConditions,
      _count: true,
      orderBy: { createdAt: 'asc' }
    })

    // Process daily trends to group by date
    const dailyClicksMap = new Map()
    dailyTrends.forEach(trend => {
      const date = new Date(trend.createdAt).toISOString().split('T')[0]
      dailyClicksMap.set(date, (dailyClicksMap.get(date) || 0) + trend._count)
    })

    const dailyClicksArray = Array.from(dailyClicksMap.entries()).map(([date, count]) => ({
      date,
      clicks: count
    }))

    // Calculate fraud and bot rates
    const totalClicks = clickStats._count || 0
    const fraudRate = totalClicks > 0 ? Math.round((fraudStats._count / totalClicks) * 100 * 100) / 100 : 0
    const botRate = totalClicks > 0 ? Math.round((botStats._count / totalClicks) * 100 * 100) / 100 : 0
    const uniqueRate = totalClicks > 0 ? Math.round((uniqueClicks.length / totalClicks) * 100 * 100) / 100 : 0

    const analytics = {
      summary: {
        totalClicks: totalClicks,
        uniqueClicks: uniqueClicks.length,
        uniqueRate: uniqueRate,
        averageRedirectTime: Number(clickStats._avg.redirectTime || 0),
        botClicks: botStats._count || 0,
        botRate: botRate,
        fraudClicks: fraudStats._count || 0,
        fraudRate: fraudRate
      },
      trends: {
        daily: dailyClicksArray,
        hourly: hourlyClicks.map(h => ({
          hour: new Date(h.createdAt).getHours(),
          clicks: h._count
        }))
      },
      breakdown: {
        devices: deviceBreakdown.map(d => ({
          name: d.device || 'Unknown',
          clicks: d._count,
          percentage: totalClicks > 0 ? Math.round((d._count / totalClicks) * 100 * 100) / 100 : 0
        })),
        browsers: browserBreakdown.map(b => ({
          name: b.browser || 'Unknown',
          clicks: b._count,
          percentage: totalClicks > 0 ? Math.round((b._count / totalClicks) * 100 * 100) / 100 : 0
        })),
        operatingSystems: osBreakdown.map(os => ({
          name: os.os || 'Unknown',
          clicks: os._count,
          percentage: totalClicks > 0 ? Math.round((os._count / totalClicks) * 100 * 100) / 100 : 0
        })),
        countries: geoBreakdown.map(g => ({
          name: g.country,
          clicks: g._count,
          percentage: totalClicks > 0 ? Math.round((g._count / totalClicks) * 100 * 100) / 100 : 0
        })),
        referrers: referrerBreakdown.map(r => ({
          name: r.referrer,
          clicks: r._count,
          percentage: totalClicks > 0 ? Math.round((r._count / totalClicks) * 100 * 100) / 100 : 0
        }))
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Get link analytics error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch link analytics',
      details: error?.message
    }, { status: 500 })
  }
}