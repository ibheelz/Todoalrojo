import { PrismaClient } from '@prisma/client';

const REDTRACK_API_KEY = process.env.REDTRACK_API_KEY || 'UcJFVQO4KPJJa86fjkOa';
const PRODUCTION_URL = process.env.DATABASE_URL_PRODUCTION!;

const prodDb = new PrismaClient({ datasourceUrl: PRODUCTION_URL });

async function importRedtrackData() {
  console.log('🔄 Fetching today\'s data from Redtrack API...\n');

  const today = new Date().toISOString().split('T')[0];
  const endpoint = `https://api.redtrack.io/report?group=sub1&date_from=${today}&date_to=${today}&api_key=${REDTRACK_API_KEY}`;

  console.log(`📅 Date: ${today}\n`);

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API Error (${response.status}): ${error}`);
      return;
    }

    const data = await response.json();

    // Filter to get only valid click IDs (must start with "68")
    const validRecords = data.filter((item: any) => {
      const sub1 = item.sub1 || '';
      const startsWith68 = sub1.startsWith('68');
      const noMacros = !sub1.includes('{') && !sub1.includes('}') && !sub1.includes('[');
      const validLength = sub1.length >= 20; // Click IDs are 20+ chars
      return startsWith68 && noMacros && validLength;
    });

    console.log(`📊 Total Redtrack records: ${data.length}`);
    console.log(`✅ Valid click IDs: ${validRecords.length}`);
    console.log(`❌ Skipped (macros/empty): ${data.length - validRecords.length}\n`);

    if (validRecords.length === 0) {
      console.log('⚠️  No valid click IDs to import');
      return;
    }

    await prodDb.$connect();

    let imported = 0;
    let skipped = 0;

    for (const item of validRecords) {
      try {
        const clickId = String(item.sub1);
        const campaign = item.publisher_alias || 'unknown';
        const clickCount = item.clicks || 0;
        const uniqueClicks = item.unique_clicks || 0;
        const conversions = item.conversions || 0;
        const revenue = item.revenue || 0;

        console.log(`\n📊 Processing Click ID: ${clickId}`);
        console.log(`   Campaign: ${campaign}`);
        console.log(`   Clicks: ${clickCount} (${uniqueClicks} unique)`);
        console.log(`   Conversions: ${conversions}, Revenue: $${revenue}`);

        // Check if already exists
        const existing = await prodDb.customer.findFirst({
          where: {
            identifiers: {
              some: {
                type: 'CLICK_ID',
                value: clickId,
              },
            },
          },
        });

        if (existing) {
          console.log(`   ⏭️  Already exists (Customer ID: ${existing.id})`);
          skipped++;
          continue;
        }

        // Create new customer
        const customer = await prodDb.customer.create({
          data: {
            source: 'redtrack',
            totalClicks: clickCount,
            totalEvents: conversions,
            totalRevenue: revenue,
            identifiers: {
              create: {
                type: 'CLICK_ID',
                value: clickId,
                source: 'redtrack',
                campaign: campaign !== 'unknown' ? campaign : null,
              },
            },
            clicks: {
              create: {
                clickId: clickId,
                subId1: clickId,
                campaign: campaign,
                source: 'redtrack',
                ip: '0.0.0.0',
                userAgent: `Redtrack Import (${clickCount} clicks, ${uniqueClicks} unique)`,
                clickTime: new Date(),
              },
            },
          },
        });

        console.log(`   ✅ Imported (Customer ID: ${customer.id})`);
        imported++;

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        skipped++;
      }
    }

    console.log(`\n\n📊 IMPORT SUMMARY:`);
    console.log(`✅ Successfully imported: ${imported}`);
    console.log(`⏭️  Skipped (already exists): ${skipped}`);
    console.log(`\n📍 Check your dashboards:`);
    console.log(`   Production: https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/dashboard/customers`);
    console.log(`   Local: http://localhost:3005/dashboard/customers (sync in 5 min)`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prodDb.$disconnect();
  }
}

importRedtrackData();
