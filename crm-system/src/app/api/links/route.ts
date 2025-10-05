import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateShortUrl, extractDomainFromUrl } from '@/lib/shorturl'

export const dynamic = 'force-dynamic'

const createLinkSchema = z.object({
  originalUrl: z.string().url('Invalid URL format'),
  title: z.string().optional(),
  description: z.string().optional(),
  campaign: z.string().min(1, 'Campaign is required'),
  source: z.string().optional(),
  medium: z.string().optional(),
  content: z.string().optional(),
  term: z.string().optional(),
  customCode: z.string().optional(),
  customDomain: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  isPublic: z.boolean().default(true),
  allowBots: z.boolean().default(false),
  trackClicks: z.boolean().default(true),
  influencerId: z.string().optional(),
  influencerIds: z.array(z.string()).optional(),
})

function generateShortCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createLinkSchema.parse(body)

    // Add comprehensive console debugging
    console.log('🔗 Creating new short link:', {
      originalUrl: validatedData.originalUrl,
      campaign: validatedData.campaign,
      influencerId: validatedData.influencerId,
      customCode: validatedData.customCode,
      timestamp: new Date().toISOString()
    })

    let shortCode = validatedData.customCode

    // Generate or validate short code
    if (!shortCode) {
      let attempts = 0
      do {
        shortCode = generateShortCode()
        attempts++
        if (attempts > 10) {
          shortCode = generateShortCode(8) // Use longer code if too many collisions
          break
        }
      } while (await prisma.shortLink.findUnique({ where: { shortCode } }))
    } else {
      // Check if custom code is already taken
      const existing = await prisma.shortLink.findUnique({ where: { shortCode } })
      if (existing) {
        return NextResponse.json({
          success: false,
          error: 'Custom short code is already taken'
        }, { status: 400 })
      }
    }

    // Validate campaign exists and is active
    const campaign = await prisma.campaign.findFirst({
      where: {
        slug: validatedData.campaign,
        isActive: true
      },
      select: { id: true, slug: true, name: true }
    })

    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign not found or is not active. Please select an active campaign.'
      }, { status: 400 })
    }

    console.log('✅ Campaign validated:', {
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
      campaignName: campaign.name
    })

    // Get influencer IDs to validate
    const influencerIds = (validatedData.influencerIds && validatedData.influencerIds.length > 0)
      ? validatedData.influencerIds
      : (validatedData.influencerId ? [validatedData.influencerId] : [])

    // Validate campaign-influencer relationships if influencers are provided
    if (influencerIds.length > 0) {
      for (const influencerId of influencerIds) {
        const relation = await prisma.campaignInfluencer.findFirst({
          where: {
            campaignId: campaign.id,
            influencerId: influencerId,
            isActive: true
          },
          select: { id: true }
        })

        if (!relation) {
          console.log('⚠️ Warning: Link created with campaign and influencer that are not connected:', {
            campaign: validatedData.campaign,
            influencerId
          })
        } else {
          console.log('✅ Campaign-Influencer relationship validated:', {
            campaignId: campaign.id,
            campaignSlug: campaign.slug,
            influencerId
          })
        }
      }
    }

    // Create the short link
    const shortLink = await prisma.shortLink.create({
      data: {
        shortCode,
        originalUrl: validatedData.originalUrl,
        title: validatedData.title,
        description: validatedData.description,
        campaign: validatedData.campaign,
        source: validatedData.source,
        medium: validatedData.medium,
        content: validatedData.content,
        term: validatedData.term,
        customDomain: validatedData.customDomain || extractDomainFromUrl(generateShortUrl('')),
        password: validatedData.password,
        expiresAt: validatedData.expiresAt,
        isPublic: validatedData.isPublic,
        allowBots: validatedData.allowBots,
        trackClicks: validatedData.trackClicks,
      }
    })

    // Attach influencer relationships via the junction table
    if (influencerIds.length > 0) {
      try {
        await prisma.linkInfluencer.createMany({
          data: influencerIds.map((infId) => ({
            linkId: shortLink.id,
            influencerId: infId,
            assignedBy: 'system'
          })),
          skipDuplicates: true
        })
        console.log('✅ Link-Influencer relationships created:', {
          linkId: shortLink.id,
          influencerCount: influencerIds.length
        })
      } catch (e) {
        console.log('⚠️ Warning: Failed to attach influencer to link (non-fatal):', {
          linkId: shortLink.id,
          influencerIds,
          error: (e as any)?.message
        })
      }
    }

    console.log('✅ Short link created successfully:', {
      id: shortLink.id,
      shortCode: shortLink.shortCode,
      campaign: shortLink.campaign,
      timestamp: new Date().toISOString()
    })

    const shortUrl = generateShortUrl(shortLink.shortCode)

    return NextResponse.json({
      success: true,
      data: {
        ...shortLink,
        shortUrl
      }
    })

  } catch (error) {
    console.error('Create link error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create short link',
      details: error?.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const campaign = searchParams.get('campaign') || 'all'
    const isActive = searchParams.get('isActive')
    const offset = (page - 1) * limit

    console.log('🔍 Fetching links with filters:', {
      page,
      limit,
      search,
      campaign,
      isActive,
      timestamp: new Date().toISOString()
    })

    // Build where conditions
    let whereConditions: any = {}

    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalUrl: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search, mode: 'insensitive' } },
        { campaign: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (campaign && campaign !== 'all') {
      whereConditions.campaign = campaign
    }

    if (isActive !== null && isActive !== undefined) {
      whereConditions.isActive = isActive === 'true'
    }

    // Get links with pagination
    const links = await prisma.shortLink.findMany({
      where: whereConditions,
      include: {
        linkInfluencers: {
          select: { influencerId: true }
        },
        _count: {
          select: {
            clicks: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    // Get total count
    const totalCount = await prisma.shortLink.count({ where: whereConditions })

    // Get summary statistics
    const summaryStats = await prisma.shortLink.aggregate({
      where: whereConditions,
      _count: true,
      _sum: {
        totalClicks: true,
        uniqueClicks: true
      }
    })

    // Get campaigns for filtering
    const campaigns = await prisma.shortLink.groupBy({
      by: ['campaign'],
      where: {
        ...whereConditions,
        campaign: { not: null }
      },
      _count: { campaign: true },
      orderBy: { _count: { campaign: 'desc' } }
    })

    // For each link, get leads and events data
    const enhancedLinks = await Promise.all(links.map(async (link) => {
      const influencerIds = (link as any).linkInfluencers?.map((li: any) => li.influencerId) || []

      // Get clickIds for this link from LinkClick table
      const linkClicks = await prisma.linkClick.findMany({
        where: { linkId: link.id },
        select: { clickId: true, customerId: true }
      })
      const clickIds = linkClicks.map(c => c.clickId).filter(Boolean) as string[]
      const customerIds = [...new Set(linkClicks.map(c => c.customerId).filter(Boolean))] as string[]

      // Get unique customers for this link
      const customers = customerIds.length > 0 ? await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          masterEmail: true
        }
      }) : []

      // Get leads from those clicks
      const leads = await prisma.lead.findMany({
        where: {
          clickId: { in: clickIds }
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        },
        distinct: ['email']
      })

      // Get events from those clicks
      const events = await prisma.event.findMany({
        where: {
          clickId: { in: clickIds }
        },
        select: {
          id: true,
          eventType: true,
          value: true
        }
      })

      // Calculate total revenue from events
      const totalRevenue = events.reduce((sum, event) => sum + (Number(event.value) || 0), 0)

      // Count conversions (FTD events)
      const conversionCount = events.filter(e => e.eventType === 'ftd').length

      return {
        ...link,
        influencerId: influencerIds[0] || null, // backward compatibility for UI that expects single
        influencerIds,
        shortUrl: generateShortUrl(link.shortCode, link.customDomain),
        clickCount: link._count.clicks,
        customers,
        leads,
        events,
        totalRevenue,
        conversionCount
      }
    }))

    const summary = {
      totalLinks: summaryStats._count || 0,
      totalClicks: Number(summaryStats._sum.totalClicks || 0),
      totalUniqueClicks: Number(summaryStats._sum.uniqueClicks || 0),
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      campaigns: campaigns.map(c => ({
        name: c.campaign,
        count: c._count.campaign
      }))
    }

    return NextResponse.json({
      success: true,
      links: enhancedLinks,
      summary
    })

  } catch (error) {
    console.error('Get links error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch links',
      details: error?.message
    }, { status: 500 })
  }
}
