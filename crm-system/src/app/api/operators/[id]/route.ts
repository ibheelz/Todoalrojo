import { NextRequest, NextResponse } from 'next/server';
import OperatorService from '@/lib/operator-service';
import { OperatorStatus } from '@prisma/client';

/**
 * GET /api/operators/[id] - Get operator details
 * PATCH /api/operators/[id] - Update operator
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const operator = await OperatorService.getOperator(params.id);

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ operator });
  } catch (error: any) {
    console.error('Failed to fetch operator:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (status) {
      const operator = await OperatorService.updateOperatorStatus(
        params.id,
        status as OperatorStatus
      );

      return NextResponse.json({
        success: true,
        operator,
      });
    }

    return NextResponse.json(
      { error: 'No updates provided' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Failed to update operator:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
