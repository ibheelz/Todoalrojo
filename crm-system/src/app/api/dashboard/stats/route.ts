import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if tables exist first
    let totalCustomers = 0, totalLeads = 0, totalClicks = 0, totalEvents = 0

    try {
      // Get basic counts
      const [customerResult, leadResult, clickResult, eventResult] = await Promise.allSettled([
        prisma.customer.count(),
        prisma.lead.count(),
        prisma.click.count(),
        prisma.event.count()
      ])

      totalCustomers = customerResult.status === 'fulfilled' ? customerResult.value : 0
      totalLeads = leadResult.status === 'fulfilled' ? leadResult.value : 0
      totalClicks = clickResult.status === 'fulfilled' ? clickResult.value : 0
      totalEvents = eventResult.status === 'fulfilled' ? eventResult.value : 0
    } catch (countError) {
      console.log('Count error, using defaults:', countError)
      // Keep defaults of 0
    }

    // Get total revenue
    let totalRevenue = 0
    try {
      const revenueResult = await prisma.customer.aggregate({
        _sum: {
          totalRevenue: true
        }
      })
      totalRevenue = Number(revenueResult._sum.totalRevenue || 0)
    } catch (revenueError) {
      console.log('Revenue error, using default:', revenueError)
    }

    // Get recent customers (last 10)
    let recentCustomers = []
    try {
      recentCustomers = await prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          masterEmail: true,
          masterPhone: true,
          firstName: true,
          lastName: true,
          company: true,
          source: true,
          country: true,
          city: true,
          createdAt: true,
        }
      })
    } catch (customersError) {
      console.log('Customers error, using empty array:', customersError)
    }

    // Get recent leads (last 10)
    let recentLeads = []
    try {
      recentLeads = await prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          campaign: true,
          qualityScore: true,
          createdAt: true,
        }
      })
    } catch (leadsError) {
      console.log('Leads error, using empty array:', leadsError)
    }

    return NextResponse.json({
      totalUsers: totalCustomers, // Keep backward compatibility for now
      totalCustomers,
      totalLeads,
      totalClicks,
      totalEvents,
      totalRevenue,
      recentUsers: recentCustomers, // Keep backward compatibility for now
      recentCustomers,
      recentLeads
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    }, { status: 500 })
  }
}