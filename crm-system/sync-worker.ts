import { PrismaClient } from '@prisma/client';

const PRODUCTION_URL = process.env.DATABASE_URL_PRODUCTION!;
const LOCAL_URL = process.env.DATABASE_URL_LOCAL!;

if (!PRODUCTION_URL || !LOCAL_URL) {
  console.error('❌ Missing DATABASE_URL_PRODUCTION or DATABASE_URL_LOCAL');
  process.exit(1);
}

async function syncData() {
  // Connect to production
  const prodDb = new PrismaClient({
    datasourceUrl: PRODUCTION_URL,
  });

  // Connect to local
  const localDb = new PrismaClient({
    datasourceUrl: LOCAL_URL,
  });

  try {
    await prodDb.$connect();
    await localDb.$connect();

    console.log('✅ Connected to both databases\n');

    const stats = {
      campaigns: 0,
      influencers: 0,
      links: 0,
      linkInfluencers: 0,
      campaignInfluencers: 0,
      customers: 0,
      identifiers: 0,
      clicks: 0,
      leads: 0,
      events: 0,
      linkClicks: 0,
    };

    // 1. Sync Campaigns
    const prodCampaigns = await prodDb.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    for (const campaign of prodCampaigns) {
      await localDb.campaign.upsert({
        where: { id: campaign.id },
        update: {
          name: campaign.name,
          slug: campaign.slug,
          description: campaign.description,
          status: campaign.status,
          totalClicks: campaign.totalClicks,
          totalLeads: campaign.totalLeads,
          totalEvents: campaign.totalEvents,
          totalRevenue: campaign.totalRevenue,
          registrations: campaign.registrations,
          ftd: campaign.ftd,
          approvedRegistrations: campaign.approvedRegistrations,
          qualifiedDeposits: campaign.qualifiedDeposits,
          updatedAt: campaign.updatedAt,
        },
        create: campaign,
      });
      stats.campaigns++;
    }
    console.log(`✅ Campaigns: ${stats.campaigns}`);

    // 2. Sync Influencers
    const prodInfluencers = await prodDb.influencer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    for (const influencer of prodInfluencers) {
      await localDb.influencer.upsert({
        where: { id: influencer.id },
        update: {
          name: influencer.name,
          email: influencer.email,
          phone: influencer.phone,
          socialHandle: influencer.socialHandle,
          platform: influencer.platform,
          followers: influencer.followers,
          status: influencer.status,
          totalLeads: influencer.totalLeads,
          totalClicks: influencer.totalClicks,
          totalRegs: influencer.totalRegs,
          totalFtd: influencer.totalFtd,
          updatedAt: influencer.updatedAt,
        },
        create: influencer,
      });
      stats.influencers++;
    }
    console.log(`✅ Influencers: ${stats.influencers}`);

    // 3. Sync Links
    const prodLinks = await prodDb.shortLink.findMany({
      orderBy: { createdAt: 'desc' },
    });

    for (const link of prodLinks) {
      await localDb.shortLink.upsert({
        where: { id: link.id },
        update: {
          shortCode: link.shortCode,
          originalUrl: link.originalUrl,
          title: link.title,
          description: link.description,
          campaign: link.campaign,
          source: link.source,
          totalClicks: link.totalClicks,
          uniqueClicks: link.uniqueClicks,
          lastClickAt: link.lastClickAt,
          updatedAt: link.updatedAt,
        },
        create: link,
      });
      stats.links++;
    }
    console.log(`✅ Links: ${stats.links}`);

    // 4. Sync Link Influencers
    const prodLinkInfluencers = await prodDb.linkInfluencer.findMany();
    for (const li of prodLinkInfluencers) {
      try {
        await localDb.linkInfluencer.upsert({
          where: { id: li.id },
          update: li,
          create: li,
        });
        stats.linkInfluencers++;
      } catch (error: any) {
        // Skip if foreign key constraint fails
        if (!error.message.includes('Foreign key constraint')) {
          throw error;
        }
      }
    }
    console.log(`✅ Link Influencers: ${stats.linkInfluencers}`);

    // 5. Sync Campaign Influencers
    const prodCampaignInfluencers = await prodDb.campaignInfluencer.findMany();
    for (const ci of prodCampaignInfluencers) {
      try {
        await localDb.campaignInfluencer.upsert({
          where: { id: ci.id },
          update: ci,
          create: ci,
        });
        stats.campaignInfluencers++;
      } catch (error: any) {
        // Skip if foreign key constraint fails
        if (!error.message.includes('Foreign key constraint')) {
          throw error;
        }
      }
    }
    console.log(`✅ Campaign Influencers: ${stats.campaignInfluencers}`);

    // 6. Sync Customers (last 100 to avoid overload)
    const prodCustomers = await prodDb.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    for (const customer of prodCustomers) {
      await localDb.customer.upsert({
        where: { id: customer.id },
        update: {
          masterEmail: customer.masterEmail,
          masterPhone: customer.masterPhone,
          firstName: customer.firstName,
          lastName: customer.lastName,
          source: customer.source,
          country: customer.country,
          totalClicks: customer.totalClicks,
          totalLeads: customer.totalLeads,
          totalEvents: customer.totalEvents,
          totalRevenue: customer.totalRevenue,
          lastSeen: customer.lastSeen,
          updatedAt: customer.updatedAt,
        },
        create: customer,
      });
      stats.customers++;
    }
    console.log(`✅ Customers: ${stats.customers}`);

    // 7. Sync Identifiers
    if (prodCustomers.length > 0) {
      const prodIdentifiers = await prodDb.identifier.findMany({
        where: {
          customerId: { in: prodCustomers.map(c => c.id) },
        },
      });

      for (const identifier of prodIdentifiers) {
        try {
          await localDb.identifier.upsert({
            where: { id: identifier.id },
            update: identifier,
            create: identifier,
          });
          stats.identifiers++;
        } catch (error: any) {
          // Skip if unique constraint fails or FK constraint fails
          if (!error.message.includes('Unique constraint') &&
              !error.message.includes('Foreign key constraint')) {
            throw error;
          }
        }
      }
      console.log(`✅ Identifiers: ${stats.identifiers}`);
    }

    // 8. Sync Clicks (last 200)
    const prodClicks = await prodDb.click.findMany({
      orderBy: { clickTime: 'desc' },
      take: 200,
    });

    for (const click of prodClicks) {
      try {
        await localDb.click.upsert({
          where: { id: click.id },
          update: click,
          create: click,
        });
        stats.clicks++;
      } catch (error: any) {
        // Skip if FK constraint fails
        if (!error.message.includes('Foreign key constraint')) {
          throw error;
        }
      }
    }
    console.log(`✅ Clicks: ${stats.clicks}`);

    // 9. Sync Leads (last 100)
    const prodLeads = await prodDb.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    for (const lead of prodLeads) {
      try {
        await localDb.lead.upsert({
          where: { id: lead.id },
          update: lead,
          create: lead,
        });
        stats.leads++;
      } catch (error: any) {
        // Skip if FK constraint fails
        if (!error.message.includes('Foreign key constraint')) {
          throw error;
        }
      }
    }
    console.log(`✅ Leads: ${stats.leads}`);

    // 10. Sync Events (last 100)
    const prodEvents = await prodDb.event.findMany({
      orderBy: { eventTime: 'desc' },
      take: 100,
    });

    for (const event of prodEvents) {
      try {
        await localDb.event.upsert({
          where: { id: event.id },
          update: event,
          create: event,
        });
        stats.events++;
      } catch (error: any) {
        // Skip if FK constraint fails
        if (!error.message.includes('Foreign key constraint')) {
          throw error;
        }
      }
    }
    console.log(`✅ Events: ${stats.events}`);

    // 11. Sync Link Clicks (last 200)
    const prodLinkClicks = await prodDb.linkClick.findMany({
      orderBy: { clickTime: 'desc' },
      take: 200,
    });

    for (const linkClick of prodLinkClicks) {
      try {
        await localDb.linkClick.upsert({
          where: { id: linkClick.id },
          update: linkClick,
          create: linkClick,
        });
        stats.linkClicks++;
      } catch (error: any) {
        // Skip if FK constraint fails
        if (!error.message.includes('Foreign key constraint')) {
          throw error;
        }
      }
    }
    console.log(`✅ Link Clicks: ${stats.linkClicks}`);

    console.log('\n📊 Sync Summary:');
    console.log(JSON.stringify(stats, null, 2));

  } catch (error: any) {
    console.error('❌ Sync error:', error.message);
    throw error;
  } finally {
    await prodDb.$disconnect();
    await localDb.$disconnect();
  }
}

syncData().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
