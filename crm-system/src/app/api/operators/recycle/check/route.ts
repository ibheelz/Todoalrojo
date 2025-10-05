import { NextRequest, NextResponse } from 'next/server';
import OperatorService from '@/lib/operator-service';

/**
 * POST /api/operators/recycle/check - Check if a customer is eligible for recycling
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, currentOperatorId, targetOperatorId } = body;

    if (!customerId || !currentOperatorId || !targetOperatorId) {
      return NextResponse.json(
        { error: 'customerId, currentOperatorId, and targetOperatorId are required' },
        { status: 400 }
      );
    }

    const eligibility = await OperatorService.checkRecyclingEligibility({
      customerId,
      currentOperatorId,
      targetOperatorId,
    });

    return NextResponse.json({
      success: true,
      eligibility,
    });
  } catch (error: any) {
    console.error('Failed to check recycling eligibility:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
