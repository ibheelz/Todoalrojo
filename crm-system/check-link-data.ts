import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL_PRODUCTION
})

async function checkLinkData() {
  console.log('\n🔍 Checking link data for ggbet1...\n')

  // Find the link
  const link = await prisma.shortLink.findUnique({
    where: { shortCode: 'ggbet1' },
    include: {
      linkInfluencers: {
        include: {
          influencer: true
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
  console.log(`   Destination: ${link.originalUrl}`)
  console.log(`   Total Clicks: ${link.totalClicks}`)
  console.log(`   Last Click: ${link.lastClickAt}`)
  console.log(`   Influencers: ${link.linkInfluencers.map(li => li.influencer.name).join(', ')}`)

  // Get recent LinkClick records
  const linkClicks = await prisma.linkClick.findMany({
    where: { linkId: link.id },
    orderBy: { clickTime: 'desc' },
    take: 10,
    include: {
      customer: true
    }
  })

  console.log(`\n📊 Recent LinkClicks (${linkClicks.length}):`)
  for (const click of linkClicks) {
    console.log(`\n   Click ID: ${click.clickId || 'none'}`)
    console.log(`   Time: ${click.clickTime}`)
    console.log(`   IP: ${click.ip}`)
    console.log(`   Country: ${click.country || 'N/A'}`)
    console.log(`   OS: ${click.os || 'N/A'}`)
    console.log(`   Browser: ${click.browser || 'N/A'}`)
    console.log(`   Customer: ${click.customer?.id || 'N/A'}`)
  }

  // Get recent Click records with same clickIds
  const clickIds = linkClicks.map(lc => lc.clickId).filter(Boolean)

  if (clickIds.length > 0) {
    const clicks = await prisma.click.findMany({
      where: {
        clickId: { in: clickIds as string[] }
      },
      orderBy: { clickTime: 'desc' }
    })

    console.log(`\n📈 Campaign Click Records (${clicks.length}):`)
    for (const click of clicks) {
      console.log(`\n   Click ID: ${click.clickId}`)
      console.log(`   Campaign: ${click.campaign || 'N/A'}`)
      console.log(`   Source: ${click.source || 'N/A'}`)
      console.log(`   Medium: ${click.medium || 'N/A'}`)
      console.log(`   Sub ID 1: ${click.subId1 || 'N/A'}`)
      console.log(`   Country: ${click.country || 'N/A'}`)
      console.log(`   Landing Page: ${click.landingPage || 'N/A'}`)
    }
  }

  await prisma.$disconnect()
}

checkLinkData().catch(console.error)
