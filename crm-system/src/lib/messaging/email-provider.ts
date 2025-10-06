/**
 * Email Provider Integration - PRODUCTION (Postmark)
 */

import * as postmark from 'postmark';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  operatorId?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export class EmailProvider {
  /**
   * Send an email via Postmark
   */
  static async send(input: SendEmailInput): Promise<EmailResult> {
    const { to, subject, html, from, fromName, operatorId } = input;

    try {
      // Use Postmark if API key is configured
      if (process.env.POSTMARK_API_KEY) {
        return await this.sendViaPostmark(input);
      }

      // Fallback error if no provider configured
      console.error('❌ No email provider configured');
      return {
        success: false,
        error: 'No email provider configured',
      };
    } catch (error: any) {
      console.error(`❌ Email send error:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send via Postmark
   */
  private static async sendViaPostmark(input: SendEmailInput): Promise<EmailResult> {
    const { to, subject, html, from, fromName } = input;

    const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY!);

    try {
      const finalFrom = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com';

      const result = await client.sendEmail({
        From: finalFrom,
        To: to,
        Subject: subject,
        HtmlBody: html,
        MessageStream: 'outbound',
      });

      console.log(`📧 [POSTMARK EMAIL SENT]`);
      console.log(`   To: ${to}`);
      console.log(`   From: ${finalFrom}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Message ID: ${result.MessageID}`);

      return {
        success: true,
        messageId: result.MessageID,
        provider: 'postmark',
      };
    } catch (error: any) {
      console.error(`❌ Postmark error:`, error);
      return {
        success: false,
        error: error.message,
        provider: 'postmark',
      };
    }
  }

  /**
   * Send bulk emails
   */
  static async sendBulk(emails: SendEmailInput[]): Promise<EmailResult[]> {
    const results = await Promise.all(
      emails.map(email => this.send(email))
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`📧 Bulk email sent: ${successCount}/${results.length} successful`);

    return results;
  }
}

export default EmailProvider;
