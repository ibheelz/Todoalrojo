import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id

    console.log('🔄 Fetching campaign activity for customer:', customerId)

    // Get all clicks with campaign info
    const clicks = await prisma.click.findMany({
      where: {
        customerId: customerId,
        campaign: { not: null }
      },
      select: {
        campaign: true,
        createdAt: true
      }
    })

    // Get all leads with campaign info
    const leads = await prisma.lead.findMany({
      where: {
        customerId: customerId,
        campaign: { not: null }
      },
      select: {
        campaign: true,
        createdAt: true
      }
    })

    // Get all events with campaign info
    const events = await prisma.event.findMany({
      where: {
        customerId: customerId,
        campaign: { not: null }
      },
      select: {
        campaign: true,
        eventType: true,
        value: true,
        createdAt: true
      }
    })

    // Get journey states for different operators/brands
    const journeyStates = await prisma.customerJourneyState.findMany({
      where: {
        customerId: customerId
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            brand: true
          }
        }
      }
    })

    // Aggregate data by campaign
    const campaignMap = new Map<string, any>()

    // Process clicks
    clicks.forEach(click => {
      if (!click.campaign) return

      if (!campaignMap.has(click.campaign)) {
        campaignMap.set(click.campaign, {
          campaign: click.campaign,
          clicks: 0,
          leads: 0,
          events: 0,
          conversions: 0,
          totalValue: 0,
          firstSeen: click.createdAt,
          lastSeen: click.createdAt
        })
      }

      const data = campaignMap.get(click.campaign)
      data.clicks++
      data.firstSeen = new Date(Math.min(new Date(data.firstSeen).getTime(), new Date(click.createdAt).getTime()))
      data.lastSeen = new Date(Math.max(new Date(data.lastSeen).getTime(), new Date(click.createdAt).getTime()))
    })

    // Process leads
    leads.forEach(lead => {
      if (!lead.campaign) return

      if (!campaignMap.has(lead.campaign)) {
        campaignMap.set(lead.campaign, {
          campaign: lead.campaign,
          clicks: 0,
          leads: 0,
          events: 0,
          conversions: 0,
          totalValue: 0,
          firstSeen: lead.createdAt,
          lastSeen: lead.createdAt
        })
      }

      const data = campaignMap.get(lead.campaign)
      data.leads++
      data.firstSeen = new Date(Math.min(new Date(data.firstSeen).getTime(), new Date(lead.createdAt).getTime()))
      data.lastSeen = new Date(Math.max(new Date(data.lastSeen).getTime(), new Date(lead.createdAt).getTime()))
    })

    // Process events
    events.forEach(event => {
      if (!event.campaign) return

      if (!campaignMap.has(event.campaign)) {
        campaignMap.set(event.campaign, {
          campaign: event.campaign,
          clicks: 0,
          leads: 0,
          events: 0,
          conversions: 0,
          totalValue: 0,
          firstSeen: event.createdAt,
          lastSeen: event.createdAt
        })
      }

      const data = campaignMap.get(event.campaign)
      data.events++

      // Check if it's a conversion event
      const conversionTypes = ['deposit', 'ftd', 'first_deposit', 'registration', 'signup', 'register']
      if (conversionTypes.includes(event.eventType.toLowerCase())) {
        data.conversions++
      }

      if (event.value) {
        data.totalValue += Number(event.value)
      }

      data.firstSeen = new Date(Math.min(new Date(data.firstSeen).getTime(), new Date(event.createdAt).getTime()))
      data.lastSeen = new Date(Math.max(new Date(data.lastSeen).getTime(), new Date(event.createdAt).getTime()))
    })

    // Convert map to array and sort by last activity
    const campaigns = Array.from(campaignMap.values()).sort((a, b) =>
      new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    )

    // Transform journey states to include operator/brand info
    const brands = journeyStates.map(state => ({
      operatorId: state.operatorId,
      operatorName: state.operator.name,
      brand: state.operator.brand,
      stage: state.stage,
      currentJourney: state.currentJourney,
      depositCount: state.depositCount,
      totalDepositValue: Number(state.totalDepositValue),
      emailCount: state.emailCount,
      smsCount: state.smsCount,
      lastEmailAt: state.lastEmailAt,
      lastSmsAt: state.lastSmsAt
    }))

    console.log('✅ Found campaign activity:', {
      totalCampaigns: campaigns.length,
      totalBrands: brands.length
    })

    return NextResponse.json({
      success: true,
      campaigns,
      brands,
      summary: {
        totalCampaigns: campaigns.length,
        totalBrands: brands.length,
        totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
        totalLeads: campaigns.reduce((sum, c) => sum + c.leads, 0),
        totalEvents: campaigns.reduce((sum, c) => sum + c.events, 0),
        totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
        totalValue: campaigns.reduce((sum, c) => sum + c.totalValue, 0)
      }
    })

  } catch (error) {
    console.error('❌ Get customer campaigns error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customer campaigns',
      details: error?.message
    }, { status: 500 })
  }
}
