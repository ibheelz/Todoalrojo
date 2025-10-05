import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive seed with linked data...')

  // Clean existing data
  console.log('🗑️  Cleaning existing data...')
  await prisma.journeyMessage.deleteMany()
  await prisma.customerJourneyState.deleteMany()
  await prisma.linkClick.deleteMany()
  await prisma.linkInfluencer.deleteMany()
  await prisma.shortLink.deleteMany()
  await prisma.campaignInfluencer.deleteMany()
  await prisma.event.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.click.deleteMany()
  await prisma.identifier.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.influencer.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.operator.deleteMany()
  await prisma.client.deleteMany()

  // 1. Create Client & Operators (Brands)
  console.log('📦 Creating Client and Operators...')
  const client = await prisma.client.create({
    data: {
      name: 'Todo Al Rojo',
      slug: 'todoalrojo',
      email: 'admin@todoalrojo.com',
      isActive: true,
      canViewReports: true,
      canExportData: true,
      canViewAnalytics: true,
    },
  })

  const roobet = await prisma.operator.create({
    data: {
      clientId: client.id,
      name: 'Roobet',
      slug: 'roobet',
      brand: 'Roobet Casino',
      emailDomain: 'roobet.com',
      emailFromName: 'Roobet Casino',
      emailFromAddress: 'noreply@roobet.com',
      logoUrl: '/images/brands/roobet.png',
      primaryColor: '#9333ea',
      smsEnabled: true,
      smsSender: 'ROOBET',
      smsProvider: 'laaffic',
      status: 'ACTIVE',
    },
  })

  const rushbet = await prisma.operator.create({
    data: {
      clientId: client.id,
      name: 'Rushbet',
      slug: 'rushbet',
      brand: 'Rushbet Peru',
      emailDomain: 'rushbet.pe',
      emailFromName: 'Rushbet Peru',
      emailFromAddress: 'noreply@rushbet.pe',
      logoUrl: '/images/brands/rushbet.png',
      primaryColor: '#16a34a',
      smsEnabled: true,
      smsSender: 'RUSHBET',
      smsProvider: 'laaffic',
      status: 'ACTIVE',
    },
  })

  // 2. Create Campaigns
  console.log('🎯 Creating Campaigns...')
  const vipReloadCampaign = await prisma.campaign.create({
    data: {
      name: 'VIP Reload Bonus',
      slug: 'vip-reload',
      description: 'Exclusive reload bonus for VIP players',
      clientId: client.id,
      brandId: roobet.id,
      logoUrl: '/images/campaigns/vip-reload.png',
      isActive: true,
    },
  })

  const summerPromoCampaign = await prisma.campaign.create({
    data: {
      name: 'Summer Promo 2025',
      slug: 'summer-promo',
      description: 'Summer promotional campaign',
      clientId: client.id,
      brandId: roobet.id,
      logoUrl: '/images/campaigns/summer-promo.png',
      isActive: true,
    },
  })

  const peruLaunchCampaign = await prisma.campaign.create({
    data: {
      name: 'Peru Launch Campaign',
      slug: 'peru-launch',
      description: 'Launch campaign for Peru market',
      clientId: client.id,
      brandId: rushbet.id,
      logoUrl: '/images/campaigns/peru-launch.png',
      isActive: true,
    },
  })

  // 3. Create Influencers
  console.log('🌟 Creating Influencers...')
  const influencer1 = await prisma.influencer.create({
    data: {
      name: 'Carlos Gaming',
      email: 'carlos@gaming.com',
      phone: '+51987654321',
      socialHandle: '@carlosgaming',
      platform: 'instagram',
      followers: 125000,
      engagementRate: 4.5,
      category: 'Gaming',
      location: 'Peru',
      profileImage: '/images/influencers/carlos.png',
      status: 'active',
      commissionRate: 0.15,
      paymentMethod: 'bank_transfer',
    },
  })

  const influencer2 = await prisma.influencer.create({
    data: {
      name: 'Maria Casino',
      email: 'maria@casinolife.com',
      phone: '+51987654322',
      socialHandle: '@mariacasino',
      platform: 'tiktok',
      followers: 89000,
      engagementRate: 6.2,
      category: 'Casino',
      location: 'Colombia',
      profileImage: '/images/influencers/maria.png',
      status: 'active',
      commissionRate: 0.20,
      paymentMethod: 'paypal',
    },
  })

  // 4. Link Influencers to Campaigns
  console.log('🔗 Linking Influencers to Campaigns...')
  await prisma.campaignInfluencer.createMany({
    data: [
      {
        campaignId: vipReloadCampaign.id,
        influencerId: influencer1.id,
        assignedBy: 'admin',
        isActive: true,
      },
      {
        campaignId: summerPromoCampaign.id,
        influencerId: influencer2.id,
        assignedBy: 'admin',
        isActive: true,
      },
      {
        campaignId: peruLaunchCampaign.id,
        influencerId: influencer1.id,
        assignedBy: 'admin',
        isActive: true,
      },
    ],
  })

  // 5. Create Short Links
  console.log('🔗 Creating Short Links...')
  const link1 = await prisma.shortLink.create({
    data: {
      shortCode: 'vip-carlos',
      originalUrl: 'https://roobet.com/register?promo=VIP2025',
      title: 'VIP Reload - Carlos Gaming',
      description: 'Exclusive VIP reload bonus via Carlos Gaming',
      campaign: vipReloadCampaign.slug,
      source: 'instagram',
      medium: 'influencer',
      content: 'carlos-post',
      customDomain: 'rb.link',
      isActive: true,
      trackClicks: true,
    },
  })

  const link2 = await prisma.shortLink.create({
    data: {
      shortCode: 'summer-maria',
      originalUrl: 'https://roobet.com/register?promo=SUMMER25',
      title: 'Summer Promo - Maria Casino',
      description: 'Summer promotional bonus via Maria Casino',
      campaign: summerPromoCampaign.slug,
      source: 'tiktok',
      medium: 'influencer',
      content: 'maria-video',
      customDomain: 'rb.link',
      isActive: true,
      trackClicks: true,
    },
  })

  // 6. Link Influencers to Links
  await prisma.linkInfluencer.createMany({
    data: [
      { linkId: link1.id, influencerId: influencer1.id, assignedBy: 'admin', isActive: true },
      { linkId: link2.id, influencerId: influencer2.id, assignedBy: 'admin', isActive: true },
    ],
  })

  // 7. Create Customers with Complete Journey
  console.log('👥 Creating Customers with complete attribution chain...')

  // CUSTOMER 1: Full conversion funnel - Carlos Gaming → VIP Reload → Registration → Deposit
  const clickId1 = `CLK_${Date.now()}_001`
  const customer1 = await prisma.customer.create({
    data: {
      masterEmail: 'diego.rodriguez@example.com',
      masterPhone: '+51987654001',
      firstName: 'Diego',
      lastName: 'Rodriguez',
      country: 'Peru',
      city: 'Lima',
      source: 'instagram',
      totalClicks: 1,
      totalLeads: 1,
      totalEvents: 2,
      totalRevenue: 278.03,
    },
  })

  // Click
  await prisma.click.create({
    data: {
      customerId: customer1.id,
      clickId: clickId1,
      sessionId: `SES_${Date.now()}_001`,
      campaign: vipReloadCampaign.slug,
      source: 'instagram',
      medium: 'influencer',
      content: 'carlos-post',
      ip: '190.232.156.78',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      landingPage: `https://roobet.com/register?promo=VIP2025&cid=${clickId1}`,
      country: 'Peru',
      city: 'Lima',
      device: 'iPhone',
      browser: 'Safari',
      os: 'iOS',
      isMobile: true,
    },
  })

  // Lead
  await prisma.lead.create({
    data: {
      customerId: customer1.id,
      email: customer1.masterEmail,
      phone: customer1.masterPhone,
      firstName: customer1.firstName,
      lastName: customer1.lastName,
      clickId: clickId1,
      campaign: vipReloadCampaign.slug,
      source: 'instagram',
      medium: 'influencer',
      ip: '190.232.156.78',
      country: 'Peru',
      city: 'Lima',
      brandId: roobet.id,
      value: 50.0,
      qualityScore: 85,
    },
  })

  // Events
  await prisma.event.createMany({
    data: [
      {
        customerId: customer1.id,
        eventType: 'registration',
        eventName: 'User Registered',
        campaign: vipReloadCampaign.slug,
        source: 'instagram',
        medium: 'influencer',
        clickId: clickId1,
        brandId: roobet.id,
        value: 0,
      },
      {
        customerId: customer1.id,
        eventType: 'deposit',
        eventName: 'First Deposit',
        campaign: vipReloadCampaign.slug,
        source: 'instagram',
        medium: 'influencer',
        clickId: clickId1,
        brandId: roobet.id,
        value: 278.03,
        isRevenue: true,
      },
    ],
  })

  // Identifiers
  await prisma.identifier.createMany({
    data: [
      {
        customerId: customer1.id,
        type: 'EMAIL',
        value: customer1.masterEmail!,
        isPrimary: true,
        isVerified: true,
        campaign: vipReloadCampaign.slug,
        source: 'instagram',
      },
      {
        customerId: customer1.id,
        type: 'PHONE',
        value: customer1.masterPhone!,
        isPrimary: true,
        isVerified: true,
        campaign: vipReloadCampaign.slug,
        source: 'instagram',
      },
      {
        customerId: customer1.id,
        type: 'CLICK_ID',
        value: clickId1,
        campaign: vipReloadCampaign.slug,
        source: 'instagram',
      },
    ],
  })

  // CUSTOMER 2: Lead only (Maria Casino)
  const clickId2 = `CLK_${Date.now()}_002`
  const customer2 = await prisma.customer.create({
    data: {
      masterEmail: 'miguel.garcia@example.com',
      masterPhone: '+51987654029',
      firstName: 'Miguel',
      lastName: 'Garcia',
      country: 'Peru',
      city: 'Arequipa',
      source: 'tiktok',
      totalClicks: 1,
      totalLeads: 1,
      totalEvents: 0,
    },
  })

  await prisma.click.create({
    data: {
      customerId: customer2.id,
      clickId: clickId2,
      campaign: summerPromoCampaign.slug,
      source: 'tiktok',
      medium: 'influencer',
      ip: '190.232.156.79',
      country: 'Peru',
      city: 'Arequipa',
      isMobile: true,
    },
  })

  await prisma.lead.create({
    data: {
      customerId: customer2.id,
      email: customer2.masterEmail,
      phone: customer2.masterPhone,
      firstName: customer2.firstName,
      lastName: customer2.lastName,
      clickId: clickId2,
      campaign: summerPromoCampaign.slug,
      source: 'tiktok',
      medium: 'influencer',
      ip: '190.232.156.79',
      country: 'Peru',
      city: 'Arequipa',
      brandId: roobet.id,
    },
  })

  // CUSTOMER 3: Full funnel - Peru Launch
  const clickId3 = `CLK_${Date.now()}_003`
  const customer3 = await prisma.customer.create({
    data: {
      masterEmail: 'sofia.lopez@example.com',
      masterPhone: '+51987654030',
      firstName: 'Sofia',
      lastName: 'Lopez',
      country: 'Peru',
      city: 'Cusco',
      source: 'instagram',
      totalClicks: 1,
      totalLeads: 1,
      totalEvents: 3,
      totalRevenue: 450.0,
    },
  })

  await prisma.click.create({
    data: {
      customerId: customer3.id,
      clickId: clickId3,
      campaign: peruLaunchCampaign.slug,
      source: 'instagram',
      medium: 'influencer',
      ip: '190.232.156.80',
      country: 'Peru',
      city: 'Cusco',
      isMobile: true,
    },
  })

  await prisma.lead.create({
    data: {
      customerId: customer3.id,
      email: customer3.masterEmail,
      phone: customer3.masterPhone,
      firstName: customer3.firstName,
      lastName: customer3.lastName,
      clickId: clickId3,
      campaign: peruLaunchCampaign.slug,
      source: 'instagram',
      medium: 'influencer',
      ip: '190.232.156.80',
      country: 'Peru',
      city: 'Cusco',
      brandId: rushbet.id,
    },
  })

  await prisma.event.createMany({
    data: [
      {
        customerId: customer3.id,
        eventType: 'registration',
        eventName: 'User Registered',
        campaign: peruLaunchCampaign.slug,
        clickId: clickId3,
        brandId: rushbet.id,
      },
      {
        customerId: customer3.id,
        eventType: 'deposit',
        eventName: 'First Deposit',
        campaign: peruLaunchCampaign.slug,
        clickId: clickId3,
        brandId: rushbet.id,
        value: 200.0,
        isRevenue: true,
      },
      {
        customerId: customer3.id,
        eventType: 'deposit',
        eventName: 'Second Deposit',
        campaign: peruLaunchCampaign.slug,
        clickId: clickId3,
        brandId: rushbet.id,
        value: 250.0,
        isRevenue: true,
      },
    ],
  })

  // Update campaign stats
  console.log('📊 Updating campaign statistics...')
  await prisma.campaign.update({
    where: { id: vipReloadCampaign.id },
    data: {
      totalClicks: 1,
      totalLeads: 1,
      totalEvents: 2,
      totalRevenue: 278.03,
      registrations: 1,
      ftd: 1,
    },
  })

  await prisma.campaign.update({
    where: { id: summerPromoCampaign.id },
    data: {
      totalClicks: 1,
      totalLeads: 1,
      totalEvents: 0,
      registrations: 0,
      ftd: 0,
    },
  })

  await prisma.campaign.update({
    where: { id: peruLaunchCampaign.id },
    data: {
      totalClicks: 1,
      totalLeads: 1,
      totalEvents: 3,
      totalRevenue: 450.0,
      registrations: 1,
      ftd: 1,
    },
  })

  // Update influencer stats
  console.log('🌟 Updating influencer statistics...')
  await prisma.influencer.update({
    where: { id: influencer1.id },
    data: {
      totalClicks: 2,
      totalLeads: 2,
      totalRegs: 2,
      totalFtd: 2,
    },
  })

  await prisma.influencer.update({
    where: { id: influencer2.id },
    data: {
      totalClicks: 1,
      totalLeads: 1,
      totalRegs: 0,
      totalFtd: 0,
    },
  })

  console.log('✅ Comprehensive seed completed!')
  console.log(`
📊 Created:
   - 1 Client
   - 2 Operators (Brands): Roobet, Rushbet
   - 3 Campaigns: VIP Reload, Summer Promo, Peru Launch
   - 2 Influencers: Carlos Gaming, Maria Casino
   - 2 Short Links with influencer attribution
   - 3 Customers with complete attribution chains
   - 3 Click IDs: ${clickId1}, ${clickId2}, ${clickId3}
   - 3 Clicks, 3 Leads, 5 Events

🔗 All data is properly linked:
   ✓ Clicks → Leads → Events via Click ID
   ✓ Campaigns ↔ Influencers via CampaignInfluencer
   ✓ Links ↔ Influencers via LinkInfluencer
   ✓ Customers → Brands → Operators
   ✓ Complete attribution chain maintained
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
