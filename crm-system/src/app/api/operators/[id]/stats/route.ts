import { NextRequest, NextResponse } from 'next/server';
import OperatorService from '@/lib/operator-service';

/**
 * GET /api/operators/[id]/stats - Get operator performance stats
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const stats = await OperatorService.getOperatorStats(params.id, days);

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Failed to fetch operator stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
