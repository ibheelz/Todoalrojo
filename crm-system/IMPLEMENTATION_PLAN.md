# 🚀 CRM Implementation Plan - Missing Features

## ✅ ALREADY COMPLETE
- Customer detail page exists (`/dashboard/customers/[id]/page.tsx`)
- Journey automation with message scheduling
- Brand segmentation
- Cross-page navigation
- Message enrichment with customer details

## 🔥 CRITICAL - IMPLEMENT NOW

### 1. Message Template Management System
**File:** `/dashboard/message-templates/page.tsx`
**Purpose:** Let you customize messages for each stage and brand

**Features:**
- List all templates by brand and journey type
- Edit message text, subject, links
- Configure which stage triggers which message
- Preview messages before saving

**Database Needs:**
```prisma
model MessageTemplate {
  id            String   @id @default(cuid())
  operatorId    String   // Which brand
  journeyType   String   // ACQUISITION or RETENTION
  messageType   String   // WELCOME, BONUS_REMINDER, etc.
  dayNumber     Int      // When to send (day 0, 1, 3, etc.)
  channel       String   // EMAIL or SMS
  subject       String?  // For emails
  content       String   @db.Text  // The actual message
  ctaLink       String?  // Call-to-action link
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([operatorId, journeyType, messageType, dayNumber])
}
```

### 2. Actual Email/SMS Sending
**Files to Update:**
- `/src/lib/messaging/email-provider.ts`
- `/src/lib/messaging/sms-provider.ts`

**What to Add:**
```typescript
// In email-provider.ts
static async send(input: SendEmailInput): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'postmark'
  
  if (provider === 'postmark') {
    return await this.sendViaPostmark(input)
  }
  
  // Fallback to mock for development
  return await this.sendViaMock(input)
}

static async sendViaPostmark(input: SendEmailInput) {
  const postmark = require('postmark')
  const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY)
  
  const result = await client.sendEmail({
    From: input.from || process.env.DEFAULT_FROM_EMAIL,
    To: input.to,
    Subject: input.subject,
    HtmlBody: input.html,
    MessageStream: 'outbound'
  })
  
  return {
    success: true,
    messageId: result.MessageID,
    provider: 'postmark'
  }
}
```

```typescript
// In sms-provider.ts
static async sendViaLaaffic(input: SendSMSInput) {
  const response = await fetch('https://api.laaffic.com/v1/sms/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LAAFFIC_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: input.to,
      message: input.message,
      from: input.from || process.env.LAAFFIC_SENDER_ID
    })
  })
  
  const data = await response.json()
  
  return {
    success: data.success,
    messageId: data.message_id,
    provider: 'laaffic'
  }
}
```

### 3. Message Processor Cron Job
**File:** `/src/app/api/cron/process-messages/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MessageProcessor } from '@/lib/messaging/message-processor'

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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
      }
    })

    console.log(`📧 Processing ${pendingMessages.length} pending messages`)

    const results = {
      total: pending Messages.length,
      sent: 0,
      failed: 0,
      skipped: 0
    }

    // Process each message
    for (const message of pendingMessages) {
      const result = await MessageProcessor.processMessage(message)
      
      if (result.success) {
        results.sent++
      } else if (result.skipped) {
        results.skipped++
      } else {
        results.failed++
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error: any) {
    console.error('Failed to process messages:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

**Setup Cron:**
1. Go to Vercel/Render dashboard
2. Add cron job: `*/5 * * * *` (every 5 minutes)
3. URL: `https://your-domain.com/api/cron/process-messages`
4. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

