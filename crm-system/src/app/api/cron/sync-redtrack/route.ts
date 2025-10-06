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

    // Calculate time range (last 5 minutes to ensure we don't miss any)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 5 * 60 * 1000); // 5 minutes ago

    const dateFrom = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateTo = endDate.toISOString().split('T')[0];

    console.log(`📅 [REDTRACK SYNC] Fetching conversions from ${dateFrom} to ${dateTo}`);

    // Use the conversions endpoint to fetch conversion data
    const endpoint = `https://api.redtrack.io/conversions?date_from=${dateFrom}&date_to=${dateTo}`;

    let conversions: any[] = [];

    try {
      console.log(`🔍 [REDTRACK SYNC] Fetching from: ${endpoint}`);

      const response = await fetch(endpoint, {
        headers: {
          'Api-Key': REDTRACK_API_KEY, // Redtrack uses Api-Key header
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text');
        console.log(`❌ [REDTRACK SYNC] Failed with status ${response.status}: ${errorText}`);
        return NextResponse.json({
          success: true, // Don't fail the cron job
          results: { total: 0, imported: 0, skipped: 0, errors: [] },
          warning: `API returned ${response.status}: ${errorText}`,
          message: 'API call failed, but continuing. Clicks should come via postback URL.',
          timestamp: new Date().toISOString(),
        });
      }

      const data = await response.json();
      console.log(`✅ [REDTRACK SYNC] Success!`);
      console.log(`📦 [REDTRACK SYNC] Response:`, JSON.stringify(data).substring(0, 500));

      // Handle Redtrack conversions response structure
      if (data.items && Array.isArray(data.items)) {
        conversions = data.items;
      } else if (Array.isArray(data)) {
        conversions = data;
      } else if (data.data && Array.isArray(data.data)) {
        conversions = data.data;
      }

    } catch (error: any) {
      console.log(`❌ [REDTRACK SYNC] Request error:`, error.message);
      return NextResponse.json({
        success: true, // Don't fail the cron job
        results: { total: 0, imported: 0, skipped: 0, errors: [] },
        warning: error.message,
        message: 'API request failed, but continuing. Clicks should come via postback URL.',
        timestamp: new Date().toISOString(),
      });
    }

    if (conversions.length === 0) {
      console.log('ℹ️ [REDTRACK SYNC] No new conversions found');
      return NextResponse.json({
        success: true,
        results: { total: 0, imported: 0, skipped: 0, errors: [] },
        message: 'No new conversions found. Clicks come via postback URL.',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📊 [REDTRACK SYNC] Found ${conversions.length} conversions to process`);

    const results = {
      total: conversions.length,
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each conversion
    for (const conversion of conversions) {
      try {
        // Extract conversion data
        const clickId = conversion.clickid || conversion.click_id || conversion.subid1 || conversion.sub1;
        const conversionType = conversion.type || conversion.conversion_type || 'Conversion';
        const value = conversion.revenue || conversion.payout || conversion.value || 0;
        const timestamp = conversion.datetime || conversion.created_at || conversion.timestamp || new Date().toISOString();

        // Skip if no click ID
        if (!clickId) {
          results.skipped++;
          continue;
        }

        // Check if conversion already exists
        const existingEvent = await prisma.event.findFirst({
          where: {
            eventType: 'Conversion',
            metadata: {
              path: ['clickId'],
              equals: String(clickId),
            },
          },
        });

        if (existingEvent) {
          results.skipped++;
          continue;
        }

        // Find customer by clickId
        const click = await prisma.click.findFirst({
          where: {
            OR: [
              { clickId: String(clickId) },
              { subId1: String(clickId) },
            ],
          },
        });

        if (!click || !click.customerId) {
          // No customer found for this click, skip
          results.skipped++;
          continue;
        }

        // Create event record for the conversion
        await prisma.event.create({
          data: {
            customerId: click.customerId,
            eventType: 'Conversion',
            eventName: conversionType,
            eventTime: new Date(timestamp),
            campaign: conversion.campaign || 'redtrack',
            source: 'redtrack',
            isRevenue: value > 0,
            revenue: value,
            metadata: {
              clickId: String(clickId),
              conversionType,
              redtrackData: conversion,
            },
          },
        });

        // Update customer stats
        await prisma.customer.update({
          where: { id: click.customerId },
          data: {
            totalEvents: { increment: 1 },
            totalRevenue: { increment: value },
            lastSeen: new Date(),
          },
        });

        results.imported++;
      } catch (error: any) {
        results.errors.push(`Conversion ${conversion.clickid || 'unknown'}: ${error.message}`);
      }
    }

    console.log(`✅ [REDTRACK SYNC] Sync complete: ${results.imported} conversions imported, ${results.skipped} skipped`);

    return NextResponse.json({
      success: true,
      results,
      message: 'Conversions synced successfully. Clicks come via postback URL.',
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
