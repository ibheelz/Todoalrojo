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
                createdAt: true,
                firstSeen: true,
                source: true,
                country: true,
                city: true,
              },
            },
          },
        },
      },
    });

    // Enrich messages with additional customer details
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const customerId = message.journeyState.customerId;
        const operatorId = message.journeyState.operatorId;

        // Get the most recent click/lead/event for this customer
        const [recentClick, recentLead, recentEvent] = await Promise.all([
          prisma.click.findFirst({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            select: {
              campaign: true,
              source: true,
              medium: true,
              landingPage: true,
              clickId: true,
              createdAt: true,
            },
          }),
          prisma.lead.findFirst({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            select: {
              campaign: true,
              source: true,
              medium: true,
              clickId: true,
              createdAt: true,
            },
          }),
          prisma.event.findFirst({
            where: {
              customerId,
              eventType: { in: ['registration', 'signup', 'register'] }
            },
            orderBy: { createdAt: 'desc' },
            select: {
              campaign: true,
              eventType: true,
              createdAt: true,
            },
          }),
        ]);

        // Get influencer info if there's a campaign
        const campaign = recentClick?.campaign || recentLead?.campaign;
        let influencerInfo = null;

        if (campaign) {
          const campaignData = await prisma.campaign.findFirst({
            where: { slug: campaign },
            select: {
              name: true,
              brandId: true,
              campaignInfluencers: {
                include: {
                  influencer: {
                    select: {
                      id: true,
                      name: true,
                      platform: true,
                    },
                  },
                },
              },
            },
          });

          if (campaignData?.campaignInfluencers.length > 0) {
            influencerInfo = campaignData.campaignInfluencers[0].influencer;
          }
        }

        // Get operator/brand info
        let operatorInfo = null;
        try {
          const operator = await prisma.operator.findUnique({
            where: { id: operatorId },
            select: {
              name: true,
              brand: true,
              slug: true,
            },
          });
          operatorInfo = operator;
        } catch (error) {
          // Operator might not exist yet
        }

        return {
          ...message,
          customerDetails: {
            registrationDate: recentEvent?.createdAt || message.journeyState.customer.createdAt,
            firstSeen: message.journeyState.customer.firstSeen,
            source: recentClick?.source || recentLead?.source || message.journeyState.customer.source,
            medium: recentClick?.medium || recentLead?.medium,
            campaign: campaign,
            clickId: recentClick?.clickId || recentLead?.clickId,
            landingPage: recentClick?.landingPage,
            country: message.journeyState.customer.country,
            city: message.journeyState.customer.city,
            influencer: influencerInfo,
            operator: operatorInfo,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: enrichedMessages.length,
      messages: enrichedMessages,
    });
  } catch (error: any) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
