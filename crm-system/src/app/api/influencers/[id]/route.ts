import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
