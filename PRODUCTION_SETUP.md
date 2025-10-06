# 🚀 Production Setup Guide - Reliable Services Only

## ⚠️ IMPORTANT: Don't touch local dev setup!

This guide sets up **production-grade reliable services** without affecting your current local development environment.

---

## 📋 Services We'll Use (All Battle-Tested)

### 1. **Vercel** - Hosting & Deployment
- **Why:** 99.99% uptime, auto-scaling, zero downtime deploys
- **Cost:** Free tier (upgrade if needed)
- **Reliability:** Used by Netflix, GitHub, Washington Post

### 2. **Supabase** - Production Database
- **Why:** Managed PostgreSQL, automatic backups, 99.9% uptime SLA
- **Cost:** Free tier (8GB storage), $25/mo paid
- **Reliability:** Built on AWS, enterprise-grade

### 3. **Postmark** - Transactional Email
- **Why:** 99.97% delivery rate, fastest email service
- **Cost:** Free (100 emails/month), $15/mo for 10k emails
- **Reliability:** Purpose-built for transactional emails, not marketing

### 4. **Twilio** - SMS Sending
- **Why:** Industry standard, 99.95% uptime, global coverage
- **Cost:** Pay-as-you-go ($0.0079/SMS in US)
- **Reliability:** Used by Uber, Airbnb, WhatsApp

### 5. **Vercel Cron Jobs** - Message Processing
- **Why:** Serverless, runs exactly on time, no servers to manage
- **Cost:** Included in Vercel (even free tier)
- **Reliability:** Built into Vercel, guaranteed execution

---

## 🔧 Step-by-Step Setup (Do NOT run these yet)

### STEP 1: Set Up Supabase Database (5 minutes)

**1.1 Create Account:**
```
1. Go to: https://supabase.com
2. Sign up with GitHub
3. Create new project
   - Name: todoalrojo-crm-prod
   - Database Password: [Generate strong password]
   - Region: Choose closest to your users
   - Plan: Free (for now)
```

**1.2 Get Connection String:**
```
1. Go to Project Settings → Database
2. Copy "Connection string" (URI format)
3. Replace [YOUR-PASSWORD] with your actual password
4. Save this - you'll need it: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

**1.3 Run Database Migration:**
```bash
# In your crm-system folder
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

### STEP 2: Set Up Postmark Email (3 minutes)

**2.1 Create Account:**
```
1. Go to: https://postmarkapp.com
2. Sign up (free, no credit card for 100 emails/month)
3. Create "Server" (name it: todoalrojo-crm)
4. Verify sender signature:
   - Add your domain (e.g., mieladigital.com)
   - OR use single email (e.g., noreply@mieladigital.com)
   - Check your email for verification link
```

**2.2 Get API Token:**
```
1. Go to: Servers → todoalrojo-crm → API Tokens
2. Copy "Server API token"
3. Save this: [something like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx]
```

**2.3 Test Email (Optional but recommended):**
```bash
curl "https://api.postmarkapp.com/email" \
  -X POST \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Postmark-Server-Token: YOUR_TOKEN_HERE" \
  -d '{
    "From": "noreply@yourdomain.com",
    "To": "your-email@example.com",
    "Subject": "Postmark Test",
    "TextBody": "This is a test email from Postmark!"
  }'
```

---

### STEP 3: Set Up Twilio SMS (5 minutes)

**3.1 Create Account:**
```
1. Go to: https://www.twilio.com/try-twilio
2. Sign up (free trial with $15 credit)
3. Verify your phone number
4. Choose: "Alerts & Notifications" as use case
```

**3.2 Get Credentials:**
```
1. Go to Console Dashboard
2. Find "Account Info" section
3. Copy:
   - Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   - Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**3.3 Get Phone Number:**
```
1. Go to Phone Numbers → Manage → Buy a number
2. Select country (e.g., Peru for +51)
3. Check "SMS" capability
4. Buy number (uses trial credit)
5. Save number: +51xxxxxxxxx
```

**3.4 Test SMS (Optional):**
```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json" \
  --data-urlencode "From=+51xxxxxxxxx" \
  --data-urlencode "To=+51999888777" \
  --data-urlencode "Body=Test SMS from Twilio" \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

---

### STEP 4: Deploy to Vercel (10 minutes)

