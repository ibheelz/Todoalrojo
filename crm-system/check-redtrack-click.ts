import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL_PRODUCTION
})

async function checkRedtrackClick() {
  console.log('\n🔍 Checking Redtrack Click Details...\n')

  const click = await prisma.click.findFirst({
    where: {
      clickId: '68e44fc9abae44175530e633'
    },
    include: {
      customer: true
    }
  })

  if (!click) {
    console.log('❌ Click not found')
    return
  }

  console.log('✅ REDTRACK CLICK CAPTURED:\n')
  console.log('📊 Click Data:')
  console.log(`   Click ID: ${click.clickId}`)
  console.log(`   Time: ${click.clickTime}`)
  console.log(`   Campaign: ${click.campaign}`)
  console.log(`   Source: ${click.source}`)
  console.log(`   Medium: ${click.medium}`)
  console.log(`   Content: ${click.content || 'N/A'}`)
  console.log(`   Term: ${click.term || 'N/A'}`)

  console.log('\n📍 Geographic Data:')
  console.log(`   Country: ${click.country}`)
  console.log(`   Region: ${click.region || 'N/A'}`)
  console.log(`   City: ${click.city || 'N/A'}`)
  console.log(`   IP: ${click.ip}`)

  console.log('\n💻 Device Data:')
  console.log(`   OS: ${click.os || 'N/A'}`)
  console.log(`   Browser: ${click.browser || 'N/A'}`)
  console.log(`   Device: ${click.device || 'N/A'}`)
  console.log(`   User Agent: ${click.userAgent?.substring(0, 50) || 'N/A'}...`)

  console.log('\n🔗 Sub IDs:')
  console.log(`   Sub ID 1: ${click.subId1 || 'N/A'}`)
  console.log(`   Sub ID 2: ${click.subId2 || 'N/A'}`)
  console.log(`   Sub ID 3: ${click.subId3 || 'N/A'}`)
  console.log(`   Sub ID 4: ${click.subId4 || 'N/A'}`)
  console.log(`   Sub ID 5: ${click.subId5 || 'N/A'}`)

  console.log('\n👤 Customer:')
  console.log(`   ID: ${click.customer?.id}`)
  console.log(`   Email: ${click.customer?.masterEmail || 'N/A'}`)
  console.log(`   Phone: ${click.customer?.masterPhone || 'N/A'}`)
  console.log(`   Total Clicks: ${click.customer?.totalClicks}`)

  console.log('\n🌐 Referrer & Landing:')
  console.log(`   Referrer: ${click.referrer || 'N/A'}`)
  console.log(`   Landing Page: ${click.landingPage || 'N/A'}`)

  await prisma.$disconnect()
}

checkRedtrackClick().catch(console.error)
