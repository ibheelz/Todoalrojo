/**
 * SMS Provider Integration - PRODUCTION (Laaffic)
 */

import axios from 'axios';

export interface SendSMSInput {
  to: string;
  message: string;
  from?: string;
  operatorId?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export class SMSProvider {
  /**
   * Send SMS via Laaffic (Real Implementation)
   */
  static async sendViaLaaffic(input: SendSMSInput): Promise<SMSResult> {
    const { to, message, from } = input;

    try {
      if (!process.env.LAAFFIC_API_KEY || !process.env.LAAFFIC_API_SECRET) {
        throw new Error('Laaffic credentials not configured');
      }

      const response = await axios.post(
        'https://www.laaffic.com/api/sendsms.php',
        {
          user: process.env.LAAFFIC_API_KEY,
          password: process.env.LAAFFIC_API_SECRET,
          sender: from || process.env.LAAFFIC_SENDER_ID || 'CASINO',
          SMSText: message,
          GSM: to.replace('+', ''), // Remove + if present
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`📱 [LAAFFIC SMS SENT]`);
      console.log(`   To: ${to}`);
      console.log(`   From: ${from || process.env.LAAFFIC_SENDER_ID || 'CASINO'}`);
      console.log(`   Message: ${message}`);
      console.log(`   Response:`, response.data);

      // Laaffic returns different response formats
      const isSuccess = response.data && (
        response.data.success === true ||
        response.data.status === 'success' ||
        response.status === 200
      );

      if (isSuccess) {
        return {
          success: true,
          messageId: response.data.messageId || response.data.id || `laaffic-${Date.now()}`,
          provider: 'laaffic',
        };
      } else {
        throw new Error(response.data.message || response.data.error || 'SMS send failed');
      }
    } catch (error: any) {
      console.error(`❌ Laaffic SMS error:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        provider: 'laaffic',
      };
    }
  }

  /**
   * Send an SMS (uses Laaffic)
   */
  static async send(input: SendSMSInput): Promise<SMSResult> {
    const { to, message, from, operatorId } = input;

    try {
      // Always use Laaffic if configured
      if (process.env.LAAFFIC_API_KEY) {
        return await this.sendViaLaaffic(input);
      }

      // Error if no provider configured
      console.error('❌ No SMS provider configured');
      return {
        success: false,
        error: 'No SMS provider configured',
      };
    } catch (error: any) {
      console.error(`❌ SMS send error:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send bulk SMS
   */
  static async sendBulk(messages: SendSMSInput[]): Promise<SMSResult[]> {
    const results = await Promise.all(
      messages.map(sms => this.send(sms))
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`📱 Bulk SMS sent: ${successCount}/${results.length} successful`);

    return results;
  }
}

export default SMSProvider;
