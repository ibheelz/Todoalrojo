import { NextRequest, NextResponse } from 'next/server';
import OperatorService from '@/lib/operator-service';

/**
 * GET /api/operators - List all operators or get operators for a client
 * POST /api/operators - Create a new operator
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      const operators = await OperatorService.getClientOperators(clientId);
      return NextResponse.json({ operators });
    }

    // Get all operators (admin only - add auth check here)
    const operators = await OperatorService.getAllOperators();
    return NextResponse.json({ operators });
  } catch (error: any) {
    console.error('Failed to fetch operators:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      name,
      slug,
      brand,
      emailDomain,
      emailFromName,
      emailFromAddress,
      logoUrl,
      primaryColor,
      smsEnabled,
      smsSender,
      smsProvider,
      protectHighValue,
      recycleAfterDays,
      minStageForRecycle,
      maxStageForRecycle,
    } = body;

    if (!clientId || !name || !slug) {
      return NextResponse.json(
        { error: 'clientId, name, and slug are required' },
        { status: 400 }
      );
    }

    const operator = await OperatorService.createOperator({
      clientId,
      name,
      slug,
      brand,
      emailDomain,
      emailFromName,
      emailFromAddress,
      logoUrl,
      primaryColor,
      smsEnabled,
      smsSender,
      smsProvider: smsProvider || 'laaffic',
      protectHighValue,
      recycleAfterDays,
      minStageForRecycle,
      maxStageForRecycle,
    });

    return NextResponse.json({
      success: true,
      operator,
    });
  } catch (error: any) {
    console.error('Failed to create operator:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
