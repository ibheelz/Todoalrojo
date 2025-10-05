import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock email sending
async function sendEmail(to: string, subject: string, content: string) {
  console.log(`📧 [MOCK] Sending email to ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Content: ${content.substring(0, 100)}...`);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // 95% success rate
  if (Math.random() > 0.95) {
    throw new Error('Email delivery failed');
  }

  return {
    success: true,
    messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    provider: 'postmark-mock'
  };
}

// Mock SMS sending
async function sendSMS(to: string, content: string) {
  console.log(`📱 [MOCK] Sending SMS to ${to}`);
  console.log(`   Content: ${content.substring(0, 100)}...`);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // 95% success rate
  if (Math.random() > 0.95) {
    throw new Error('SMS delivery failed');
  }

  return {
    success: true,
    messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    provider: 'laaffic-mock'
  };
}

// Process a single message
async function processMessage(message: any) {
  try {
    const customer = message.journeyState.customer;

    // Personalize content
    let content = message.content;
    content = content.replace(/\{firstName\}/g, customer.firstName || 'there');
    content = content.replace(/\{lastName\}/g, customer.lastName || '');
    content = content.replace(/\{brandName\}/g, 'Our Casino');

    let subject = message.subject;
    if (subject) {
      subject = subject.replace(/\{firstName\}/g, customer.firstName || 'there');
      subject = subject.replace(/\{brandName\}/g, 'Our Casino');
    }

    // Send based on channel
    let result;
    if (message.channel === 'EMAIL') {
      if (!customer.masterEmail) {
        throw new Error('No email address');
      }
      result = await sendEmail(customer.masterEmail, subject || 'No Subject', content);
    } else {
      if (!customer.masterPhone) {
        throw new Error('No phone number');
      }
      result = await sendSMS(customer.masterPhone, content);
    }

    // Update message as sent
    await prisma.journeyMessage.update({
      where: { id: message.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        providerId: result.messageId,
        providerName: result.provider
      }
    });

    // Update journey state counters
    if (message.channel === 'EMAIL') {
      await prisma.customerJourneyState.update({
        where: { id: message.journeyStateId },
        data: {
          emailCount: { increment: 1 },
          lastEmailAt: new Date()
        }
      });
    } else {
      await prisma.customerJourneyState.update({
        where: { id: message.journeyStateId },
        data: {
          smsCount: { increment: 1 },
          lastSmsAt: new Date()
        }
      });
    }

    return { success: true, messageId: message.id };
  } catch (error: any) {
    // Mark as failed
    await prisma.journeyMessage.update({
      where: { id: message.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message
      }
    });

    return { success: false, messageId: message.id, error: error.message };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional - remove in development)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all PENDING messages scheduled for now or earlier
    const pendingMessages = await prisma.journeyMessage.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: new Date()
        }
      },
      take: 100, // Process 100 at a time
      include: {
        journeyState: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    });

    console.log(`📧 Processing ${pendingMessages.length} pending messages`);

    const results = {
      total: pendingMessages.length,
      sent: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Process each message
    for (const message of pendingMessages) {
      const result = await processMessage(message);

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({
          messageId: result.messageId,
          error: result.error
        });
      }
    }

    console.log(`✅ Processing complete: ${results.sent} sent, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Failed to process messages:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Same as GET, but allows manual triggering via POST
  return GET(request);
}
