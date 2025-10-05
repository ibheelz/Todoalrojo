import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import AcquisitionJourney from '@/lib/journeys/acquisition-journey';
import RetentionJourney from '@/lib/journeys/retention-journey';

/**
 * Start Journey API
 * Initiates acquisition or retention journeys for customers
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, operatorId, journeyType, operatorName } = body;

    if (!customerId || !operatorId || !journeyType) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, operatorId, journeyType' },
        { status: 400 }
      );
    }

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        identifiers: {
          where: {
            type: { in: ['EMAIL', 'PHONE'] },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerEmail = customer.masterEmail || customer.identifiers.find(i => i.type === 'EMAIL')?.value;
    const customerPhone = customer.masterPhone || customer.identifiers.find(i => i.type === 'PHONE')?.value;

    let result;

    switch (journeyType.toLowerCase()) {
      case 'acquisition':
        result = await AcquisitionJourney.start({
          customerId,
          operatorId,
          operatorName: operatorName || 'Casino',
          customerEmail,
          customerPhone,
        });
        break;

      case 'retention':
        // Get last deposit amount
        const lastDeposit = await prisma.event.findFirst({
          where: {
            customerId,
            eventType: { contains: 'DEPOSIT' },
            value: { not: null },
          },
          orderBy: { createdAt: 'desc' },
        });

        result = await RetentionJourney.start({
          customerId,
          operatorId,
          operatorName: operatorName || 'Casino',
          customerEmail,
          customerPhone,
          lastDepositAmount: lastDeposit?.value ? Number(lastDeposit.value) : undefined,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown journey type: ${journeyType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ Error starting journey:', error);
    return NextResponse.json(
      { error: 'Failed to start journey', details: error.message },
      { status: 500 }
    );
  }
}