### 4. Postback Webhook Endpoints
**File:** `/src/app/api/postback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import JourneyService from '@/lib/journey-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log the postback
    console.log('📨 Postback received:', body)
    
    // Extract data (format depends on operator)
    const {
      clickId,
      email,
      phone,
      userId,
      eventType, // 'registration', 'deposit', 'ftd'
      depositAmount,
      currency = 'USD'
    } = body
    
    // Find customer by clickId, email, or phone
    let customer = null
    
    if (clickId) {
      const identifier = await prisma.identifier.findFirst({
        where: { value: clickId, type: 'CLICK_ID' },
        include: { customer: true }
      })
      customer = identifier?.customer
    }
    
    if (!customer && email) {
      customer = await prisma.customer.findFirst({
        where: { masterEmail: email }
      })
    }
    
    if (!customer && phone) {
      customer = await prisma.customer.findFirst({
        where: { masterPhone: phone }
      })
    }
    
    if (!customer) {
      return NextResponse.json({
        error: 'Customer not found',
        clickId,
        email,
        phone
      }, { status: 404 })
    }
    
    // Create operator postback record
    const postback = await prisma.operatorPostback.create({
      data: {
        customerId: customer.id,
        operatorId: body.operatorId || 'unknown',
        eventType: eventType === 'registration' ? 'REGISTRATION' : 
                  eventType === 'deposit' || eventType === 'ftd' ? 'DEPOSIT' : 
                  'REGISTRATION',
        clickId,
        email,
        phone,
        userId,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        currency,
        rawPayload: body,
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        processedAt: new Date()
      }
    })
    
    // Update journey state if it's a deposit
    if (eventType === 'deposit' || eventType === 'ftd') {
      await JourneyService.handleDeposit(
        customer.id,
        body.operatorId || 'unknown',
        parseFloat(depositAmount) || 0
      )
    }
    
    return NextResponse.json({
      success: true,
      postbackId: postback.id,
      customerId: customer.id
    })
  } catch (error: any) {
    console.error('Postback processing error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

### 5. Influencer Detail Page
**File:** `/src/app/dashboard/influencers/[id]/page.tsx`

Use similar structure to customer detail page but show:
- Influencer stats (total clicks, conversions, revenue)
- Campaigns they're associated with
- Top performing content
- Revenue by brand

## ⚙️ ENVIRONMENT VARIABLES NEEDED

Add to `.env`:
```bash
# Email Provider
EMAIL_PROVIDER=postmark
POSTMARK_API_KEY=your_postmark_key_here
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# SMS Provider
SMS_PROVIDER=laaffic
LAAFFIC_API_KEY=your_laaffic_key_here
LAAFFIC_SENDER_ID=YourBrand

# Cron Job Security
CRON_SECRET=your_random_secret_here

# Production Database (if not already set)
DATABASE_URL=postgresql://...
```

## 📝 STEP-BY-STEP IMPLEMENTATION

### Week 1: Message Templates
1. Add MessageTemplate model to Prisma schema
2. Run `npx prisma generate && npx prisma db push`
3. Create `/api/message-templates` CRUD endpoints
4. Create `/dashboard/message-templates` UI page
5. Update journey-service.ts to use custom templates

### Week 2: Real Sending
1. Sign up for Postmark account
2. Sign up for Laaffic account
3. Add API keys to .env
4. Implement real sending in providers
5. Test with small batch

### Week 3: Automation
1. Create cron endpoint
2. Deploy to production
3. Set up Vercel/Render cron job
4. Monitor logs for first 24 hours

### Week 4: Postbacks
1. Create postback endpoint
2. Give URL to operators
3. Test with sample data
4. Monitor and verify deposits update stages

## 🎯 PRIORITY ORDER

1. **Message Templates** (so you can customize messages)
2. **Real Email/SMS Sending** (so messages actually send)
3. **Cron Job** (so sending happens automatically)
4. **Postbacks** (so deposits trigger stage changes)
5. **Influencer Page** (nice to have, low priority)

## 🧪 TESTING CHECKLIST

- [ ] Create message template for Roobet
- [ ] Create message template for Rushbet
- [ ] Test email sending with Postmark
- [ ] Test SMS sending with Laaffic
- [ ] Verify cron job runs every 5 min
- [ ] Send test postback
- [ ] Verify stage updates on deposit
- [ ] Check unsubscribe links work
- [ ] Verify frequency caps (max 1/day)
- [ ] Test with real customer journey
