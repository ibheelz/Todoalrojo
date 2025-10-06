import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get the ggbet1 link
    const link = await prisma.shortLink.findUnique({
      where: { shortCode: 'ggbet1' },
      include: {
        linkInfluencers: {
          include: {
            influencer: true
          }
        }
      }
    })

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Get recent clicks for this link
    const linkClicks = await prisma.linkClick.findMany({
      where: { linkId: link.id },
      orderBy: { clickTime: 'desc' },
      take: 20,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            totalClicks: true
          }
        }
      }
    })

    // Get related campaign clicks
    const clickIds = linkClicks.map(lc => lc.clickId).filter(Boolean)
    const campaignClicks = await prisma.click.findMany({
      where: {
        clickId: { in: clickIds as string[] }
      },
      orderBy: { clickTime: 'desc' }
    })

    return NextResponse.json({
      link: {
        id: link.id,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        campaign: link.campaign,
        totalClicks: link.totalClicks,
        lastClickAt: link.lastClickAt,
        influencers: link.linkInfluencers.map(li => li.influencer.name)
      },
      linkClicks: linkClicks.map(lc => ({
        id: lc.id,
        clickId: lc.clickId,
        clickTime: lc.clickTime,
        ip: lc.ip,
        country: lc.country,
        region: lc.region,
        city: lc.city,
        os: lc.os,
        browser: lc.browser,
        device: lc.device,
        customer: lc.customer
      })),
      campaignClicks: campaignClicks.map(c => ({
        id: c.id,
        clickId: c.clickId,
        campaign: c.campaign,
        source: c.source,
        medium: c.medium,
        subId1: c.subId1,
        subId2: c.subId2,
        subId3: c.subId3,
        country: c.country,
        landingPage: c.landingPage,
        clickTime: c.clickTime
      })),
      summary: {
        totalLinkClicks: linkClicks.length,
        totalCampaignClicks: campaignClicks.length,
        uniqueCustomers: new Set(linkClicks.map(lc => lc.customerId).filter(Boolean)).size
      }
    })
  } catch (error: any) {
    console.error('Error fetching link clicks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
