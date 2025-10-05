import { NextRequest, NextResponse } from 'next/server';
import OperatorService from '@/lib/operator-service';

/**
 * POST /api/operators/recycle - Recycle a customer to a new operator
 * GET /api/operators/recycle - Find eligible customers for recycling
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, fromOperatorId, toOperatorId } = body;

    if (!customerId || !fromOperatorId || !toOperatorId) {
      return NextResponse.json(
        { error: 'customerId, fromOperatorId, and toOperatorId are required' },
        { status: 400 }
      );
    }

    const result = await OperatorService.recycleCustomer(
      customerId,
      fromOperatorId,
      toOperatorId
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Failed to recycle customer:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceOperatorId = searchParams.get('sourceOperatorId');
    const targetOperatorId = searchParams.get('targetOperatorId');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!sourceOperatorId || !targetOperatorId) {
      return NextResponse.json(
        { error: 'sourceOperatorId and targetOperatorId are required' },
        { status: 400 }
      );
    }

    const eligibleCustomers = await OperatorService.findEligibleCustomersForRecycling(
      sourceOperatorId,
      targetOperatorId,
      limit
    );

    return NextResponse.json({
      success: true,
      count: eligibleCustomers.length,
      customers: eligibleCustomers,
    });
  } catch (error: any) {
    console.error('Failed to find eligible customers:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
