import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserService } from '@/lib/user-service'
import { incrementInfluencerCountersByClickId } from '@/lib/attribution'
import { emitStats } from '@/lib/event-bus'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Get destination URL (where to redirect)
  const destination = searchParams.get('destination') || searchParams.get('url') || 'https://google.com'

  // Capture all Redtrack data
  const clickData = {
    // Redtrack's actual click ID
    clickId: searchParams.get('clickid') || searchParams.get('ref_id') || searchParams.get('rt_clickid'),

    // Campaign data from Redtrack
    campaign: searchParams.get('rt_campaign') || searchParams.get('campaign'),
    source: searchParams.get('rt_source') || searchParams.get('source'),
    medium: searchParams.get('rt_medium') || searchParams.get('medium'),

    // Ad data
    adgroup: searchParams.get('rt_adgroup'),
    ad: searchParams.get('rt_ad'),
    placement: searchParams.get('rt_placement'),
    keyword: searchParams.get('rt_keyword'),

    // IDs
    campaignId: searchParams.get('rt_campaignid'),
    adgroupId: searchParams.get('rt_adgroupid'),
    adId: searchParams.get('rt_adid'),
    placementId: searchParams.get('rt_placementid'),

    // Sub IDs
    subId1: searchParams.get('sub1'),
    subId2: searchParams.get('sub2'),
    subId3: searchParams.get('sub3'),
    subId4: searchParams.get('sub4'),
    subId5: searchParams.get('sub5'),

    // Geo data from Redtrack
    country: searchParams.get('country'),
    city: searchParams.get('city'),
    region: searchParams.get('region'),

    // Device data from Redtrack
    os: searchParams.get('os'),
    browser: searchParams.get('browser'),
    device: searchParams.get('brand') || searchParams.get('model'),

    // Technical
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        searchParams.get('ip') ||
        '0.0.0.0',
    userAgent: request.headers.get('user-agent') || searchParams.get('useragent'),
    referrer: request.headers.get('referer') || searchParams.get('referrerdomain'),

    // Offer data
    landingPage: searchParams.get('landername') || searchParams.get('prelandername') || destination,
    offerId: searchParams.get('offerid'),
    offerName: searchParams.get('offername'),
  }

  // Store click asynchronously (don't wait for it)
  storeClick(clickData).catch(err => {
    console.error('❌ [TRACK BRIDGE] Error storing click:', err)
  })

  // Immediate redirect (happens in ~1-5ms)
  return NextResponse.redirect(destination, 302)
}

// Async function to store click without blocking redirect
async function storeClick(data: any) {
  try {
    // Find or create user
    const user = await UserService.findOrCreateUser({
      clickId: data.clickId,
      ip: data.ip,
      userAgent: data.userAgent,
    }, {
      country: data.country,
      region: data.region,
      city: data.city,
    })

    // Create click record
    await prisma.click.create({
      data: {
        customerId: user?.id,
        clickId: data.clickId,
        campaign: data.campaign,
        source: data.source,
        medium: data.medium,
        content: data.adgroup || data.ad,
        term: data.keyword,
        subId1: data.subId1,
        subId2: data.subId2,
        subId3: data.subId3,
        subId4: data.subId4,
        subId5: data.subId5,
        ip: data.ip,
        userAgent: data.userAgent,
        referrer: data.referrer,
        landingPage: data.landingPage,
        country: data.country,
        region: data.region,
        city: data.city,
        os: data.os,
        browser: data.browser,
        device: data.device,
        clickTime: new Date(),
      }
    })

    // Update user click count
    if (user) {
      await prisma.customer.update({
        where: { id: user.id },
        data: {
          totalClicks: { increment: 1 },
          lastSeen: new Date()
        }
      })
    }

    // Update campaign stats if exists
    if (data.campaign) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          OR: [
            { slug: { equals: data.campaign, mode: 'insensitive' } },
            { name: { equals: data.campaign, mode: 'insensitive' } }
          ]
        }
      })

      if (campaign) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { totalClicks: { increment: 1 } }
        })
      }
    }

    // Attribute to influencer
    await incrementInfluencerCountersByClickId(data.clickId, { clicks: 1 })
    emitStats({ type: 'click', payload: { campaign: data.campaign, clickId: data.clickId } })

    console.log(`✅ [TRACK BRIDGE] Click stored: ${data.clickId}`)
  } catch (error) {
    console.error('❌ [TRACK BRIDGE] Storage error:', error)
    throw error
  }
}
