import { prisma } from '../prisma';
import JourneyService from '../journey-service';
import { JourneyType, MessageChannel, MessageType } from '@prisma/client';

/**
 * Acquisition Journey - Stages -1 and 0
 * Goal: Convert user into first-time depositor
 * Flow: 3 emails + 2 SMS over 7 days
 */

export interface StartAcquisitionJourneyInput {
  customerId: string;
  operatorId: string;
  operatorName: string;
  customerEmail?: string;
  customerPhone?: string;
}

export class AcquisitionJourney {
  /**
   * Start acquisition journey for a customer
   * Schedules all messages according to the timeline
   */
  static async start(input: StartAcquisitionJourneyInput) {
    const { customerId, operatorId, operatorName, customerEmail, customerPhone } = input;

    console.log(`🚀 Starting acquisition journey for customer ${customerId} with operator ${operatorId}`);

    // Get or create journey state
    const journeyState = await JourneyService.getOrCreateJourneyState({
      customerId,
      operatorId,
    });

    // Only start if user is in stage -1 or 0
    if (journeyState.stage > 0) {
      console.log(`⚠️ Customer ${customerId} is at stage ${journeyState.stage}, skipping acquisition journey`);
      return { success: false, reason: 'Customer past acquisition stage' };
    }

    // Check if journey already has messages scheduled
    const existingMessages = await prisma.journeyMessage.count({
      where: {
        journeyStateId: journeyState.id,
        journeyType: 'ACQUISITION',
        status: { in: ['PENDING', 'SCHEDULED'] },
      },
    });

    if (existingMessages > 0) {
      console.log(`⚠️ Acquisition journey already has ${existingMessages} scheduled messages for customer ${customerId}`);
      return { success: false, reason: 'Journey already has scheduled messages' };
    }

    const now = new Date();
    const messages = [];

    // Day 0: Email 1 (Welcome/Offer Push)
    if (customerEmail) {
      try {
        const email1 = await JourneyService.scheduleMessage({
          journeyStateId: journeyState.id,
          messageType: MessageType.WELCOME,
          channel: MessageChannel.EMAIL,
          journeyType: JourneyType.ACQUISITION,
          dayNumber: 0,
          stepNumber: 1,
          subject: `Welcome to ${operatorName}! Exclusive Bonus Inside 🎁`,
          content: this.getEmailContent(1, operatorName),
          scheduledFor: now, // Send immediately
        });
        messages.push(email1);
      } catch (error: any) {
        console.log(`⚠️ Could not schedule Email 1: ${error.message}`);
      }
    }

    // Day 1: SMS 1 (Urgent Bonus Reminder)
    if (customerPhone) {
      try {
        const sms1 = await JourneyService.scheduleMessage({
          journeyStateId: journeyState.id,
          messageType: MessageType.BONUS_REMINDER,
          channel: MessageChannel.SMS,
          journeyType: JourneyType.ACQUISITION,
          dayNumber: 1,
          stepNumber: 1,
          content: this.getSMSContent(1, operatorName),
          scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000), // +1 day
        });
        messages.push(sms1);
      } catch (error: any) {
        console.log(`⚠️ Could not schedule SMS 1: ${error.message}`);
      }
    }

    // Day 3: Email 2 (Social Proof / Benefits)
    if (customerEmail) {
      try {
        const email2 = await JourneyService.scheduleMessage({
          journeyStateId: journeyState.id,
          messageType: MessageType.SOCIAL_PROOF,
          channel: MessageChannel.EMAIL,
          journeyType: JourneyType.ACQUISITION,
          dayNumber: 3,
          stepNumber: 2,
          subject: `See why thousands choose ${operatorName}`,
          content: this.getEmailContent(2, operatorName),
          scheduledFor: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
        });
        messages.push(email2);
      } catch (error: any) {
        console.log(`⚠️ Could not schedule Email 2: ${error.message}`);
      }
    }

