import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Fetch influencers from database with campaign relationships
    const influencers = await prisma.influencer.findMany({
      where: activeOnly ? { status: 'active' } : undefined,
      include: {
        campaignInfluencers: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        linkInfluencers: {
          include: {
            link: {
              select: {
                id: true,
                title: true,
                shortCode: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data to match frontend expectations
    const transformedInfluencers = influencers.map(influencer => ({
      id: influencer.id,
      name: influencer.name,
      email: influencer.email,
      phone: influencer.phone,
      socialHandle: influencer.socialHandle,
      platform: influencer.platform,
      followers: influencer.followers,
      engagementRate: influencer.engagementRate ? Number(influencer.engagementRate) : 0,
      category: influencer.category,
      location: influencer.location,
      status: influencer.status,
      assignedCampaigns: influencer.campaignInfluencers.map(ci => ci.campaign.id),
      totalLeads: influencer.totalLeads,
      totalClicks: influencer.totalClicks,
      totalRegs: influencer.totalRegs,
      totalFtd: influencer.totalFtd,
      createdAt: influencer.createdAt.toISOString().split('T')[0],
      commissionRate: influencer.commissionRate ? Number(influencer.commissionRate) : null,
      paymentMethod: influencer.paymentMethod,
      notes: influencer.notes,
      campaigns: influencer.campaignInfluencers.map(ci => ({
        id: ci.campaign.id,
        name: ci.campaign.name,
        slug: ci.campaign.slug,
        assignedAt: ci.assignedAt
      })),
      links: influencer.linkInfluencers.map(li => ({
        id: li.link.id,
        title: li.link.title,
        shortCode: li.link.shortCode,
        assignedAt: li.assignedAt
      }))
    }))

    return NextResponse.json({
      success: true,
      influencers: transformedInfluencers
    })

  } catch (error) {
    console.error('Get influencers error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch influencers'
    }, { status: 500 })
  }
}