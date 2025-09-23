import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateShortUrl } from '@/lib/shorturl'

const updateLinkSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  campaign: z.string().optional(),
  source: z.string().optional(),
  medium: z.string().optional(),
  content: z.string().optional(),
  term: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  allowBots: z.boolean().optional(),
  trackClicks: z.boolean().optional(),
  influencerId: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const linkId = params.id

    console.log('🔍 Fetching link details:', {
      linkId,
      timestamp: new Date().toISOString()
    })

    const link = await prisma.shortLink.findUnique({
      where: { id: linkId },
      include: {
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            ip: true,
            country: true,
            device: true,
            browser: true,
            createdAt: true,
            isBot: true,
            isFraud: true
          }
        },
        _count: {
          select: {
            clicks: true
          }
        }
      }
    })

    if (!link) {
      return NextResponse.json({
        success: false,
        error: 'Link not found'
      }, { status: 404 })
    }

    // Get click analytics for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const clickAnalytics = await prisma.linkClick.groupBy({
      by: ['createdAt'],
      where: {
        linkId: linkId,
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: true,
      orderBy: { createdAt: 'asc' }
    })

    // Get geographical data
    const geoData = await prisma.linkClick.groupBy({
      by: ['country'],
      where: {
        linkId: linkId,
        country: { not: null }
      },
      _count: true,
      orderBy: { _count: { country: 'desc' } },
      take: 10
    })

    // Get device data
    const deviceData = await prisma.linkClick.groupBy({
      by: ['device'],
      where: {
        linkId: linkId,
        device: { not: null }
      },
      _count: true,
      orderBy: { _count: { device: 'desc' } }
    })

    const enhancedLink = {
      ...link,
      shortUrl: generateShortUrl(link.shortCode),
      analytics: {
        dailyClicks: clickAnalytics,
        topCountries: geoData.map(g => ({ country: g.country, clicks: g._count })),
        deviceBreakdown: deviceData.map(d => ({ device: d.device, clicks: d._count }))
      }
    }

    return NextResponse.json({
      success: true,
      data: enhancedLink
    })

  } catch (error) {
    console.error('Get link error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch link details',
      details: error?.message
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const linkId = params.id
    const body = await request.json()
    const validatedData = updateLinkSchema.parse(body)

    console.log('✏️ Updating link:', {
      linkId,
      updateData: validatedData,
      timestamp: new Date().toISOString()
    })

    // Validate campaign and influencer relationship via junction if both are provided
    if (validatedData.campaign && validatedData.influencerId) {
      const campaign = await prisma.campaign.findFirst({
        where: { slug: validatedData.campaign },
        select: { id: true, slug: true }
      })

      if (campaign) {
        const relation = await prisma.campaignInfluencer.findFirst({
          where: { campaignId: campaign.id, influencerId: validatedData.influencerId },
          select: { id: true }
        })

        if (!relation) {
          console.log('⚠️ Warning: Link updated with campaign and influencer that are not connected:', {
            campaign: validatedData.campaign,
            influencerId: validatedData.influencerId
          })
        }
      }
    }

    // Exclude influencerId from direct update payload (handled via junction)
    const { influencerId, ...updateData } = validatedData as any

    const updatedLink = await prisma.shortLink.update({
      where: { id: linkId },
      data: updateData,
      include: {
        _count: {
          select: {
            clicks: true
          }
        }
      }
    })

    // If influencerId provided, ensure junction exists
    if (influencerId) {
      try {
        const existing = await prisma.linkInfluencer.findFirst({
          where: { linkId, influencerId },
          select: { id: true }
        })
        if (!existing) {
          await prisma.linkInfluencer.create({
            data: { linkId, influencerId, assignedBy: 'system' }
          })
        }
      } catch (e) {
        console.log('⚠️ Warning: Failed to attach influencer to link on update (non-fatal):', {
          linkId,
          influencerId,
          error: (e as any)?.message
        })
      }
    }

    console.log('✅ Link updated successfully:', {
      id: updatedLink.id,
      shortCode: updatedLink.shortCode,
      campaign: updatedLink.campaign,
      timestamp: new Date().toISOString()
    })

    const enhancedLink = {
      ...updatedLink,
      shortUrl: generateShortUrl(updatedLink.shortCode),
      clickCount: updatedLink._count.clicks
    }

    return NextResponse.json({
      success: true,
      data: enhancedLink
    })

  } catch (error) {
    console.error('Update link error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update link',
      details: error?.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const linkId = params.id

    console.log('🗑️ Deleting link:', {
      linkId,
      timestamp: new Date().toISOString()
    })

    await prisma.shortLink.delete({
      where: { id: linkId }
    })

    return NextResponse.json({
      success: true,
      message: 'Link deleted successfully'
    })

  } catch (error) {
    console.error('Delete link error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete link',
      details: error?.message
    }, { status: 500 })
  }
}
