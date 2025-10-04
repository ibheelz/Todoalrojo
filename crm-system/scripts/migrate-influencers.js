const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateInfluencers() {
  console.log('Starting influencer migration...')

  try {
    // First, create influencers from the existing influencer API data
    const existingInfluencers = [
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
        totalLeads: 45,
        totalClicks: 1250,
        totalRegs: 32,
        totalFtd: 8,
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
        totalLeads: 78,
        totalClicks: 2100,
        totalRegs: 55,
        totalFtd: 15,
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
        totalLeads: 0,
        totalClicks: 0,
        totalRegs: 0,
        totalFtd: 0,
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
        totalLeads: 23,
        totalClicks: 890,
        totalRegs: 15,
        totalFtd: 4,
      }
    ]

    // Create influencers
    for (const influencer of existingInfluencers) {
      await prisma.influencer.upsert({
        where: { id: influencer.id },
        update: {},
        create: {
          id: influencer.id,
          name: influencer.name,
          email: influencer.email,
          phone: influencer.phone,
          socialHandle: influencer.socialHandle,
          platform: influencer.platform,
          followers: influencer.followers,
          engagementRate: influencer.engagementRate,
          category: influencer.category,
          location: influencer.location,
          status: influencer.status,
          totalLeads: influencer.totalLeads,
          totalClicks: influencer.totalClicks,
          totalRegs: influencer.totalRegs,
          totalFtd: influencer.totalFtd,
        }
      })
      console.log(`Created/updated influencer: ${influencer.name}`)
    }

    // Create sample campaign-influencer relationships
    const campaigns = await prisma.campaign.findMany()
    const sampleAssignments = [
      // Assign Alex Johnson (id: 1) to first campaign
      { campaignId: campaigns[0]?.id, influencerId: '1' },
      // Assign Sarah Williams (id: 2) to first campaign as well (multi-influencer test)
      { campaignId: campaigns[0]?.id, influencerId: '2' },
    ]

    for (const assignment of sampleAssignments) {
      if (assignment.campaignId) {
        try {
          await prisma.campaignInfluencer.create({
            data: {
              campaignId: assignment.campaignId,
              influencerId: assignment.influencerId,
              assignedBy: 'migration-script'
            }
          })
          console.log(`Created campaign-influencer relationship: ${assignment.campaignId} -> ${assignment.influencerId}`)
        } catch (error) {
          console.log(`Skipped duplicate relationship: ${assignment.campaignId} -> ${assignment.influencerId}`)
        }
      }
    }

    // Create sample link-influencer relationships
    const links = await prisma.shortLink.findMany()
    const linkAssignments = [
      // Assign multiple influencers to first few links
      { linkId: links[0]?.id, influencerId: '1' },
      { linkId: links[0]?.id, influencerId: '3' },
      { linkId: links[1]?.id, influencerId: '2' },
    ]

    for (const assignment of linkAssignments) {
      if (assignment.linkId) {
        try {
          await prisma.linkInfluencer.create({
            data: {
              linkId: assignment.linkId,
              influencerId: assignment.influencerId,
              assignedBy: 'migration-script'
            }
          })
          console.log(`Created link-influencer relationship: ${assignment.linkId} -> ${assignment.influencerId}`)
        } catch (error) {
          console.log(`Skipped duplicate relationship: ${assignment.linkId} -> ${assignment.influencerId}`)
        }
      }
    }

    console.log('Migration completed successfully!')

  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  migrateInfluencers()
    .then(() => {
      console.log('✅ Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error)
      process.exit(1)
    })
}

module.exports = { migrateInfluencers }