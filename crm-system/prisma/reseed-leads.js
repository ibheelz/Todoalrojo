const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Clearing all leads and recreating them linked to customers...')

  // Clear all existing leads
  await prisma.lead.deleteMany({})
  console.log('✅ Cleared all existing leads')

  // Get all existing customers
  const customers = await prisma.customer.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log(`📊 Found ${customers.length} customers to create leads for`)

  // Get existing campaigns
  const campaigns = await prisma.campaign.findMany()
  const campaign1 = campaigns.find(c => c.slug === 'summer-promotion-2024')
  const campaign2 = campaigns.find(c => c.slug === 'black-friday-2024')

  // Get client for leads
  const client = await prisma.client.findFirst()

  if (!client) {
    throw new Error('No client found')
  }

  // Create leads for each customer with varied data
  const sources = ['google', 'facebook', 'linkedin', 'twitter', 'instagram', 'referral', 'organic', 'pinterest', 'youtube', 'tiktok']
  const countries = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'NL', 'SG', 'JP', 'ES']
  const cities = ['New York', 'London', 'Toronto', 'Sydney', 'Berlin', 'Paris', 'Amsterdam', 'Singapore', 'Tokyo', 'Madrid']

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i]
    const campaign = i % 2 === 0 ? campaign1 : campaign2
    const source = sources[i % sources.length]
    const country = countries[i % countries.length]
    const city = cities[i % cities.length]

    // Create 1-3 leads per customer to make it more realistic
    const leadCount = Math.floor(Math.random() * 3) + 1

    for (let j = 0; j < leadCount; j++) {
      const daysAgo = Math.floor(Math.random() * 30) // Random date within last 30 days
      const createdAt = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000))

      const lead = await prisma.lead.create({
        data: {
          customerId: customer.id,
          email: customer.masterEmail,
          phone: customer.masterPhone,
          firstName: customer.firstName,
          lastName: customer.lastName,
          campaign: campaign?.slug || 'default-campaign',
          source: source,
          medium: source === 'google' ? 'cpc' : source === 'facebook' ? 'social' : 'organic',
          ip: `192.168.1.${100 + i + j}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          referrer: `https://${source}.com`,
          landingPage: 'https://example.com/landing',
          country: country,
          region: country === 'US' ? 'California' : country === 'UK' ? 'England' : 'Europe',
          city: city,
          isEmailValid: true,
          isPhoneValid: customer.masterPhone ? true : false,
          qualityScore: 70 + Math.floor(Math.random() * 30), // Random score between 70-99
          isDuplicate: j > 0, // Mark subsequent leads as duplicates
          clientId: client.id,
          value: Math.floor(Math.random() * 200) + 50, // Random value between $50-$250
          currency: 'USD',
          createdAt: createdAt,
        },
      })

      console.log(`✅ Created lead ${j + 1}/${leadCount} for customer: ${customer.firstName} ${customer.lastName}`)
    }
  }

  // Update customer totalLeads count
  for (const customer of customers) {
    const leadCount = await prisma.lead.count({
      where: { customerId: customer.id }
    })

    await prisma.customer.update({
      where: { id: customer.id },
      data: { totalLeads: leadCount }
    })
  }

  const totalLeads = await prisma.lead.count()
  console.log(`🎉 Successfully created ${totalLeads} leads linked to ${customers.length} customers!`)
}

main()
  .catch((e) => {
    console.error('❌ Error reseeding leads:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })