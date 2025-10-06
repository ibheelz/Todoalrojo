import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Clear Test/Fake Data - Production Only
 * Removes all test data and keeps only real production data
 */

export async function POST(request: NextRequest) {
  try {
    // Verify admin secret
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.CRON_SECRET; // Reuse CRON_SECRET for admin operations

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧹 [ADMIN] Starting test data cleanup...');

    const results = {
      customersDeleted: 0,
      clicksDeleted: 0,
      leadsDeleted: 0,
      eventsDeleted: 0,
      journeyStatesDeleted: 0,
      journeyMessagesDeleted: 0,
    };

    // Define test data patterns
    const testPatterns = [
      'test',
      'TEST',
      'demo',
      'DEMO',
      'fake',
      'FAKE',
      'sample',
      'SAMPLE',
      'example',
      'EXAMPLE',
      'JOURNEY_TEST',
      'FLOW_TEST',
      'PROD_TEST',
      'FINAL_TEST',
      'CHECK_DB',
    ];

    // Delete journey messages for test customers first (FK constraint)
    const testCustomers = await prisma.customer.findMany({
      where: {
        OR: [
          { masterEmail: { contains: 'test', mode: 'insensitive' } },
          { masterEmail: { contains: 'example', mode: 'insensitive' } },
          { masterEmail: { contains: 'demo', mode: 'insensitive' } },
          { masterEmail: { contains: 'fake', mode: 'insensitive' } },
          { masterPhone: { contains: '+51999', mode: 'insensitive' } }, // Test phone pattern
        ],
      },
      select: { id: true },
    });

    const testCustomerIds = testCustomers.map(c => c.id);

    if (testCustomerIds.length > 0) {
      // Delete journey messages
      const deletedMessages = await prisma.journeyMessage.deleteMany({
        where: {
          journeyState: {
            customerId: { in: testCustomerIds },
          },
        },
      });
      results.journeyMessagesDeleted = deletedMessages.count;

      // Delete journey states
      const deletedJourneyStates = await prisma.customerJourneyState.deleteMany({
        where: {
          customerId: { in: testCustomerIds },
        },
      });
      results.journeyStatesDeleted = deletedJourneyStates.count;

      // Delete events
      const deletedEvents = await prisma.event.deleteMany({
        where: {
          customerId: { in: testCustomerIds },
        },
      });
      results.eventsDeleted = deletedEvents.count;

      // Delete leads
      const deletedLeads = await prisma.lead.deleteMany({
        where: {
          customerId: { in: testCustomerIds },
        },
      });
      results.leadsDeleted = deletedLeads.count;

      // Delete clicks
      const deletedClicks = await prisma.click.deleteMany({
        where: {
          customerId: { in: testCustomerIds },
        },
      });
      results.clicksDeleted = deletedClicks.count;

      // Delete identifiers
      await prisma.identifier.deleteMany({
        where: {
          customerId: { in: testCustomerIds },
        },
      });

      // Delete customers
      const deletedCustomers = await prisma.customer.deleteMany({
        where: {
          id: { in: testCustomerIds },
        },
      });
      results.customersDeleted = deletedCustomers.count;
    }

    // Also delete clicks with test clickIds (even if no customer)
    const deletedOrphanClicks = await prisma.click.deleteMany({
      where: {
        OR: testPatterns.map(pattern => ({
          clickId: { contains: pattern, mode: 'insensitive' },
        })),
      },
    });
    results.clicksDeleted += deletedOrphanClicks.count;

    // Delete leads with test emails
    const deletedOrphanLeads = await prisma.lead.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test', mode: 'insensitive' } },
          { email: { contains: 'example', mode: 'insensitive' } },
          { email: { contains: 'demo', mode: 'insensitive' } },
        ],
      },
    });
    results.leadsDeleted += deletedOrphanLeads.count;

    console.log('✅ [ADMIN] Test data cleanup complete:', results);

    return NextResponse.json({
      success: true,
      results,
      message: 'Test data cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [ADMIN] Cleanup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Clear Test Data',
    method: 'POST',
    description: 'Remove all test/fake data from database',
    note: 'Requires Authorization: Bearer {CRON_SECRET}',
  });
}