**4.1 Prepare Environment Variables:**

Create file: `crm-system/.env.production` (NEW FILE, don't touch .env)

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Auth
NEXTAUTH_URL="https://crm-yourdomain.vercel.app"  # Will get this after deploy
NEXTAUTH_SECRET="[generate-random-string-32-chars]"
JWT_SECRET="[generate-random-string-32-chars]"

# Email (Postmark)
EMAIL_PROVIDER="postmark"
POSTMARK_API_KEY="[your-postmark-token]"
DEFAULT_FROM_EMAIL="noreply@yourdomain.com"

# SMS (Twilio)
SMS_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="[your-twilio-sid]"
TWILIO_AUTH_TOKEN="[your-twilio-token]"
TWILIO_PHONE_NUMBER="+51xxxxxxxxx"

# Cron Security
CRON_SECRET="[generate-random-string-32-chars]"

# Admin
ADMIN_EMAIL="abiola@mieladigital.com"
ADMIN_PASSWORD="[change-this-secure-password]"

# Production
NODE_ENV="production"
```

**4.2 Deploy to Vercel:**

```bash
# In crm-system folder
cd /Users/bheelz/Desktop/Todoalrojo/crm-system

# Login to Vercel
vercel login

# Deploy (it will ask questions)
vercel

# When asked:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? todoalrojo-crm
# - Directory? ./
# - Override settings? No

# After deploy, copy the preview URL
# Then deploy to production:
vercel --prod
```

**4.3 Add Environment Variables in Vercel:**

```
1. Go to: https://vercel.com/dashboard
2. Select your project: todoalrojo-crm
3. Go to: Settings → Environment Variables
4. Add ALL variables from .env.production (one by one)
5. Make sure to select "Production" environment
6. Redeploy after adding all vars
```

**4.4 Update NEXTAUTH_URL:**
```
1. After deploy, you'll get URL like: https://todoalrojo-crm.vercel.app
2. Go back to Vercel → Settings → Environment Variables
3. Find NEXTAUTH_URL
4. Update it to your actual Vercel URL
5. Redeploy
```

---

### STEP 5: Configure Vercel Cron Job (2 minutes)

**5.1 Create vercel.json in crm-system folder:**

```json
{
  "crons": [
    {
      "path": "/api/cron/process-messages",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**5.2 Update the cron API to check auth:**

File: `src/app/api/cron/process-messages/route.ts`

Add auth check:
```typescript
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rest of your code...
}
```

**5.3 Redeploy:**
```bash
vercel --prod
```

Vercel will automatically run the cron every 5 minutes.

---

### STEP 6: Update Message Providers (5 minutes)

**6.1 Update Email Provider:**

File: `src/lib/messaging/email-provider.ts`

```typescript
import Postmark from 'postmark'

export class EmailProvider {
  static async send(input: SendEmailInput): Promise<EmailResult> {
    const provider = process.env.EMAIL_PROVIDER || 'mock'

    if (provider === 'postmark') {
      return await this.sendViaPostmark(input)
    }

    // Fallback to mock for development
    return await this.sendViaMock(input)
  }

  static async sendViaPostmark(input: SendEmailInput) {
    if (!process.env.POSTMARK_API_KEY) {
      throw new Error('POSTMARK_API_KEY not configured')
    }

    const client = new Postmark.ServerClient(process.env.POSTMARK_API_KEY)

    try {
      const result = await client.sendEmail({
        From: input.from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
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
    } catch (error: any) {
      console.error('Postmark error:', error)
      return {
        success: false,
        error: error.message,
        provider: 'postmark'
      }
    }
  }

  // Keep mock method for development
  static async sendViaMock(input: SendEmailInput) {
    // Your existing mock code...
  }
}
```

**6.2 Update SMS Provider:**

File: `src/lib/messaging/sms-provider.ts`

```typescript
import twilio from 'twilio'

export class SMSProvider {
  static async send(input: SendSMSInput): Promise<SMSResult> {
    const provider = process.env.SMS_PROVIDER || 'mock'

    if (provider === 'twilio') {
      return await this.sendViaTwilio(input)
    }

    // Fallback to mock for development
    return await this.sendViaMock(input)
  }

  static async sendViaTwilio(input: SendSMSInput) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured')
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    try {
      const message = await client.messages.create({
        body: input.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: input.to
      })

      return {
        success: true,
        messageId: message.sid,
        provider: 'twilio'
      }
    } catch (error: any) {
      console.error('Twilio error:', error)
      return {
        success: false,
        error: error.message,
        provider: 'twilio'
      }
    }
  }

  // Keep mock method for development
  static async sendViaMock(input: SendSMSInput) {
    // Your existing mock code...
  }
}
```

**6.3 Install Dependencies:**

```bash
cd crm-system
npm install postmark twilio
```

---

### STEP 7: Configure Redtrack with Production URL

**7.1 Get Your Production URL:**
```
After Vercel deploy: https://todoalrojo-crm.vercel.app
```

**7.2 In Redtrack Dashboard:**

```
1. Go to: Traffic Sources → [Your Source] → Postback Settings
2. Add Postback URL:
   https://todoalrojo-crm.vercel.app/api/ingest/click

3. Add Parameters:
   ?clickId={click_id}
   &campaign={campaign_name}
   &source={source}
   &medium={medium}
   &operatorId={custom_field_1}
   &ip={ip}
   &userAgent={user_agent}
   &landingPage={landing_page}
   &country={country}

4. Method: POST
5. Format: JSON Body with all parameters
6. Enable: Yes
7. Save
```

**Full Redtrack JSON Body Template:**
```json
{
  "clickId": "{click_id}",
  "campaign": "{campaign_name}",
  "source": "{source}",
  "medium": "{medium}",
  "operatorId": "{custom_field_1}",
  "ip": "{ip}",
  "userAgent": "{user_agent}",
  "landingPage": "{landing_page}",
  "country": "{country}",
  "city": "{city}",
  "isp": "{isp}",
  "device": "{device_type}",
  "browser": "{browser}",
  "os": "{os}",
  "isMobile": "{is_mobile}",
  "isBot": "{is_bot}"
}
```

---

### STEP 8: Configure Zapier with Production URL

**8.1 In Zapier Dashboard:**

```
1. Go to your existing Zap
2. Edit the "Webhooks by Zapier" action step
3. Change URL to:
   https://todoalrojo-crm.vercel.app/api/postback
4. Method: POST
5. Data: (map your fields)
   {
     "clickid": "{{clickId}}",
     "type": "{{eventType}}",
     "value": "{{amount}}",
     "currency": "{{currency}}",
     "status": "approved"
   }
6. Test the Zap
7. Turn it ON
```

---

### STEP 9: Update Landing Page Forms

**All your lead forms need to point to production URL:**

Change from:
```javascript
fetch('http://localhost:3005/api/ingest/lead', {
```

To:
```javascript
fetch('https://todoalrojo-crm.vercel.app/api/ingest/lead', {
```

In all these files:
- `/Users/bheelz/Desktop/Todoalrojo/lead-form.html`
- Any other forms you have

---

## 🧪 Testing Checklist

After everything is deployed, test in order:

### Test 1: Health Check
```bash
curl https://todoalrojo-crm.vercel.app/api/health
# Should return: {"status": "healthy"}
```

### Test 2: Click Ingestion
```bash
curl -X POST https://todoalrojo-crm.vercel.app/api/ingest/click \
  -H "Content-Type: application/json" \
  -d '{
    "clickId": "PROD_TEST_001",
    "email": "test@example.com",
    "phone": "+51999888777",
    "ip": "1.2.3.4",
    "campaign": "test",
    "operatorId": "rushbet"
  }'
# Should return: {"success": true, "journeyStarted": true}
```

### Test 3: Lead Ingestion
```bash
curl -X POST https://todoalrojo-crm.vercel.app/api/ingest/lead \
  -H "Content-Type: application/json" \
  -d '{
    "clickId": "PROD_TEST_001",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "operatorId": "rushbet",
    "ip": "1.2.3.4"
  }'
# Should return: {"success": true}
```

### Test 4: Check Messages Scheduled
```bash
curl https://todoalrojo-crm.vercel.app/api/journey/messages
# Should show scheduled messages
```

### Test 5: Wait for Cron (5 minutes)
```
Wait 5 minutes for Vercel cron to run
Check your email for test message
Check your phone for test SMS
```

### Test 6: Send Postback
```bash
curl -X POST https://todoalrojo-crm.vercel.app/api/postback \
  -H "Content-Type: application/json" \
  -d '{
    "clickid": "PROD_TEST_001",
    "type": "Deposit",
    "value": 100
  }'
# Should return: {"success": true}
```

---

## 🔒 Security Best Practices

### 1. Generate Strong Secrets:
```bash
# Generate 32-character random strings for secrets
openssl rand -base64 32
```

### 2. Enable Vercel Authentication:
```
- Add IP allowlist if needed
- Enable deployment protection
- Set up team access controls
```

### 3. Database Security:
```
- Supabase has automatic backups (every day)
- Enable connection pooling
- Use read replicas for heavy queries (paid plan)
```

### 4. API Rate Limiting:
```typescript
// Add to your API routes
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

---

## 💰 Estimated Monthly Costs

**Free tier (for testing/low volume):**
- Vercel: $0 (Free tier)
- Supabase: $0 (Free tier - 8GB)
- Postmark: $0 (100 emails/month)
- Twilio: $15 trial credit

**Production tier (1000 customers/month):**
- Vercel: $20/mo (Pro plan for better performance)
- Supabase: $25/mo (Pro plan with backups)
- Postmark: $15/mo (10k emails)
- Twilio: ~$10/mo (1000 SMS @ $0.01 each)
**Total: ~$70/month**

**Scale tier (10,000 customers/month):**
- Vercel: $20/mo
- Supabase: $25/mo
- Postmark: $50/mo (50k emails)
- Twilio: ~$100/mo (10k SMS)
**Total: ~$195/month**

---

## 📊 Monitoring & Reliability

### Vercel Dashboard:
- Real-time logs
- Error tracking
- Performance metrics
- Cron job history

### Postmark Dashboard:
- Email delivery rates (99.97% guaranteed)
- Bounce tracking
- Open/click rates
- SPAM score monitoring

### Twilio Dashboard:
- SMS delivery status
- Error logs
- Usage analytics
- Number health

### Supabase Dashboard:
- Database performance
- Query analytics
- Connection pool status
- Automatic backups (daily)

---

## 🚨 What to Do If Something Goes Down

### If Emails Fail:
1. Check Postmark dashboard for errors
2. Check sender signature is verified
3. Check API key is correct
4. Emails queue automatically and retry

### If SMS Fails:
1. Check Twilio dashboard for errors
2. Verify phone number is active
3. Check balance (for trial accounts)
4. SMS queue automatically and retry

### If Cron Fails:
1. Check Vercel → Deployments → Logs
2. Check if CRON_SECRET is set correctly
3. Vercel retries automatically on failure

### If Database Goes Down:
1. Supabase has 99.9% uptime SLA
2. Automatic backups every 24 hours
3. Can restore from any backup point
4. Contact Supabase support (response < 1 hour for Pro)

---

## ✅ Final Checklist Before Going Live

- [ ] Supabase database created and migrated
- [ ] Postmark account created and sender verified
- [ ] Twilio account created with phone number
- [ ] All env vars added to Vercel
- [ ] Deployed to Vercel successfully
- [ ] Cron job configured and tested
- [ ] Redtrack configured with production URL
- [ ] Zapier configured with production URL
- [ ] Landing page forms updated to production URL
- [ ] Test click → lead → deposit flow works
- [ ] Test email actually sends
- [ ] Test SMS actually sends
- [ ] Monitoring dashboards bookmarked
- [ ] Team has access to all accounts
- [ ] Secrets stored securely (1Password/LastPass)

---

## 🎯 Summary

**Reliability Scores:**
- Vercel: 99.99% uptime
- Supabase: 99.9% uptime SLA
- Postmark: 99.97% delivery rate
- Twilio: 99.95% uptime
- Vercel Cron: Guaranteed execution

**All services are:**
- ✅ Battle-tested (used by Fortune 500 companies)
- ✅ Automatically scalable
- ✅ Have built-in redundancy
- ✅ Provide monitoring & alerting
- ✅ Have excellent documentation
- ✅ Offer 24/7 support (on paid plans)

**Your local dev setup stays untouched.**

Ready to start? Begin with STEP 1 (Supabase) and work through each step.
