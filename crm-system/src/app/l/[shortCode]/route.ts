import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserService } from '@/lib/user-service'
import { incrementInfluencerCountersByClickId } from '@/lib/attribution'
import { emitStats } from '@/lib/event-bus'

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  const { searchParams } = new URL(request.url)
  const shortCode = params.shortCode

  // Look up the short link
  const link = await prisma.shortLink.findUnique({
    where: { shortCode },
    include: {
      linkInfluencers: {
        include: {
          influencer: true
        }
      }
    }
  })

  if (!link || !link.isActive) {
    return NextResponse.redirect('https://google.com', 302)
  }

  // Check if expired
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.redirect('https://google.com', 302)
  }

  // Merge link data + Redtrack data
  const clickData = {
    // Link metadata
    linkId: link.id,
    shortCode: link.shortCode,
    campaign: link.campaign,
    source: link.source,
    medium: link.medium,
    content: link.content,
    term: link.term,
    clientId: link.clientId,
    influencerId: link.linkInfluencers[0]?.influencerId, // First associated influencer

    // Redtrack's actual click ID from URL parameters
    clickId: searchParams.get('clickid') || searchParams.get('ref_id') || searchParams.get('rt_clickid'),

    // Campaign data from Redtrack (if provided, otherwise use link's campaign)
    rtCampaign: searchParams.get('rt_campaign') || searchParams.get('campaign'),
    rtSource: searchParams.get('rt_source') || searchParams.get('source'),
    rtMedium: searchParams.get('rt_medium') || searchParams.get('medium'),

    // Ad data from Redtrack
    adgroup: searchParams.get('rt_adgroup'),
    ad: searchParams.get('rt_ad'),
    placement: searchParams.get('rt_placement'),
    keyword: searchParams.get('rt_keyword'),

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
    landingPage: searchParams.get('landername') || searchParams.get('prelandername') || link.originalUrl,
    offerId: searchParams.get('offerid'),
    offerName: searchParams.get('offername'),
  }

  // Store click asynchronously (don't wait for it)
  storeClick(clickData, link).catch(err => {
    console.error('❌ [LINK BRIDGE] Error storing click:', err)
  })

  // Build final destination URL with Redtrack params appended
  const destinationUrl = new URL(link.originalUrl)

  // Append Redtrack parameters to casino URL
  if (clickData.subId1) destinationUrl.searchParams.set('sub_id', clickData.subId1)
  if (clickData.clickId) destinationUrl.searchParams.set('click_id', clickData.clickId)

  // Immediate redirect (happens in ~1-5ms)
  return NextResponse.redirect(destinationUrl.toString(), 302)
}

// Async function to store click without blocking redirect
async function storeClick(data: any, link: any) {
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

    // Use link's campaign or Redtrack's campaign
    const finalCampaign = data.campaign || data.rtCampaign
    const finalSource = data.source || data.rtSource || 'short-link'
    const finalMedium = data.medium || data.rtMedium || 'redirect'

    // Create LinkClick record (for the short link)
    await prisma.linkClick.create({
      data: {
        linkId: link.id,
        shortCode: data.shortCode,
        customerId: user?.id,
        clickId: data.clickId,
        ip: data.ip,
        userAgent: data.userAgent,
        referrer: data.referrer,
        country: data.country,
        region: data.region,
        city: data.city,
        os: data.os,
        browser: data.browser,
        device: data.device,
        clickTime: new Date(),
      }
    })

    // Also create Click record (for campaign tracking)
    await prisma.click.create({
      data: {
        customerId: user?.id,
        clickId: data.clickId,
        campaign: finalCampaign,
        source: finalSource,
        medium: finalMedium,
        content: data.adgroup || data.ad || data.content,
        term: data.keyword || data.term,
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

    // Update short link stats
    await prisma.shortLink.update({
      where: { id: link.id },
      data: {
        totalClicks: { increment: 1 },
        lastClickAt: new Date()
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
    if (finalCampaign) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          OR: [
            { slug: { equals: finalCampaign, mode: 'insensitive' } },
            { name: { equals: finalCampaign, mode: 'insensitive' } }
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

    // Update influencer stats if associated with link
    if (data.influencerId) {
      await prisma.influencer.update({
        where: { id: data.influencerId },
        data: {
          totalClicks: { increment: 1 }
        }
      })
    }

    // Attribute to influencer via clickId (if Redtrack data present)
    if (data.clickId) {
      await incrementInfluencerCountersByClickId(data.clickId, { clicks: 1 })
    }

    emitStats({
      type: 'click',
      payload: {
        campaign: finalCampaign,
        clickId: data.clickId,
        shortCode: data.shortCode,
        influencerId: data.influencerId
      }
    })

    console.log(`✅ [LINK BRIDGE] Click stored: ${data.clickId || 'no-clickid'} via ${data.shortCode}`)
  } catch (error) {
    console.error('❌ [LINK BRIDGE] Storage error:', error)
    throw error
  }
}
