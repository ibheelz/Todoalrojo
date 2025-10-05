import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get all journey messages with customer details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status'); // PENDING, SENT, FAILED
    const channel = searchParams.get('channel'); // EMAIL, SMS
    const journeyType = searchParams.get('journeyType'); // ACQUISITION, RETENTION

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (channel) {
      where.channel = channel;
    }

    if (journeyType) {
      where.journeyType = journeyType;
    }

    const messages = await prisma.journeyMessage.findMany({
      where,
      take: limit,
      orderBy: [
        { status: 'asc' }, // PENDING first
        { scheduledFor: 'asc' }, // Then by scheduled time
      ],
      include: {
        journeyState: {
          include: {
            customer: {
              select: {
                id: true,
                masterEmail: true,
                masterPhone: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error: any) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
