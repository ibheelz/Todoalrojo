import { prisma } from './prisma';
import { JourneyType, MessageChannel, MessageStatus, MessageType, PostbackType } from '@prisma/client';

/**
 * Journey State Management Service
 * Handles user lifecycle stages, frequency caps, and journey progression
 */

export interface JourneyStateInput {
  customerId: string;
  operatorId: string;
}

export interface UpdateStageInput extends JourneyStateInput {
  stage: number;
  depositAmount?: number;
}

export interface MessageInput {
  journeyStateId: string;
  messageType: MessageType;
  channel: MessageChannel;
  journeyType: JourneyType;
  dayNumber: number;
  stepNumber: number;
  subject?: string;
  content: string;
  scheduledFor: Date;
}

export class JourneyService {
  /**
   * Get or create journey state for a customer-operator pair
   */
  static async getOrCreateJourneyState(input: JourneyStateInput) {
    const { customerId, operatorId } = input;

    let journeyState = await prisma.customerJourneyState.findUnique({
      where: {
        customerId_operatorId: {
          customerId,
          operatorId,
        },
      },
      include: {
        customer: true,
        journeyMessages: {
          orderBy: { scheduledFor: 'desc' },
          take: 10,
        },
      },
    });

    if (!journeyState) {
      // Create new journey state with stage -1 (not registered)
      journeyState = await prisma.customerJourneyState.create({
        data: {
          customerId,
          operatorId,
          stage: -1,
          currentJourney: 'acquisition',
          journeyStartedAt: new Date(),
        },
        include: {
          customer: true,
          journeyMessages: true,
        },
      });

      console.log(`✨ Created new journey state for customer ${customerId} with operator ${operatorId}`);
    }

    return journeyState;
  }

  /**
   * Update user lifecycle stage based on operator events
   */
  static async updateStage(input: UpdateStageInput) {
    const { customerId, operatorId, stage, depositAmount } = input;

    const journeyState = await this.getOrCreateJourneyState({ customerId, operatorId });

    // Calculate new stage and deposit count
    const newStage = Math.max(stage, journeyState.stage);
    const isDeposit = depositAmount && depositAmount > 0;
    const newDepositCount = isDeposit ? journeyState.depositCount + 1 : journeyState.depositCount;
    const newDepositValue = isDeposit
      ? Number(journeyState.totalDepositValue) + depositAmount
      : Number(journeyState.totalDepositValue);

    // Determine new journey type
    let newJourney = journeyState.currentJourney;
    let exitJourney = false;

    if (newStage >= 3) {
      // High value player - stop all journeys
      newJourney = 'stopped';
      exitJourney = true;
    } else if (newStage === 0) {
      // Registered, no deposit - acquisition journey
      newJourney = 'acquisition';
    } else if (newStage >= 1 && newStage <= 2) {
      // Has deposits - retention journey
      newJourney = 'retention';
    }

    const updated = await prisma.customerJourneyState.update({
      where: { id: journeyState.id },
      data: {
        stage: newStage,
        depositCount: newDepositCount,
        totalDepositValue: newDepositValue,
        lastDepositAt: isDeposit ? new Date() : journeyState.lastDepositAt,
        currentJourney: newJourney,
        journeyExitedAt: exitJourney ? new Date() : journeyState.journeyExitedAt,
      },
      include: {
        customer: true,
        journeyMessages: {
          where: { status: { in: ['PENDING', 'SCHEDULED'] } },
        },
      },
    });

    // Cancel pending messages if journey exited
    if (exitJourney && updated.journeyMessages.length > 0) {
      await prisma.journeyMessage.updateMany({
        where: {
          journeyStateId: updated.id,
          status: { in: ['PENDING', 'SCHEDULED'] },
        },
        data: {
          status: 'CANCELLED',
          errorMessage: `Journey stopped - user reached stage ${newStage}`,
        },
      });

      console.log(`🛑 Cancelled ${updated.journeyMessages.length} pending messages for journey ${updated.id}`);
    }

    console.log(`📊 Updated journey state: customer ${customerId}, stage ${journeyState.stage} → ${newStage}, journey: ${newJourney}`);

    return updated;
  }

