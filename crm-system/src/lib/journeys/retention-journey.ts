import JourneyService from '../journey-service';
import { JourneyType, MessageChannel, MessageType } from '@prisma/client';

/**
 * Retention Journey - Stages 1-2
 * Goal: Encourage redeposits within first 5 days after deposit
 * Flow: 2-3 touches per deposit cycle
 */

export interface StartRetentionJourneyInput {
  customerId: string;
  operatorId: string;
  operatorName: string;
  customerEmail?: string;
  customerPhone?: string;
  lastDepositAmount?: number;
}

export class RetentionJourney {
  /**
   * Start retention journey after a deposit
   * Schedules messages to encourage redeposit
   */
  static async start(input: StartRetentionJourneyInput) {
    const { customerId, operatorId, operatorName, customerEmail, customerPhone, lastDepositAmount } = input;

    console.log(`🔁 Starting retention journey for customer ${customerId} with operator ${operatorId}`);

    // Get or create journey state
    const journeyState = await JourneyService.getOrCreateJourneyState({
      customerId,
      operatorId,
    });

    // Only start if user is in stage 1-2 (has deposited but not high value yet)
    if (journeyState.stage < 1 || journeyState.stage >= 3) {
      console.log(`⚠️ Customer ${customerId} is at stage ${journeyState.stage}, not eligible for retention journey`);
      return { success: false, reason: 'Customer not in retention stage' };
    }

    const now = new Date();
    const messages = [];

    // D+1: Email 1 (Bonus Continuation / Reload Message)
    if (customerEmail) {
      try {
        const email1 = await JourneyService.scheduleMessage({
          journeyStateId: journeyState.id,
          messageType: MessageType.RELOAD,
          channel: MessageChannel.EMAIL,
          journeyType: JourneyType.RETENTION,
          dayNumber: 1,
          stepNumber: 1,
          subject: `Your ${operatorName} reload bonus is ready! 🎁`,
          content: this.getEmailContent(1, operatorName, lastDepositAmount),
          scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000), // +1 day
        });
        messages.push(email1);
      } catch (error: any) {
        console.log(`⚠️ Could not schedule Email 1: ${error.message}`);
      }
    }

    // D+2: SMS 1 (Short Urgency Push to Redeposit)
    if (customerPhone) {
      try {
        const sms1 = await JourneyService.scheduleMessage({
          journeyStateId: journeyState.id,
          messageType: MessageType.BONUS_REMINDER,
          channel: MessageChannel.SMS,
          journeyType: JourneyType.RETENTION,
          dayNumber: 2,
          stepNumber: 1,
          content: this.getSMSContent(1, operatorName),
          scheduledFor: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days
        });
        messages.push(sms1);
      } catch (error: any) {
        console.log(`⚠️ Could not schedule SMS 1: ${error.message}`);
      }
    }

    // D+5: Email 2 (Heavier Bonus or VIP Angle)
    if (customerEmail) {
      try {
        const email2 = await JourneyService.scheduleMessage({
          journeyStateId: journeyState.id,
          messageType: MessageType.VIP_OFFER,
          channel: MessageChannel.EMAIL,
          journeyType: JourneyType.RETENTION,
          dayNumber: 5,
          stepNumber: 2,
          subject: `Exclusive VIP offer just for you at ${operatorName}`,
          content: this.getEmailContent(2, operatorName, lastDepositAmount),
          scheduledFor: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 days
        });
        messages.push(email2);
      } catch (error: any) {
        console.log(`⚠️ Could not schedule Email 2: ${error.message}`);
      }
    }

    console.log(`✅ Scheduled ${messages.length} messages for retention journey`);

    return {
      success: true,
      journeyState,
      messagesScheduled: messages.length,
      messages,
    };
  }

  /**
   * Email content templates
   */
  private static getEmailContent(emailNumber: number, operatorName: string, lastDepositAmount?: number): string {
    const bonusAmount = lastDepositAmount ? Math.min(lastDepositAmount * 0.5, 250) : 100;

    switch (emailNumber) {
      case 1:
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reload Bonus - ${operatorName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #4CAF50;">Thanks for playing at ${operatorName}! 🎉</h1>

    <p>We noticed you recently made a deposit. We want to keep the excitement going!</p>

    <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h2 style="margin-top: 0; color: #2e7d32;">Your Exclusive Reload Bonus:</h2>
      <ul style="font-size: 18px;">
        <li>50% Match up to $${bonusAmount.toFixed(0)}</li>
        <li>25 Free Spins on popular slots</li>
        <li>Instant activation</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://${operatorName}.com/deposit?bonus=reload"
         style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Claim Your Reload Bonus
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">Bonus valid for 48 hours. Terms apply.</p>
  </div>
</body>
</html>
        `;

      case 2:
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VIP Exclusive - ${operatorName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #9C27B0;">You're Invited to Our VIP Program! 👑</h1>

    <p>As a valued player, we'd like to offer you exclusive VIP benefits:</p>

    <div style="background-color: #f3e5f5; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px solid #9C27B0;">
      <h2 style="margin-top: 0; color: #6A1B9A;">VIP Perks Include:</h2>
      <ul style="font-size: 16px;">
        <li>🎁 Higher reload bonuses (up to 100%)</li>
        <li>💎 Exclusive games and tournaments</li>
        <li>🚀 Priority withdrawals (24h max)</li>
        <li>🎯 Personal account manager</li>
        <li>🎂 Birthday bonuses</li>
        <li>📈 Cashback on all bets</li>
      </ul>
    </div>

    <p><strong>To activate your VIP status, make a deposit of $${(lastDepositAmount || 50) * 2} or more:</strong></p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://${operatorName}.com/vip"
         style="background-color: #9C27B0; color: white; padding: 20px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">
        Join VIP Now
      </a>
    </div>

    <p style="text-align: center; color: #666; font-size: 12px;">
      <a href="{{unsubscribe_url}}">Unsubscribe from these emails</a>
    </p>
  </div>
</body>
</html>
        `;

      default:
        return `Keep playing at ${operatorName}!`;
    }
  }

  /**
   * SMS content templates (160 characters max recommended)
   */
  private static getSMSContent(smsNumber: number, operatorName: string): string {
    switch (smsNumber) {
      case 1:
        return `💰 ${operatorName}: Your 50% reload bonus is ready! Deposit now and get up to $250 extra: ${operatorName}.com/reload Reply STOP to opt out`;

      default:
        return `${operatorName}: Special reload bonus available. Deposit now: ${operatorName}.com`;
    }
  }
}

export default RetentionJourney;
