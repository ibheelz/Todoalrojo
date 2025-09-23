import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
      conversionTypes: influencer.conversionTypes ? JSON.parse(influencer.conversionTypes) : [],
      conversionConfig: influencer.conversionConfig ? JSON.parse(influencer.conversionConfig) : {
        leads: true,
        clicks: true,
        registrations: true,
        ftd: true
      },
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

const createInfluencerSchema = z.object({
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
  notes: z.string().optional()
})

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Influencer ID is required'
      }, { status: 400 })
    }

    const body = await request.json()
    console.log('📊 [API] Updating influencer:', id, JSON.stringify(body, null, 2))

    // Validate input data
    const validatedData = createInfluencerSchema.parse(body)

    // Normalize fields that may break constraints
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
        profileImage: typeof body.profileImage === 'string' && body.profileImage.trim() ? body.profileImage.trim() : null,
        commissionRate: validatedData.commissionRate,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        // remove unsupported fields like conversionTypes/conversionConfig (not in schema)
      },
      include: {
        campaignInfluencers: {
          include: {
            campaign: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    })

    // Update campaign assignments if provided
    if (Array.isArray(body.assignedCampaignIds)) {
      const ids: string[] = body.assignedCampaignIds.filter(Boolean)
      await prisma.campaignInfluencer.deleteMany({ where: { influencerId: id } })
      if (ids.length) {
        await prisma.campaignInfluencer.createMany({
          data: ids.map((campaignId) => ({ campaignId, influencerId: id, assignedBy: 'influencer-modal' })),
          skipDuplicates: true
        })
      }
    }

    // Reload with campaigns to return fresh mapping
    const refreshed = await prisma.influencer.findUnique({
      where: { id },
      include: {
        campaignInfluencers: { include: { campaign: { select: { id: true, name: true, slug: true } } } }
      }
    })

    // Transform data to match frontend expectations
    const transformedInfluencer = refreshed && {
      id: refreshed.id,
      name: refreshed.name,
      profileImage: (refreshed as any).profileImage || null,
      email: refreshed.email,
      phone: refreshed.phone,
      socialHandle: refreshed.socialHandle,
      platform: refreshed.platform,
      followers: refreshed.followers,
      engagementRate: Number(refreshed.engagementRate),
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
      conversionTypes: refreshed.conversionTypes ? JSON.parse(refreshed.conversionTypes) : [],
      campaigns: refreshed.campaignInfluencers.map(ci => ({ id: ci.campaign.id, name: ci.campaign.name, slug: ci.campaign.slug })),
      leads: []
    }

    return NextResponse.json({
      success: true,
      influencer: transformedInfluencer,
      message: 'Influencer updated successfully'
    }, { status: 200 })

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📊 [API] Received influencer data:', JSON.stringify(body, null, 2))

    // Validate input data
    const validatedData = createInfluencerSchema.parse(body)

    // Check if influencer with this email already exists
    const existingInfluencer = await prisma.influencer.findUnique({
      where: { email: validatedData.email }
    })

    if (existingInfluencer) {
      return NextResponse.json({
        success: false,
        error: 'An influencer with this email already exists'
      }, { status: 400 })
    }

    // Create new influencer
    const newInfluencer = await prisma.influencer.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        socialHandle: validatedData.socialHandle,
        platform: validatedData.platform,
        followers: validatedData.followers,
        engagementRate: validatedData.engagementRate,
        category: validatedData.category,
        location: validatedData.location,
        profileImage: typeof body.profileImage === 'string' && body.profileImage.trim() ? body.profileImage.trim() : null,
        status: 'active',
        totalLeads: 0,
        totalClicks: 0,
        totalRegs: 0,
        totalFtd: 0,
        commissionRate: validatedData.commissionRate,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        // remove unsupported fields
      },
      include: { campaignInfluencers: { include: { campaign: { select: { id: true, name: true, slug: true } } } } }
    })

    // Assign campaigns if provided
    if (Array.isArray(body.assignedCampaignIds) && body.assignedCampaignIds.length) {
      const ids: string[] = body.assignedCampaignIds.filter(Boolean)
      await prisma.campaignInfluencer.createMany({
        data: ids.map((campaignId) => ({ campaignId, influencerId: newInfluencer.id, assignedBy: 'influencer-modal' })),
        skipDuplicates: true
      })
    }

    const refreshed = await prisma.influencer.findUnique({
      where: { id: newInfluencer.id },
      include: { campaignInfluencers: { include: { campaign: { select: { id: true, name: true, slug: true } } } } }
    })

    // Transform data to match frontend expectations
    const transformedInfluencer = refreshed && {
      id: refreshed.id,
      name: refreshed.name,
      profileImage: (refreshed as any).profileImage || null,
      email: refreshed.email,
      phone: refreshed.phone,
      socialHandle: refreshed.socialHandle,
      platform: refreshed.platform,
      followers: refreshed.followers,
      engagementRate: Number(refreshed.engagementRate),
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
      conversionTypes: refreshed.conversionTypes ? JSON.parse(refreshed.conversionTypes) : [],
      conversionConfig: refreshed.conversionConfig ? JSON.parse(refreshed.conversionConfig) : {
        leads: true,
        clicks: true,
        registrations: true,
        ftd: true
      },
      campaigns: refreshed.campaignInfluencers.map(ci => ({ id: ci.campaign.id, name: ci.campaign.name, slug: ci.campaign.slug })),
      leads: []
    }

    return NextResponse.json({
      success: true,
      influencer: transformedInfluencer,
      message: 'Influencer created successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ [API] Validation errors:', JSON.stringify(error.errors, null, 2))
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Create influencer error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create influencer'
    }, { status: 500 })
  }
}
