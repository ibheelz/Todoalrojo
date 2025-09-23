import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  slug: z.string().min(1, 'Campaign slug is required'),
  description: z.string().optional(),
  clientId: z.string().optional(),
  brandId: z.string().optional(),
  logoUrl: z.string().optional(),
  influencerIds: z.array(z.string()).optional(),
  conversionTypes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string()
  })).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'
    const dateFilter = searchParams.get('dateFilter') || 'all'
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // Calculate date range for filtering metrics
    let dateWhere = {}
    if (dateFilter && dateFilter !== 'all') {
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      switch (dateFilter) {
        case 'today':
          dateWhere = { createdAt: { gte: startOfToday } }
          break
        case 'yesterday':
          const startOfYesterday = new Date(startOfToday)
          startOfYesterday.setDate(startOfYesterday.getDate() - 1)
          dateWhere = {
            createdAt: {
              gte: startOfYesterday,
              lt: startOfToday
            }
          }
          break
        case 'last7days':
          const sevenDaysAgo = new Date(startOfToday)
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          dateWhere = { createdAt: { gte: sevenDaysAgo } }
          break
        case 'last30days':
          const thirtyDaysAgo = new Date(startOfToday)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          dateWhere = { createdAt: { gte: thirtyDaysAgo } }
          break
        case 'custom':
          if (fromDate && toDate) {
            const from = new Date(fromDate)
            const to = new Date(toDate)
            to.setHours(23, 59, 59, 999) // Include the entire 'to' date
            dateWhere = {
              createdAt: {
                gte: from,
                lte: to
              }
            }
          }
          break
      }
    }

    if (includeStats) {
      // Get campaigns with detailed analytics
      const campaigns = await prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          campaignInfluencers: {
            include: {
              influencer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  platform: true
                }
              }
            }
          }
        }
      })

      // Calculate stats for each campaign
      const campaignsWithStats = await Promise.all(
        campaigns.map(async (campaign) => {
          const [clickStats, leadStats, eventStats, registrationStats, ftdStats] = await Promise.all([
            // Clicks
            prisma.click.aggregate({
              where: {
                campaign: campaign.slug,
                ...dateWhere
              },
              _count: true
            }),
            // Leads
            prisma.lead.aggregate({
              where: {
                campaign: campaign.slug,
                ...dateWhere
              },
              _count: true,
              _sum: { value: true },
              _avg: { qualityScore: true }
            }),
            // Events
            prisma.event.aggregate({
              where: {
                campaign: campaign.slug,
                ...dateWhere
              },
              _count: true,
              _sum: { value: true }
            }),
            // Registrations (registration, signup, register events)
            prisma.event.aggregate({
              where: {
                campaign: campaign.slug,
                eventType: { in: ['registration', 'signup', 'register'] },
                ...dateWhere
              },
              _count: true
            }),
            // FTD (First Time Deposit events)
            prisma.event.aggregate({
              where: {
                campaign: campaign.slug,
                OR: [
                  { eventType: { in: ['deposit', 'ftd', 'first_deposit'] } },
                  { eventName: { in: ['deposit', 'ftd', 'first_deposit'] } }
                ],
                ...dateWhere
              },
              _count: true
            })
          ])

          // Get unique customers for this campaign
          const uniqueCustomers = await prisma.customer.count({
            where: {
              OR: [
                { clicks: { some: { campaign: campaign.slug, ...dateWhere } } },
                { leads: { some: { campaign: campaign.slug, ...dateWhere } } },
                { events: { some: { campaign: campaign.slug, ...dateWhere } } }
              ]
            }
          })

          // Get duplicates
          const duplicateLeads = await prisma.lead.count({
            where: {
              campaign: campaign.slug,
              isDuplicate: true,
              ...dateWhere
            }
          })

          // Get fraud flags
          const fraudClicks = await prisma.click.count({
            where: {
              campaign: campaign.slug,
              isFraud: true,
              ...dateWhere
            }
          })

          // Calculate rates
          const totalClicks = clickStats._count || 0
          const totalLeads = leadStats._count || 0
          const totalEvents = eventStats._count || 0
          const registrations = registrationStats._count || 0
          const ftd = ftdStats._count || 0

          const conversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0
          const duplicateRate = totalLeads > 0 ? (duplicateLeads / totalLeads) * 100 : 0
          const fraudRate = totalClicks > 0 ? (fraudClicks / totalClicks) * 100 : 0

          return {
            ...campaign,
            // Transform influencer data for backward compatibility
            influencerIds: campaign.campaignInfluencers.map(ci => ci.influencer.id),
            influencers: campaign.campaignInfluencers.map(ci => ci.influencer),
            stats: {
              totalClicks,
              totalLeads,
              totalEvents,
              registrations,
              ftd,
              approvedRegistrations: campaign.approvedRegistrations || 0,
              qualifiedDeposits: campaign.qualifiedDeposits || 0,
              uniqueCustomers,
              duplicateLeads,
              fraudClicks,
              conversionRate: Math.round(conversionRate * 100) / 100,
              duplicateRate: Math.round(duplicateRate * 100) / 100,
              fraudRate: Math.round(fraudRate * 100) / 100,
              avgQualityScore: Math.round((leadStats._avg.qualityScore || 0) * 100) / 100,
              totalLeadValue: Number(leadStats._sum.value || 0),
              totalEventValue: Number(eventStats._sum.value || 0),
              totalRevenue: Number(leadStats._sum.value || 0) + Number(eventStats._sum.value || 0)
            }
          }
        })
      )

      return NextResponse.json({
        success: true,
        campaigns: campaignsWithStats
      })
    } else {
      // Get basic campaign list
      const campaigns = await prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          campaignInfluencers: {
            include: {
              influencer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  platform: true
                }
              }
            }
          }
        }
      })

      // Transform campaigns to include influencer data
      const transformedCampaigns = campaigns.map(campaign => ({
        ...campaign,
        influencerIds: campaign.campaignInfluencers.map(ci => ci.influencer.id),
        influencers: campaign.campaignInfluencers.map(ci => ci.influencer)
      }))

      return NextResponse.json({
        success: true,
        campaigns: transformedCampaigns
      })
    }

  } catch (error) {
    console.error('Get campaigns error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch campaigns'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCampaignSchema.parse(body)

    // Check if slug already exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingCampaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign slug already exists'
      }, { status: 400 })
    }

    // Add comprehensive console debugging
    console.log('📊 Creating new campaign:', {
      name: validatedData.name,
      slug: validatedData.slug,
      influencerIds: validatedData.influencerIds,
      timestamp: new Date().toISOString()
    })

    // Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        clientId: validatedData.clientId,
        brandId: validatedData.brandId,
        logoUrl: validatedData.logoUrl,
        conversionTypes: validatedData.conversionTypes || []
      }
    })

    // Create influencer relationships if provided
    if (validatedData.influencerIds && validatedData.influencerIds.length > 0) {
      const influencerRelationships = validatedData.influencerIds.map(influencerId => ({
        campaignId: campaign.id,
        influencerId: influencerId,
        assignedBy: 'api-create'
      }))

      await prisma.campaignInfluencer.createMany({
        data: influencerRelationships
      })
    }

    console.log('✅ Campaign created successfully:', {
      id: campaign.id,
      name: campaign.name,
      influencerIds: validatedData.influencerIds,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      campaign
    })

  } catch (error) {
    console.error('Create campaign error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create campaign'
    }, { status: 500 })
  }
}