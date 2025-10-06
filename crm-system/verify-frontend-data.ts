import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL_PRODUCTION
})

async function verifyData() {
  console.log('\n🔍 Checking link click data in Supabase...\n')

  // Get the link
  const link = await prisma.shortLink.findUnique({
    where: { shortCode: 'ggbet1' },
    include: {
      linkInfluencers: {
        include: {
          influencer: true
        }
      },
      clicks: {
        orderBy: { clickTime: 'desc' },
        take: 5,
        include: {
          customer: true
        }
      }
    }
  })

  if (!link) {
    console.log('❌ Link not found')
    return
  }

  console.log('📋 Link Info:')
  console.log(`   Short Code: ${link.shortCode}`)
  console.log(`   Campaign: ${link.campaign}`)
  console.log(`   Total Clicks: ${link.totalClicks}`)
  console.log(`   Influencers: ${link.linkInfluencers.map(li => li.influencer.name).join(', ')}`)

  console.log(`\n📊 Recent LinkClicks (${link.clicks.length}):`)
  for (const click of link.clicks) {
    console.log(`\n   ✅ Click ID: ${click.clickId || 'N/A'}`)
    console.log(`      Time: ${click.clickTime}`)
    console.log(`      Country: ${click.country || 'N/A'}`)
    console.log(`      Customer: ${click.customer?.id || 'N/A'}`)
  }

  // Check if clicks are in Click table too
  const campaignClicks = await prisma.click.findMany({
    where: {
      campaign: link.campaign
    },
    orderBy: { clickTime: 'desc' },
    take: 5,
    include: {
      customer: true
    }
  })

  console.log(`\n📈 Campaign Clicks for "${link.campaign}" (${campaignClicks.length}):`)
  for (const click of campaignClicks) {
    console.log(`\n   ✅ Click ID: ${click.clickId}`)
    console.log(`      Campaign: ${click.campaign}`)
    console.log(`      Source: ${click.source || 'N/A'}`)
    console.log(`      Customer: ${click.customer?.id || 'N/A'}`)
  }

  // Check campaign stats
  const campaign = await prisma.campaign.findFirst({
    where: {
      OR: [
        { slug: { equals: link.campaign!, mode: 'insensitive' } },
        { name: { equals: link.campaign!, mode: 'insensitive' } }
      ]
    }
  })

  if (campaign) {
    console.log(`\n🎯 Campaign Stats:`)
    console.log(`   Name: ${campaign.name}`)
    console.log(`   Total Clicks: ${campaign.totalClicks}`)
    console.log(`   Total Leads: ${campaign.totalLeads}`)
    console.log(`   Total FTDs: ${campaign.totalFtds}`)
  }

  // Check influencer stats
  if (link.linkInfluencers.length > 0) {
    const influencer = await prisma.influencer.findUnique({
      where: { id: link.linkInfluencers[0].influencerId }
    })

    if (influencer) {
      console.log(`\n👤 Influencer Stats:`)
      console.log(`   Name: ${influencer.name}`)
      console.log(`   Total Clicks: ${influencer.totalClicks}`)
      console.log(`   Total Leads: ${influencer.totalLeads}`)
      console.log(`   Total FTDs: ${influencer.totalFtds}`)
    }
  }

  await prisma.$disconnect()
}

verifyData().catch(console.error)
