import { NextRequest, NextResponse } from 'next/server';
import MessageProcessor from '@/lib/messaging/message-processor';

/**
 * Process Messages API
 * Manually trigger processing of pending journey messages
 */

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log(`🔄 Manually triggered message processing (limit: ${limit})`);

    const result = await MessageProcessor.processPendingMessages(limit);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('❌ Error processing messages:', error);
    return NextResponse.json(
      { error: 'Failed to process messages', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get processing status
 */
export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');

    const [pending, sent, failed] = await Promise.all([
      prisma.journeyMessage.count({
        where: { status: 'SCHEDULED', scheduledFor: { lte: new Date() } },
      }),
      prisma.journeyMessage.count({
        where: { status: 'SENT' },
      }),
      prisma.journeyMessage.count({
        where: { status: 'FAILED' },
      }),
    ]);

    return NextResponse.json({
      pending,
      sent,
      failed,
      total: pending + sent + failed,
    });
  } catch (error: any) {
    console.error('❌ Error fetching message status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status', details: error.message },
      { status: 500 }
    );
  }
}
