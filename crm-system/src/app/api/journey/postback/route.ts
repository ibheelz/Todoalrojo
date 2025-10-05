import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import JourneyService from '@/lib/journey-service';
import { PostbackType } from '@prisma/client';

/**
 * Operator Postback Handler
 * Receives registration and deposit events from operators and updates journey states
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      operatorId,
      eventType, // 'registration', 'first_deposit', 'deposit', 'withdrawal'
      clickId,
      email,
      phone,
      userId, // Operator's user ID
      depositAmount,
      currency = 'USD',
    } = body;

    console.log(`📥 Received postback: ${eventType} from operator ${operatorId}`, {
      clickId,
      email,
      phone,
      depositAmount,
    });

    // Validate required fields
    if (!operatorId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: operatorId, eventType' },
        { status: 400 }
      );
    }

    // Resolve customer from identifiers
    let customerId: string | null = null;

    // Try to find customer by clickId, email, or phone
    if (clickId) {
      const identifier = await prisma.identifier.findUnique({
        where: { type_value: { type: 'CLICK_ID', value: clickId } },
      });
      if (identifier) customerId = identifier.customerId;
    }

    if (!customerId && email) {
      const identifier = await prisma.identifier.findUnique({
        where: { type_value: { type: 'EMAIL', value: email.toLowerCase() } },
      });
      if (identifier) customerId = identifier.customerId;
    }

    if (!customerId && phone) {
      const identifier = await prisma.identifier.findUnique({
        where: { type_value: { type: 'PHONE', value: phone } },
      });
      if (identifier) customerId = identifier.customerId;
    }

    // If customer not found, create a new one
    if (!customerId) {
      const customer = await prisma.customer.create({
        data: {
          masterEmail: email?.toLowerCase(),
          masterPhone: phone,
          identifiers: {
            create: [
              email && {
                type: 'EMAIL',
                value: email.toLowerCase(),
                isVerified: false,
              },
              phone && {
                type: 'PHONE',
                value: phone,
                isVerified: false,
              },
              clickId && {
                type: 'CLICK_ID',
                value: clickId,
              },
            ].filter(Boolean),
          },
        },
      });
      customerId = customer.id;
      console.log(`👤 Created new customer ${customerId} from postback`);
    }

    // Store the postback
    const postback = await prisma.operatorPostback.create({
      data: {
        customerId,
        operatorId,
        eventType: eventType.toUpperCase() as PostbackType,
        clickId,
        email: email?.toLowerCase(),
        phone,
        userId,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        currency,
        rawPayload: body,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        processedAt: new Date(),
      },
    });

    // Update journey state based on event type
    let newStage = -1;
    const amount = depositAmount ? parseFloat(depositAmount) : 0;

    switch (eventType.toLowerCase()) {
      case 'registration':
        newStage = 0; // Registered, no deposit
        break;
      case 'first_deposit':
      case 'deposit':
        // Get current journey state to determine stage
        const currentState = await JourneyService.getOrCreateJourneyState({
          customerId,
          operatorId,
        });

        if (currentState.depositCount === 0) {
          newStage = 1; // First deposit
        } else if (currentState.depositCount === 1) {
          newStage = 2; // Second deposit
        } else {
          newStage = 3; // 3+ deposits (high value)
        }
        break;
      default:
        console.log(`ℹ️ Event type ${eventType} does not affect journey stage`);
    }

    // Update the journey state
    let journeyState = null;
    if (newStage >= 0) {
      journeyState = await JourneyService.updateStage({
        customerId,
        operatorId,
        stage: newStage,
        depositAmount: amount,
      });
    }

    // Track as event
    await prisma.event.create({
      data: {
        customerId,
        eventType: eventType.toUpperCase(),
        eventName: `Operator ${eventType}`,
        category: 'operator_postback',
        properties: {
          operatorId,
          userId,
          postbackId: postback.id,
        },
        value: amount > 0 ? amount : null,
        currency,
        clientId: operatorId,
        isRevenue: amount > 0,
        isConverted: eventType.toLowerCase().includes('deposit'),
      },
    });

    console.log(`✅ Postback processed successfully`, {
      postbackId: postback.id,
      customerId,
      newStage: journeyState?.stage,
      journey: journeyState?.currentJourney,
    });

    return NextResponse.json({
      success: true,
      postbackId: postback.id,
      customerId,
      journeyState: journeyState
        ? {
            stage: journeyState.stage,
            journey: journeyState.currentJourney,
            depositCount: journeyState.depositCount,
          }
        : null,
    });
  } catch (error: any) {
    console.error('❌ Postback processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process postback', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get postback history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('operatorId');
    const customerId = searchParams.get('customerId');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (operatorId) where.operatorId = operatorId;
    if (customerId) where.customerId = customerId;
    if (eventType) where.eventType = eventType.toUpperCase();

    const postbacks = await prisma.operatorPostback.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            masterPhone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const total = await prisma.operatorPostback.count({ where });

    return NextResponse.json({
      postbacks,
      total,
      limit,
    });
  } catch (error: any) {
    console.error('❌ Error fetching postbacks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch postbacks', details: error.message },
      { status: 500 }
    );
  }
}
