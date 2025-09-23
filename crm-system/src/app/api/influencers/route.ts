import { NextRequest, NextResponse } from 'next/server'

// Mock influencers data - replace with actual database calls when ready
const mockInfluencers = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    phone: '+1234567890',
    socialHandle: '@alexjohnson',
    platform: 'Instagram',
    followers: 150000,
    engagementRate: 4.2,
    category: 'Lifestyle',
    location: 'Los Angeles, CA',
    status: 'active',
    assignedCampaigns: ['cmfwtr7cg0000lktxhpsfkx1h'], // Test Campaign with Influencer
    totalLeads: 45,
    totalClicks: 1250,
    totalRegs: 32,
    totalFtd: 8,
    createdAt: '2024-12-01'
  },
  {
    id: '2',
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    phone: '+1987654321',
    socialHandle: '@sarahwilliams',
    platform: 'TikTok',
    followers: 300000,
    engagementRate: 6.8,
    category: 'Fashion',
    location: 'New York, NY',
    status: 'active',
    assignedCampaigns: ['camp1'],
    totalLeads: 78,
    totalClicks: 2100,
    totalRegs: 55,
    totalFtd: 15,
    createdAt: '2024-11-15'
  },
  {
    id: '3',
    name: 'Emma Chen',
    email: 'emma@example.com',
    phone: '+1555666777',
    socialHandle: '@emmachen',
    platform: 'YouTube',
    followers: 85000,
    engagementRate: 5.4,
    category: 'Tech',
    location: 'San Francisco, CA',
    status: 'active',
    assignedCampaigns: [],
    totalLeads: 0,
    totalClicks: 0,
    totalRegs: 0,
    totalFtd: 0,
    createdAt: '2025-01-10'
  },
  {
    id: '4',
    name: 'Mike Rodriguez',
    email: 'mike@example.com',
    phone: '+1444555666',
    socialHandle: '@mikerodriguez',
    platform: 'Instagram',
    followers: 75000,
    engagementRate: 3.8,
    category: 'Fitness',
    location: 'Miami, FL',
    status: 'active',
    assignedCampaigns: ['camp2'],
    totalLeads: 23,
    totalClicks: 890,
    totalRegs: 15,
    totalFtd: 4,
    createdAt: '2024-10-20'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let influencers = mockInfluencers

    // Filter only active influencers if requested
    if (activeOnly) {
      influencers = influencers.filter(influencer => influencer.status === 'active')
    }

    return NextResponse.json({
      success: true,
      influencers
    })

  } catch (error) {
    console.error('Get influencers error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch influencers'
    }, { status: 500 })
  }
}