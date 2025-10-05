import { NextRequest, NextResponse } from 'next/server';
import JourneyService from '@/lib/journey-service';
import { prisma } from '@/lib/prisma';

/**
 * Journey State API
 * Get and manage customer journey states
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const operatorId = searchParams.get('operatorId');

    if (!customerId || !operatorId) {
      return NextResponse.json(
        { error: 'Missing required parameters: customerId, operatorId' },
        { status: 400 }
      );
    }

    const journeyState = await JourneyService.getOrCreateJourneyState({
      customerId,
      operatorId,
    });

    return NextResponse.json({ journeyState });
  } catch (error: any) {
    console.error('❌ Error fetching journey state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey state', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Update journey state or handle unsubscribe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, customerId, operatorId, ...params } = body;

    if (!customerId || !operatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, operatorId' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'unsubscribe':
        const { type } = params; // 'email', 'sms', or 'global'
        if (!type) {
          return NextResponse.json(
            { error: 'Missing unsubscribe type' },
            { status: 400 }
          );
        }
        await JourneyService.handleUnsubscribe(customerId, operatorId, type);
        result = { success: true, message: `Unsubscribed from ${type}` };
        break;

      case 'update_stage':
        const { stage, depositAmount } = params;
        if (stage === undefined) {
          return NextResponse.json(
            { error: 'Missing stage parameter' },
            { status: 400 }
          );
        }
        result = await JourneyService.updateStage({
          customerId,
          operatorId,
          stage: parseInt(stage),
          depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ Error updating journey state:', error);
    return NextResponse.json(
      { error: 'Failed to update journey state', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get journey statistics
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('operatorId') || undefined;

    const stats = await JourneyService.getJourneyStats(operatorId);

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('❌ Error fetching journey stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey stats', details: error.message },
      { status: 500 }
    );
  }
}
