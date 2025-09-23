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
        status: 'active',
        totalLeads: 0,
        totalClicks: 0,
        totalRegs: 0,
        totalFtd: 0,
        commissionRate: validatedData.commissionRate,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        conversionTypes: body.conversionTypes ? JSON.stringify(body.conversionTypes) : null
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

    // Transform data to match frontend expectations
    const transformedInfluencer = {
      id: newInfluencer.id,
      name: newInfluencer.name,
      email: newInfluencer.email,
      phone: newInfluencer.phone,
      socialHandle: newInfluencer.socialHandle,
      platform: newInfluencer.platform,
      followers: newInfluencer.followers,
      engagementRate: Number(newInfluencer.engagementRate),
      category: newInfluencer.category,
      location: newInfluencer.location,
      status: newInfluencer.status,
      assignedCampaigns: [],
      totalLeads: newInfluencer.totalLeads,
      totalClicks: newInfluencer.totalClicks,
      totalRegs: newInfluencer.totalRegs,
      totalFtd: newInfluencer.totalFtd,
      createdAt: newInfluencer.createdAt.toISOString(),
      commissionRate: newInfluencer.commissionRate ? Number(newInfluencer.commissionRate) : null,
      paymentMethod: newInfluencer.paymentMethod,
      notes: newInfluencer.notes,
      conversionTypes: newInfluencer.conversionTypes ? JSON.parse(newInfluencer.conversionTypes) : [],
      campaigns: [],
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