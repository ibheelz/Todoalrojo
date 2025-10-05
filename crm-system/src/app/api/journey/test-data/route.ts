import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import AcquisitionJourney from '@/lib/journeys/acquisition-journey';
import RetentionJourney from '@/lib/journeys/retention-journey';
import JourneyService from '@/lib/journey-service';

/**
 * Generate test data for journey automation testing
 * Creates customers at different stages with scheduled messages
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'full';

    const timestamp = Date.now();
    const results = {
      customers: [],
      journeys: [],
      messages: [],
    };

    switch (action) {
      case 'full':
        // Create comprehensive test dataset
        results.customers = await createFullTestData(timestamp);
        break;

      case 'acquisition':
        // Create only acquisition journey test data
        results.customers = await createAcquisitionTestData(timestamp);
        break;

      case 'retention':
        // Create only retention journey test data
        results.customers = await createRetentionTestData(timestamp);
        break;

      case 'clean':
        // Clean up test data
        const deleted = await cleanupTestData();
        return NextResponse.json({
          success: true,
          message: 'Test data cleaned',
          deleted,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: full, acquisition, retention, clean' },
          { status: 400 }
        );
    }

    // Get statistics
    const stats = await JourneyService.getJourneyStats();

    return NextResponse.json({
      success: true,
      message: 'Test data generated successfully',
      results,
      stats,
    });
  } catch (error: any) {
    console.error('Test data generation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function createFullTestData(timestamp: number) {
  const customers = [];

  // 1. Stage -1: Not Registered (3 users)
  for (let i = 0; i < 3; i++) {
    const customer = await prisma.customer.create({
      data: {
        masterEmail: `test.lead.${timestamp}.${i}@example.com`,
        masterPhone: `+1555000${timestamp.toString().slice(-4)}${i}`,
        firstName: `Lead`,
        lastName: `User ${i + 1}`,
        identifiers: {
          create: [
            {
              type: 'EMAIL',
              value: `test.lead.${timestamp}.${i}@example.com`,
            },
            {
              type: 'PHONE',
              value: `+1555000${timestamp.toString().slice(-4)}${i}`,
            },
            {
              type: 'CLICK_ID',
              value: `test-click-${timestamp}-${i}`,
            },
          ],
        },
      },
    });

    // Start acquisition journey
    await AcquisitionJourney.start({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      operatorName: 'Test Casino',
      customerEmail: customer.masterEmail!,
      customerPhone: customer.masterPhone!,
    });

    customers.push(customer);
  }

  // 2. Stage 0: Registered, No Deposit (3 users)
  for (let i = 0; i < 3; i++) {
    const customer = await prisma.customer.create({
      data: {
        masterEmail: `test.registered.${timestamp}.${i}@example.com`,
        masterPhone: `+1555001${timestamp.toString().slice(-4)}${i}`,
        firstName: `Registered`,
        lastName: `User ${i + 1}`,
        identifiers: {
          create: [
            {
              type: 'EMAIL',
              value: `test.registered.${timestamp}.${i}@example.com`,
            },
            {
              type: 'PHONE',
              value: `+1555001${timestamp.toString().slice(-4)}${i}`,
            },
          ],
        },
      },
    });

    // Update to stage 0
    await JourneyService.updateStage({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      stage: 0,
    });

    // Start acquisition journey
    await AcquisitionJourney.start({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      operatorName: 'Test Casino',
      customerEmail: customer.masterEmail!,
      customerPhone: customer.masterPhone!,
    });

    customers.push(customer);
  }

  // 3. Stage 1: First Deposit (3 users)
  for (let i = 0; i < 3; i++) {
    const customer = await prisma.customer.create({
      data: {
        masterEmail: `test.deposit1.${timestamp}.${i}@example.com`,
        masterPhone: `+1555002${timestamp.toString().slice(-4)}${i}`,
        firstName: `Depositor`,
        lastName: `User ${i + 1}`,
        identifiers: {
          create: [
            {
              type: 'EMAIL',
              value: `test.deposit1.${timestamp}.${i}@example.com`,
            },
            {
              type: 'PHONE',
              value: `+1555002${timestamp.toString().slice(-4)}${i}`,
            },
          ],
        },
      },
    });

    // Update to stage 1
    await JourneyService.updateStage({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      stage: 1,
      depositAmount: 50 + (i * 10),
    });

    // Start retention journey
    await RetentionJourney.start({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      operatorName: 'Test Casino',
      customerEmail: customer.masterEmail!,
      customerPhone: customer.masterPhone!,
      lastDepositAmount: 50 + (i * 10),
    });

    customers.push(customer);
  }

  // 4. Stage 2: Second Deposit (2 users)
  for (let i = 0; i < 2; i++) {
    const customer = await prisma.customer.create({
      data: {
        masterEmail: `test.deposit2.${timestamp}.${i}@example.com`,
        masterPhone: `+1555003${timestamp.toString().slice(-4)}${i}`,
        firstName: `Repeat`,
        lastName: `User ${i + 1}`,
        identifiers: {
          create: [
            {
              type: 'EMAIL',
              value: `test.deposit2.${timestamp}.${i}@example.com`,
            },
            {
              type: 'PHONE',
              value: `+1555003${timestamp.toString().slice(-4)}${i}`,
            },
          ],
        },
      },
    });

    // Update to stage 2
    await JourneyService.updateStage({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      stage: 2,
      depositAmount: 100 + (i * 20),
    });

    // Start retention journey
    await RetentionJourney.start({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      operatorName: 'Test Casino',
      customerEmail: customer.masterEmail!,
      customerPhone: customer.masterPhone!,
      lastDepositAmount: 100 + (i * 20),
    });

    customers.push(customer);
  }

  // 5. Stage 3+: High Value (2 users) - No journeys
  for (let i = 0; i < 2; i++) {
    const customer = await prisma.customer.create({
      data: {
        masterEmail: `test.vip.${timestamp}.${i}@example.com`,
        masterPhone: `+1555004${timestamp.toString().slice(-4)}${i}`,
        firstName: `VIP`,
        lastName: `User ${i + 1}`,
        identifiers: {
          create: [
            {
              type: 'EMAIL',
              value: `test.vip.${timestamp}.${i}@example.com`,
            },
            {
              type: 'PHONE',
              value: `+1555004${timestamp.toString().slice(-4)}${i}`,
            },
          ],
        },
      },
    });

    // Update to stage 3 (stopped)
    await JourneyService.updateStage({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      stage: 3,
      depositAmount: 500 + (i * 100),
    });

    customers.push(customer);
  }

  // 6. Create some with unsubscribes
  const unsubCustomer = await prisma.customer.create({
    data: {
      masterEmail: `test.unsub.${timestamp}@example.com`,
      masterPhone: `+1555005${timestamp.toString().slice(-4)}`,
      firstName: `Unsubscribed`,
      lastName: `User`,
      identifiers: {
        create: [
          {
            type: 'EMAIL',
            value: `test.unsub.${timestamp}@example.com`,
          },
        ],
      },
    },
  });

  await JourneyService.handleUnsubscribe(
    unsubCustomer.id,
    'test-operator-1',
    'email'
  );

  customers.push(unsubCustomer);

  return customers;
}

async function createAcquisitionTestData(timestamp: number) {
  const customers = [];

  for (let i = 0; i < 5; i++) {
    const customer = await prisma.customer.create({
      data: {
        masterEmail: `test.acquisition.${timestamp}.${i}@example.com`,
        masterPhone: `+1555010${timestamp.toString().slice(-4)}${i}`,
        firstName: `Acquisition`,
        lastName: `Test ${i + 1}`,
        identifiers: {
          create: [
            {
              type: 'EMAIL',
              value: `test.acquisition.${timestamp}.${i}@example.com`,
            },
            {
              type: 'PHONE',
              value: `+1555010${timestamp.toString().slice(-4)}${i}`,
            },
          ],
        },
      },
    });

    await AcquisitionJourney.start({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      operatorName: 'Test Casino',
      customerEmail: customer.masterEmail!,
      customerPhone: customer.masterPhone!,
    });

    customers.push(customer);
  }

  return customers;
}

async function createRetentionTestData(timestamp: number) {
  const customers = [];

  for (let i = 0; i < 5; i++) {
    const customer = await prisma.customer.create({
      data: {
        masterEmail: `test.retention.${timestamp}.${i}@example.com`,
        masterPhone: `+1555020${timestamp.toString().slice(-4)}${i}`,
        firstName: `Retention`,
        lastName: `Test ${i + 1}`,
        identifiers: {
          create: [
            {
              type: 'EMAIL',
              value: `test.retention.${timestamp}.${i}@example.com`,
            },
            {
              type: 'PHONE',
              value: `+1555020${timestamp.toString().slice(-4)}${i}`,
            },
          ],
        },
      },
    });

    await JourneyService.updateStage({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      stage: 1,
      depositAmount: 100,
    });

    await RetentionJourney.start({
      customerId: customer.id,
      operatorId: 'test-operator-1',
      operatorName: 'Test Casino',
      customerEmail: customer.masterEmail!,
      customerPhone: customer.masterPhone!,
      lastDepositAmount: 100,
    });

    customers.push(customer);
  }

  return customers;
}

async function cleanupTestData() {
  // Delete test journey messages
  const messagesDeleted = await prisma.journeyMessage.deleteMany({
    where: {
      journeyState: {
        operatorId: 'test-operator-1',
      },
    },
  });

  // Delete test journey states
  const statesDeleted = await prisma.customerJourneyState.deleteMany({
    where: {
      operatorId: 'test-operator-1',
    },
  });

  // Delete test customer identifiers
  const identifiersDeleted = await prisma.identifier.deleteMany({
    where: {
      OR: [
        { value: { contains: 'test.' } },
        { value: { contains: 'test-click-' } },
      ],
    },
  });

  // Delete test customers
  const customersDeleted = await prisma.customer.deleteMany({
    where: {
      OR: [
        { masterEmail: { contains: 'test.' } },
        { firstName: { in: ['Lead', 'Registered', 'Depositor', 'Repeat', 'VIP', 'Unsubscribed', 'Acquisition', 'Retention'] } },
      ],
    },
  });

  return {
    messages: messagesDeleted.count,
    states: statesDeleted.count,
    identifiers: identifiersDeleted.count,
    customers: customersDeleted.count,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'stats') {
    const stats = await JourneyService.getJourneyStats();
    return NextResponse.json({ stats });
  }

  return NextResponse.json({
    message: 'Journey Test Data API',
    endpoints: {
      'POST ?action=full': 'Generate comprehensive test data (all stages)',
      'POST ?action=acquisition': 'Generate acquisition journey test data',
      'POST ?action=retention': 'Generate retention journey test data',
      'POST ?action=clean': 'Clean up all test data',
      'GET ?action=stats': 'Get current statistics',
    },
  });
}