    // Day 5: SMS 2 (Last Chance FTD Incentive)
    if (customerPhone) {
      try {
        const sms2 = await JourneyService.scheduleMessage({
          journeyStateId: journeyState.id,
          messageType: MessageType.URGENCY,
          channel: MessageChannel.SMS,
          journeyType: JourneyType.ACQUISITION,
          dayNumber: 5,
          stepNumber: 2,
          content: this.getSMSContent(2, operatorName),
          scheduledFor: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 days
        });
        messages.push(sms2);
      } catch (error: any) {
        console.log(`⚠️ Could not schedule SMS 2: ${error.message}`);
      }
    }

    // Day 7: Email 3 (Final Nudge)
    if (customerEmail) {
      try {
        const email3 = await JourneyService.scheduleMessage({
          journeyStateId: journeyState.id,
          messageType: MessageType.FINAL_NUDGE,
          channel: MessageChannel.EMAIL,
          journeyType: JourneyType.ACQUISITION,
          dayNumber: 7,
          stepNumber: 3,
          subject: `Last chance! Your ${operatorName} bonus expires soon`,
          content: this.getEmailContent(3, operatorName),
          scheduledFor: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
        });
        messages.push(email3);
      } catch (error: any) {
        console.log(`⚠️ Could not schedule Email 3: ${error.message}`);
      }
    }

    console.log(`✅ Scheduled ${messages.length} messages for acquisition journey`);

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
  private static getEmailContent(emailNumber: number, operatorName: string): string {
    switch (emailNumber) {
      case 1:
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to ${operatorName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #4CAF50;">Welcome to ${operatorName}! 🎉</h1>

    <p>We're excited to have you join our community!</p>

    <p><strong>Your exclusive welcome bonus is waiting:</strong></p>
    <ul>
      <li>100% Match Bonus up to $500</li>
      <li>50 Free Spins</li>
      <li>VIP Support Access</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://${operatorName}.com/register?bonus=welcome"
         style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Claim Your Bonus Now
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">This offer is available for a limited time. Don't miss out!</p>
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
  <title>${operatorName} - Trusted by Thousands</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>Join Thousands of Winners at ${operatorName}</h1>

    <p>Still thinking about it? Here's why you should join today:</p>

    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3>🏆 Why Choose ${operatorName}?</h3>
      <ul>
        <li>10,000+ Games from top providers</li>
        <li>Lightning-fast payouts</li>
        <li>24/7 Customer support</li>
        <li>Fully licensed and secure</li>
      </ul>
    </div>

    <p><strong>What our players say:</strong></p>
    <blockquote style="border-left: 4px solid #4CAF50; padding-left: 15px; margin: 20px 0; font-style: italic;">
      "Best casino I've played at! Won $2,000 on my first week!" - Maria S.
    </blockquote>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://${operatorName}.com/register"
         style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Start Playing Now
      </a>
    </div>
  </div>
</body>
</html>
        `;

      case 3:
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Last Chance - ${operatorName} Bonus Expires</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #FF5722;">⏰ Last Chance!</h1>

    <p><strong>Your ${operatorName} welcome bonus expires in 24 hours!</strong></p>

    <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h2 style="margin-top: 0;">Don't miss out on:</h2>
      <ul style="font-size: 18px;">
        <li>$500 Bonus Match</li>
        <li>50 Free Spins</li>
        <li>Exclusive VIP Benefits</li>
      </ul>
    </div>

    <p>This is your final reminder. Once this offer expires, it's gone forever.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://${operatorName}.com/register?bonus=final"
         style="background-color: #FF5722; color: white; padding: 20px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">
        Claim Now Before It's Too Late
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
        return `Welcome to ${operatorName}!`;
    }
  }

  /**
   * SMS content templates (160 characters max recommended)
   */
  private static getSMSContent(smsNumber: number, operatorName: string): string {
    switch (smsNumber) {
      case 1:
        return `🎰 ${operatorName}: Your $500 bonus is waiting! Claim now: ${operatorName}.com/bonus Reply STOP to opt out`;

      case 2:
        return `⏰ LAST CHANCE! Your ${operatorName} welcome bonus expires soon. Don't miss $500 + 50 spins: ${operatorName}.com Reply STOP to opt out`;

      default:
        return `${operatorName}: Special offer available. Visit ${operatorName}.com`;
    }
  }
}

export default AcquisitionJourney;
