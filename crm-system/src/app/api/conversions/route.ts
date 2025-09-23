import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      ...searchWhere
    }

    // Get events with pagination
    const events = await prisma.event.findMany({
      where: whereConditions,
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
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

    const summary = {
      totalConversions: summaryStats._count || 0,
      totalValue: Number(summaryStats._sum.value || 0),
      uniqueCustomers: uniqueCustomers.length,
      conversionRate: 0, // Would need total leads/clicks to calculate
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      eventTypes: eventTypes.map(et => ({
        type: et.eventType,
        count: et._count.eventType
      }))
    }

    return NextResponse.json({
      success: true,
      events,
      summary
    })

  } catch (error) {
    console.error('Get conversions error:', error)
    console.error('Error details:', {
      name: error?.constructor?.name,
      message: error?.message,
      stack: error?.stack
    })
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch conversions',
      details: error?.message
    }, { status: 500 })
  }
}