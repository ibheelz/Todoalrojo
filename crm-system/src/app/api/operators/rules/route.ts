import { NextRequest, NextResponse } from 'next/server';
import OperatorService from '@/lib/operator-service';

/**
 * POST /api/operators/rules - Create a recycling rule between operators
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sourceOperatorId,
      targetOperatorId,
      minDaysSinceLastDeposit,
      maxStage,
      minStage,
      excludeHighValue,
      maxRecyclesPerUser,
      cooldownDays,
      priority,
    } = body;

    if (!sourceOperatorId || !targetOperatorId) {
      return NextResponse.json(
        { error: 'sourceOperatorId and targetOperatorId are required' },
        { status: 400 }
      );
    }

    const rule = await OperatorService.createRecyclingRule(
      sourceOperatorId,
      targetOperatorId,
      {
        minDaysSinceLastDeposit,
        maxStage,
        minStage,
        excludeHighValue,
        maxRecyclesPerUser,
        cooldownDays,
        priority,
      }
    );

    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error: any) {
    console.error('Failed to create recycling rule:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
