import { PrismaClient } from '@prisma/client';

const REDTRACK_API_KEY = process.env.REDTRACK_API_KEY || 'UcJFVQO4KPJJa86fjkOa';
const PRODUCTION_URL = process.env.DATABASE_URL_PRODUCTION!;

const prodDb = new PrismaClient({ datasourceUrl: PRODUCTION_URL });

async function fetchTodayClicks() {
  console.log('🔄 Fetching today\'s clicks from Redtrack API...\n');

  const today = new Date().toISOString().split('T')[0];

  // Use query parameter for API key (correct Redtrack auth method)
  const endpoint = `https://api.redtrack.io/report?group=sub1&date_from=${today}&date_to=${today}&api_key=${REDTRACK_API_KEY}`;

  console.log(`📅 Fetching data for: ${today}\n`);

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API Error (${response.status}): ${error}`);
      return;
    }

    const data = await response.json();
    console.log('✅ Response received from Redtrack\n');
    console.log('📦 Full Response:', JSON.stringify(data, null, 2));

    let items: any[] = [];
    if (data.items && Array.isArray(data.items)) {
      items = data.items;
    } else if (Array.isArray(data)) {
      items = data;
    }

    if (items.length === 0) {
      console.log('\n⚠️  No clicks found for today');
      console.log('This could mean:');
      console.log('  - No traffic today yet');
      console.log('  - Wrong API endpoint');
      console.log('  - API key issues');
      return;
    }

    console.log(`\n📊 Found ${items.length} click records\n`);

    await prodDb.$connect();

    let imported = 0;
    let skipped = 0;

    for (const item of items) {
      try {
        const clickId = item.sub1 || item.subid1 || item.click_id || item.clickid;
        const clickCount = item.clicks || 1;
        const publisher = item.publisher_alias || 'redtrack';
        const revenue = item.revenue || 0;
        const conversions = item.conversions || 0;

        if (!clickId || clickId === '') {
          console.log(`⏭️  Skipped group with ${clickCount} clicks (no sub1/clickId)`);
          skipped += clickCount;
          continue;
        }

        // Skip Redtrack macro placeholders (not real click IDs)
        if (String(clickId).includes('{') || String(clickId).includes('}')) {
          console.log(`⏭️  Skipped Redtrack macro: "${clickId}" (${clickCount} clicks)`);
          skipped += clickCount;
          continue;
        }

        console.log(`\n📊 Processing: sub1="${clickId}" (${publisher})`);
        console.log(`   Clicks: ${clickCount}, Conversions: ${conversions}, Revenue: $${revenue}`);

        // Check if this clickId already exists
        const existing = await prodDb.click.findFirst({
          where: {
            OR: [
              { clickId: String(clickId) },
              { subId1: String(clickId) },
            ],
          },
        });

        if (existing) {
          console.log(`   ⏭️  Already exists in database`);
          skipped++;
          continue;
        }

        // Create customer directly in production database
        let customer = await prodDb.customer.findFirst({
          where: {
            identifiers: {
              some: {
                type: 'CLICK_ID',
                value: String(clickId),
              },
            },
          },
        });

        if (!customer) {
          customer = await prodDb.customer.create({
            data: {
              totalClicks: 0,
              totalEvents: 0,
              totalRevenue: 0,
              identifiers: {
                create: {
                  type: 'CLICK_ID',
                  value: String(clickId),
                },
              },
            },
          });
          console.log(`   ✅ Created customer: ${customer.id}`);
        }

        // Create click record
        await prodDb.click.create({
          data: {
            customerId: customer.id,
            clickId: String(clickId),
            subId1: String(clickId),
            campaign: publisher.toLowerCase(),
            source: 'redtrack',
            ip: '0.0.0.0',
            userAgent: `Redtrack Import (${clickCount} clicks)`,
            clickTime: new Date(),
          },
        });

        // Update customer stats
        await prodDb.customer.update({
          where: { id: customer.id },
          data: {
            totalClicks: { increment: clickCount },
            totalEvents: conversions > 0 ? { increment: conversions } : undefined,
            totalRevenue: revenue > 0 ? { increment: revenue } : undefined,
          },
        });

        console.log(`   ✅ Imported: ${clickId} (${clickCount} clicks)`);
        imported++;

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`\n📊 Check your dashboard: https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/dashboard/customers`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prodDb.$disconnect();
  }
}

fetchTodayClicks();
