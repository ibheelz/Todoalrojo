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
  notes: z.string().optional()
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

    // Update influencer
    const updatedInfluencer = await prisma.influencer.update({
      where: { id },
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
        commissionRate: validatedData.commissionRate,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        conversionTypes: body.conversionTypes ? JSON.stringify(body.conversionTypes) : null,
        conversionConfig: body.conversionConfig ? JSON.stringify(body.conversionConfig) : null
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
      id: updatedInfluencer.id,
      name: updatedInfluencer.name,
      email: updatedInfluencer.email,
      phone: updatedInfluencer.phone,
      socialHandle: updatedInfluencer.socialHandle,
      platform: updatedInfluencer.platform,
      followers: updatedInfluencer.followers,
      engagementRate: Number(updatedInfluencer.engagementRate),
      category: updatedInfluencer.category,
      location: updatedInfluencer.location,
      status: updatedInfluencer.status,
      assignedCampaigns: [],
      totalLeads: updatedInfluencer.totalLeads,
      totalClicks: updatedInfluencer.totalClicks,
      totalRegs: updatedInfluencer.totalRegs,
      totalFtd: updatedInfluencer.totalFtd,
      createdAt: updatedInfluencer.createdAt.toISOString(),
      commissionRate: updatedInfluencer.commissionRate ? Number(updatedInfluencer.commissionRate) : null,
      paymentMethod: updatedInfluencer.paymentMethod,
      notes: updatedInfluencer.notes,
      conversionTypes: updatedInfluencer.conversionTypes ? JSON.parse(updatedInfluencer.conversionTypes) : [],
      conversionConfig: updatedInfluencer.conversionConfig ? JSON.parse(updatedInfluencer.conversionConfig) : {
        leads: true,
        clicks: true,
        registrations: true,
        ftd: true
      },
      campaigns: [],
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