import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    // Check cache
    const cacheKey = `campaign-details:${campaignId}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    console.log('🔄 Fetching detailed campaign data for:', campaignId)

    // Get campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign not found'
      }, { status: 404 })
    }

    console.log('📊 Found campaign:', campaign.slug)

    // Get all clicks for this campaign
    const clicks = await prisma.click.findMany({
      where: { campaign: campaign.slug },
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            masterPhone: true,
            firstName: true,
            lastName: true,
            country: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Get all leads for this campaign
    const leads = await prisma.lead.findMany({
      where: { campaign: campaign.slug },
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            masterPhone: true,
            firstName: true,
            lastName: true,
            country: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Get all events/conversions for this campaign
    const events = await prisma.event.findMany({
      where: { campaign: campaign.slug },
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            masterPhone: true,
            firstName: true,
            lastName: true,
            country: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Get unique customers from clicks, leads, and events
    const customerIds = new Set<string>()
    clicks.forEach(click => { if (click.customerId) customerIds.add(click.customerId) })
    leads.forEach(lead => { if (lead.customerId) customerIds.add(lead.customerId) })
    events.forEach(event => { if (event.customerId) customerIds.add(event.customerId) })

    const customers = await prisma.customer.findMany({
      where: {
        id: { in: Array.from(customerIds) }
      },
      select: {
        id: true,
        masterEmail: true,
        masterPhone: true,
        firstName: true,
        lastName: true,
        country: true,
        city: true,
        createdAt: true,
        _count: {
          select: {
            clicks: true,
            leads: true,
            events: true
          }
        }
      },
      take: 100
    })

    // Get influencers associated with this campaign through the CampaignInfluencer junction table
    const campaignInfluencers = await prisma.campaignInfluencer.findMany({
      where: {
        campaignId: campaign.id,
        isActive: true
      },
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
            socialHandle: true,
            platform: true,
            profileImage: true
          }
        }
      }
    })

    // Calculate stats for each influencer
    const influencers = campaignInfluencers.map((ci) => {
      // For now, return basic influencer info
      // TODO: Calculate actual click/lead/conversion stats per influencer
      return {
        ...ci.influencer,
        clicks: 0,
        leads: 0,
        conversions: 0
      }
    })

    console.log('✅ Campaign details fetched:', {
      clicks: clicks.length,
      leads: leads.length,
      events: events.length,
      customers: customers.length,
      influencers: influencers.length
    })

    const result = {
      success: true,
      clicks,
      leads,
      events,
      customers,
      influencers,
      summary: {
        totalClicks: clicks.length,
        totalLeads: leads.length,
        totalEvents: events.length,
        uniqueCustomers: customers.length,
        totalInfluencers: influencers.length
      }
    }

    cache.set(cacheKey, result, 180) // 3 minute TTL
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Get campaign details error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch campaign details',
      details: error?.message
    }, { status: 500 })
  }
}
