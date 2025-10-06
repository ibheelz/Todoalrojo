import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserService } from '@/lib/user-service';

/**
 * Sync Clicks from Redtrack API
 * Runs every minute to pull recent clicks from Redtrack
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const REDTRACK_API_KEY = process.env.REDTRACK_API_KEY;

    if (!REDTRACK_API_KEY) {
      return NextResponse.json(
        { error: 'Redtrack API key not configured' },
        { status: 500 }
      );
    }

    console.log('📊 [REDTRACK SYNC] Starting click sync from Redtrack...');

    // Calculate time range (last 2 minutes to ensure we don't miss any)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 2 * 60 * 1000); // 2 minutes ago

    const dateFrom = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateTo = endDate.toISOString().split('T')[0];

    // Try common Redtrack API endpoints
    const possibleEndpoints = [
      `https://api.redtrack.io/v1/reports/clicks?date_from=${dateFrom}&date_to=${dateTo}`,
      `https://api.redtrack.io/v1/clicks?date_from=${dateFrom}&date_to=${dateTo}`,
      `https://api.redtrack.io/reports/clicks?date_from=${dateFrom}&date_to=${dateTo}`,
      `https://api.redtrack.io/clicks?from=${startDate.toISOString()}&to=${endDate.toISOString()}`,
    ];

    let clicks: any[] = [];
    let successfulEndpoint = '';

    // Try each endpoint until one works
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`🔍 [REDTRACK SYNC] Trying endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${REDTRACK_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ [REDTRACK SYNC] Success with endpoint: ${endpoint}`);
          console.log(`📦 [REDTRACK SYNC] Response data:`, JSON.stringify(data).substring(0, 500));

          // Handle different response structures
          if (Array.isArray(data)) {
            clicks = data;
          } else if (data.data && Array.isArray(data.data)) {
            clicks = data.data;
          } else if (data.clicks && Array.isArray(data.clicks)) {
            clicks = data.clicks;
          } else if (data.rows && Array.isArray(data.rows)) {
            clicks = data.rows;
          }

          successfulEndpoint = endpoint;
          break;
        } else {
          console.log(`⚠️ [REDTRACK SYNC] Failed with status ${response.status}: ${await response.text().catch(() => 'No error text')}`);
        }
      } catch (error: any) {
        console.log(`⚠️ [REDTRACK SYNC] Error with endpoint ${endpoint}:`, error.message);
      }
    }

    if (clicks.length === 0 && !successfulEndpoint) {
      console.log('⚠️ [REDTRACK SYNC] Could not fetch clicks from any endpoint');
      return NextResponse.json({
        success: false,
        error: 'Could not fetch clicks from Redtrack API',
        message: 'All API endpoints failed. Check API key and endpoint URLs.',
      }, { status: 500 });
    }

    console.log(`📊 [REDTRACK SYNC] Found ${clicks.length} clicks to process`);

    const results = {
      total: clicks.length,
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each click
    for (const click of clicks) {
      try {
        // Extract click data (flexible field mapping)
        const clickId = click.click_id || click.clickId || click.id || click.subid1;
        const ip = click.ip || click.ip_address || '0.0.0.0';
        const campaign = click.campaign || click.campaign_name || click.campaignName;
        const source = click.source || click.traffic_source || click.trafficSource;
        const timestamp = click.timestamp || click.created_at || click.createdAt || click.date;

        // Skip if no click ID
        if (!clickId) {
          results.skipped++;
          continue;
        }

        // Check if click already exists
        const existingClick = await prisma.click.findFirst({
          where: {
            OR: [
              { clickId: String(clickId) },
              { subId1: String(clickId) },
            ],
          },
        });

        if (existingClick) {
          results.skipped++;
          continue;
        }

        // Find or create user
        const user = await UserService.findOrCreateUser({
          clickId: String(clickId),
          ip,
        });

        // Create click record
        await prisma.click.create({
          data: {
            customerId: user?.id,
            clickId: String(clickId),
            subId1: String(clickId),
            campaign: campaign || 'unknown',
            source: source || 'redtrack',
            ip,
            userAgent: click.user_agent || click.userAgent || 'Redtrack Import',
            clickTime: timestamp ? new Date(timestamp) : new Date(),
          },
        });

        // Update user click count
        if (user) {
          await prisma.customer.update({
            where: { id: user.id },
            data: {
              totalClicks: { increment: 1 },
              lastSeen: new Date(),
            },
          });
        }

        // Update campaign stats if campaign exists
        if (campaign) {
          const existingCampaign = await prisma.campaign.findFirst({
            where: {
              OR: [
                { slug: { equals: campaign, mode: 'insensitive' } },
                { name: { equals: campaign, mode: 'insensitive' } },
              ],
            },
          });

          if (existingCampaign) {
            await prisma.campaign.update({
              where: { id: existingCampaign.id },
              data: {
                totalClicks: { increment: 1 },
              },
            });
          }
        }

        results.imported++;
      } catch (error: any) {
        results.errors.push(`Click ${click.click_id || 'unknown'}: ${error.message}`);
      }
    }

    console.log(`✅ [REDTRACK SYNC] Sync complete: ${results.imported} imported, ${results.skipped} skipped`);

    return NextResponse.json({
      success: true,
      results,
      endpoint: successfulEndpoint,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [REDTRACK SYNC] Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Allow manual triggering via POST
  return GET(request);
}
