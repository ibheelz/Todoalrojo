import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { cache } from '@/lib/cache'

const updateInfluencerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional(),
  socialHandle: z.string().optional(),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'twitch', 'other']),
  followers: z.number().min(0, 'Followers must be positive').optional(),
  engagementRate: z.number().min(0).max(100, 'Engagement rate must be between 0-100').optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0-100').optional(),
  paymentMethod: z.enum(['paypal', 'bank_transfer', 'crypto', 'other']).optional(),
  notes: z.string().optional(),
  profileImage: z.string().optional().or(z.literal('')),
  assignedCampaignIds: z.array(z.string()).optional()
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const influencerId = params.id

    // Check cache
    const cacheKey = `influencer-details:${influencerId}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get influencer
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        campaignInfluencers: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                slug: true,
                createdAt: true
              }
            }
          }
        }
      }
    })

    if (!influencer) {
      return NextResponse.json({
        success: false,
        error: 'Influencer not found'
      }, { status: 404 })
    }

    // Get all campaigns for this influencer
    const campaignSlugs = influencer.campaignInfluencers.map(ci => ci.campaign.slug)

    // Get all clicks for this influencer's campaigns
    const clicks = await prisma.click.findMany({
      where: {
        campaign: { in: campaignSlugs }
      },
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

    // Get all leads associated with this influencer's campaigns

    const leads = await prisma.lead.findMany({
      where: {
        campaign: { in: campaignSlugs }
      },
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

    // Get all events/conversions
    const events = await prisma.event.findMany({
      where: {
        campaign: { in: campaignSlugs }
      },
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

    // Get unique customers
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

    // Calculate campaign stats for this influencer
    const campaignsWithStats = await Promise.all(
      influencer.campaignInfluencers.map(async (ci) => {
        // Get full campaign data with logoUrl
        const fullCampaign = await prisma.campaign.findUnique({
          where: { id: ci.campaign.id },
          select: { logoUrl: true }
        })

        const [clickCount, leadCount, eventCount, regCount] = await Promise.all([
          prisma.click.count({ where: { campaign: ci.campaign.slug } }),
          prisma.lead.count({ where: { campaign: ci.campaign.slug } }),
          prisma.event.count({ where: { campaign: ci.campaign.slug } }),
          prisma.event.count({
            where: {
              campaign: ci.campaign.slug,
              eventType: { in: ['registration', 'signup', 'register'] }
            }
          })
        ])

        return {
          id: ci.campaign.id,
          name: ci.campaign.name,
          slug: ci.campaign.slug,
          logoUrl: fullCampaign?.logoUrl || null,
          isActive: ci.isActive,
          totalClicks: clickCount,
          totalLeads: leadCount,
          totalRegs: regCount,
          createdAt: ci.campaign.createdAt
        }
      })
    )

    // Count different event types
    const registrations = await prisma.event.count({
      where: {
        campaign: { in: campaignSlugs },
        eventType: { in: ['registration', 'signup', 'register'] }
      }
    })

    // Count unique customers with deposits (FTD)
    const depositEvents = await prisma.event.findMany({
      where: {
        campaign: { in: campaignSlugs },
        OR: [
          { eventType: { in: ['deposit', 'ftd', 'first_deposit'] } },
          { eventName: { in: ['deposit', 'ftd', 'first_deposit'] } }
        ],
        isRevenue: true
      },
      select: { customerId: true }
    })
    const ftd = new Set(depositEvents.map(e => e.customerId)).size

    const result = {
      success: true,
      influencer: {
        ...influencer,
        profileImage: (influencer as any).profileImage || null,
        engagementRate: influencer.engagementRate ? Number(influencer.engagementRate) : 0,
        commissionRate: influencer.commissionRate ? Number(influencer.commissionRate) : null,
        totalClicks: clicks.length,
        totalLeads: leads.length,
        totalRegs: registrations,
        totalFtd: ftd,
        campaigns: campaignsWithStats
      },
      clicks,
      leads,
      events,
      customers,
      summary: {
        totalClicks: clicks.length,
        totalLeads: leads.length,
        totalEvents: events.length,
        totalRegistrations: registrations,
        totalFtd: ftd,
        uniqueCustomers: customers.length,
        totalCampaigns: campaignsWithStats.length
      }
    }

    cache.set(cacheKey, result, 180) // 3 minute TTL
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Get influencer details error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch influencer details',
      details: error?.message
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Influencer ID is required'
      }, { status: 400 })
    }

    const body = await request.json()
    console.log('📊 [API] Updating influencer:', id, JSON.stringify(body, null, 2))

    // Clear cache when updating
    cache.delete(`influencer-details:${id}`)

    // Validate input data
    const validatedData = updateInfluencerSchema.parse(body)

    // Normalize email to null if blank
    const normalizedEmail = validatedData.email && validatedData.email.trim() !== ''
      ? validatedData.email
      : null

    // Update influencer core fields
    const updatedInfluencer = await prisma.influencer.update({
      where: { id },
      data: {
        name: validatedData.name,
        email: normalizedEmail,
        phone: validatedData.phone,
        socialHandle: validatedData.socialHandle,
        platform: validatedData.platform,
        followers: validatedData.followers,
        engagementRate: validatedData.engagementRate,
        category: validatedData.category,
        location: validatedData.location,
        profileImage: validatedData.profileImage && validatedData.profileImage.trim() !== ''
          ? validatedData.profileImage.trim()
          : null,
        commissionRate: validatedData.commissionRate,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes
      },
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
        }
      }
    })

    // Update campaign assignments if provided
    if (Array.isArray(validatedData.assignedCampaignIds)) {
      const ids = validatedData.assignedCampaignIds.filter(Boolean)
      console.log('🔗 [API] Updating campaign assignments for influencer:', id, ids)
      await prisma.campaignInfluencer.deleteMany({ where: { influencerId: id } })
      if (ids.length) {
        await prisma.campaignInfluencer.createMany({
          data: ids.map(campaignId => ({ campaignId, influencerId: id, assignedBy: 'influencer-modal' })),
          skipDuplicates: true
        })
      }
    }

    // Reload with campaigns for response
    const refreshed = await prisma.influencer.findUnique({
      where: { id },
      include: {
        campaignInfluencers: { include: { campaign: { select: { id: true, name: true, slug: true } } } }
      }
    })

    const transformedInfluencer = refreshed && {
      id: refreshed.id,
      name: refreshed.name,
      profileImage: (refreshed as any).profileImage || null,
      email: refreshed.email,
      phone: refreshed.phone,
      socialHandle: refreshed.socialHandle,
      platform: refreshed.platform,
      followers: refreshed.followers || 0,
      engagementRate: refreshed.engagementRate ? Number(refreshed.engagementRate) : 0,
      category: refreshed.category,
      location: refreshed.location,
      status: refreshed.status,
      assignedCampaigns: refreshed.campaignInfluencers.map(ci => ci.campaign.id),
      totalLeads: refreshed.totalLeads,
      totalClicks: refreshed.totalClicks,
      totalRegs: refreshed.totalRegs,
      totalFtd: refreshed.totalFtd,
      createdAt: refreshed.createdAt.toISOString(),
      commissionRate: refreshed.commissionRate ? Number(refreshed.commissionRate) : null,
      paymentMethod: refreshed.paymentMethod,
      notes: refreshed.notes,
      campaigns: refreshed.campaignInfluencers.map(ci => ({ id: ci.campaign.id, name: ci.campaign.name, slug: ci.campaign.slug })),
      leads: []
    }

    return NextResponse.json({ success: true, influencer: transformedInfluencer, message: 'Influencer updated successfully' }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ [API] Validation errors:', JSON.stringify(error.errors, null, 2))
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Update influencer error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update influencer'
    }, { status: 500 })
  }
}