  /**
   * Check if user can receive a message (frequency cap enforcement)
   */
  static async canSendMessage(
    journeyStateId: string,
    channel: MessageChannel
  ): Promise<{ allowed: boolean; reason?: string }> {
    const journeyState = await prisma.customerJourneyState.findUnique({
      where: { id: journeyStateId },
      include: {
        journeyMessages: {
          where: {
            channel,
            sentAt: { not: null },
          },
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!journeyState) {
      return { allowed: false, reason: 'Journey state not found' };
    }

    // Check global unsubscribe
    if (journeyState.unsubGlobal) {
      return { allowed: false, reason: 'User unsubscribed globally' };
    }

    // Check channel-specific unsubscribe
    if (channel === 'EMAIL' && journeyState.unsubEmail) {
      return { allowed: false, reason: 'User unsubscribed from emails' };
    }
    if (channel === 'SMS' && journeyState.unsubSms) {
      return { allowed: false, reason: 'User unsubscribed from SMS' };
    }

    // Check if journey is stopped
    if (journeyState.currentJourney === 'stopped') {
      return { allowed: false, reason: 'Journey stopped for high-value player' };
    }

    // Check max messages per day (1 message per day)
    const lastMessageAt = channel === 'EMAIL' ? journeyState.lastEmailAt : journeyState.lastSmsAt;
    if (lastMessageAt) {
      const hoursSinceLastMessage = (Date.now() - lastMessageAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastMessage < 24) {
        return { allowed: false, reason: `Max 1 message per day - last sent ${Math.round(hoursSinceLastMessage)}h ago` };
      }
    }

    // Check journey-specific caps
    if (journeyState.currentJourney === 'acquisition') {
      const maxEmails = 3;
      const maxSms = 2;

      if (channel === 'EMAIL' && journeyState.emailCount >= maxEmails) {
        return { allowed: false, reason: `Max ${maxEmails} emails per acquisition journey reached` };
      }
      if (channel === 'SMS' && journeyState.smsCount >= maxSms) {
        return { allowed: false, reason: `Max ${maxSms} SMS per acquisition journey reached` };
      }
    }

    return { allowed: true };
  }

  /**
   * Schedule a message in a journey
   */
  static async scheduleMessage(input: MessageInput) {
    const { journeyStateId, channel, scheduledFor, ...messageData } = input;

    // Check if message can be sent
    const canSend = await this.canSendMessage(journeyStateId, channel);
    if (!canSend.allowed) {
      console.log(`⛔ Cannot schedule message: ${canSend.reason}`);
      throw new Error(canSend.reason);
    }

    // Create scheduled message
    const message = await prisma.journeyMessage.create({
      data: {
        journeyStateId,
        channel,
        scheduledFor,
        status: 'SCHEDULED',
        ...messageData,
      },
    });

    console.log(`📅 Scheduled ${channel} message for journey ${journeyStateId} at ${scheduledFor}`);

    return message;
  }

  /**
   * Mark message as sent and update frequency counters
   */
  static async markMessageSent(
    messageId: string,
    providerId?: string,
    providerName?: string
  ) {
    const message = await prisma.journeyMessage.findUnique({
      where: { id: messageId },
      include: { journeyState: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Update message status
    await prisma.journeyMessage.update({
      where: { id: messageId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        providerId,
        providerName,
      },
    });

    // Update frequency counters
    const updateData: any = {};
    if (message.channel === 'EMAIL') {
      updateData.emailCount = { increment: 1 };
      updateData.lastEmailAt = new Date();
    } else if (message.channel === 'SMS') {
      updateData.smsCount = { increment: 1 };
      updateData.lastSmsAt = new Date();
    }

    await prisma.customerJourneyState.update({
      where: { id: message.journeyStateId },
      data: updateData,
    });

    console.log(`✅ Marked message ${messageId} as sent, updated counters for journey ${message.journeyStateId}`);

    return message;
  }

  /**
   * Get pending messages that need to be sent
   */
  static async getPendingMessages(limit: number = 100) {
    const now = new Date();

    const messages = await prisma.journeyMessage.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: now },
      },
      include: {
        journeyState: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
      take: limit,
    });

    console.log(`📬 Found ${messages.length} pending messages to send`);

    return messages;
  }

  /**
   * Handle unsubscribe request
   */
  static async handleUnsubscribe(
    customerId: string,
    operatorId: string,
    type: 'email' | 'sms' | 'global'
  ) {
    const journeyState = await this.getOrCreateJourneyState({ customerId, operatorId });

    const updateData: any = {};
    if (type === 'email') updateData.unsubEmail = true;
    if (type === 'sms') updateData.unsubSms = true;
    if (type === 'global') updateData.unsubGlobal = true;

    await prisma.customerJourneyState.update({
      where: { id: journeyState.id },
      data: updateData,
    });

    // Cancel all pending messages
    await prisma.journeyMessage.updateMany({
      where: {
        journeyStateId: journeyState.id,
        status: { in: ['PENDING', 'SCHEDULED'] },
      },
      data: {
        status: 'CANCELLED',
        errorMessage: `User unsubscribed from ${type}`,
      },
    });

    console.log(`🚫 Unsubscribed customer ${customerId} from ${type} for operator ${operatorId}`);
  }

  /**
   * Get journey statistics
   */
  static async getJourneyStats(operatorId?: string) {
    const where = operatorId ? { operatorId } : {};

    const [
      totalJourneys,
      activeJourneys,
      stageDistribution,
      messageStats,
    ] = await Promise.all([
      prisma.customerJourneyState.count({ where }),
      prisma.customerJourneyState.count({
        where: { ...where, currentJourney: { not: 'stopped' } },
      }),
      prisma.customerJourneyState.groupBy({
        by: ['stage'],
        where,
        _count: true,
      }),
      prisma.journeyMessage.groupBy({
        by: ['status', 'channel'],
        _count: true,
      }),
    ]);

    return {
      totalJourneys,
      activeJourneys,
      stageDistribution: stageDistribution.map((s) => ({
        stage: s.stage,
        count: s._count,
      })),
      messageStats: messageStats.map((s) => ({
        status: s.status,
        channel: s.channel,
        count: s._count,
      })),
    };
  }
}

export default JourneyService;
