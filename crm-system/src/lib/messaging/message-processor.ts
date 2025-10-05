import JourneyService from '../journey-service';
import EmailProvider from './email-provider';
import SMSProvider from './sms-provider';
import { MessageChannel } from '@prisma/client';

/**
 * Message Processor
 * Handles sending scheduled messages from journeys
 */

export class MessageProcessor {
  /**
   * Process and send all pending messages
   */
  static async processPendingMessages(limit: number = 100) {
    console.log(`🔄 Processing pending messages (limit: ${limit})...`);

    const messages = await JourneyService.getPendingMessages(limit);

    if (messages.length === 0) {
      console.log(`✅ No pending messages to process`);
      return { processed: 0, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const message of messages) {
      try {
        const customer = message.journeyState.customer;

        if (message.channel === MessageChannel.EMAIL) {
          const email = customer.masterEmail;
          if (!email) {
            console.log(`⚠️ Skipping message ${message.id} - no email for customer`);
            failed++;
            continue;
          }

          const result = await EmailProvider.send({
            to: email,
            subject: message.subject || 'Message from Casino',
            html: message.content,
          });

          if (result.success) {
            await JourneyService.markMessageSent(
              message.id,
              result.messageId,
              'mock-email-provider'
            );
            sent++;
          } else {
            console.error(`❌ Failed to send email ${message.id}: ${result.error}`);
            failed++;
          }
        } else if (message.channel === MessageChannel.SMS) {
          const phone = customer.masterPhone;
          if (!phone) {
            console.log(`⚠️ Skipping message ${message.id} - no phone for customer`);
            failed++;
            continue;
          }

          const result = await SMSProvider.send({
            to: phone,
            message: message.content,
          });

          if (result.success) {
            await JourneyService.markMessageSent(
              message.id,
              result.messageId,
              'mock-sms-provider'
            );
            sent++;
          } else {
            console.error(`❌ Failed to send SMS ${message.id}: ${result.error}`);
            failed++;
          }
        }

        // Small delay between messages to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        failed++;
      }
    }

    console.log(`✅ Message processing complete: ${sent} sent, ${failed} failed`);

    return {
      processed: messages.length,
      sent,
      failed,
    };
  }

  /**
   * Run message processor continuously (for background job)
   */
  static async runContinuously(intervalMs: number = 60000) {
    console.log(`🔁 Starting continuous message processor (interval: ${intervalMs}ms)`);

    const process = async () => {
      try {
        await this.processPendingMessages();
      } catch (error: any) {
        console.error(`❌ Error in message processor:`, error);
      }
    };

    // Run immediately
    await process();

    // Then run on interval
    setInterval(process, intervalMs);
  }
}

export default MessageProcessor;
