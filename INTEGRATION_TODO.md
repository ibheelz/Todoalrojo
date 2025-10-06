# 🔗 Redtrack + Zapier + CRM Integration TODO List

## 📋 Overview
Connect Redtrack (click tracking) + Zapier (conversion postbacks) to make the CRM work with real data and full automation.

---

## ✅ Phase 1: Test Existing API Endpoints (2 hours)

### [ ] 1.1 Test Click Ingestion API
**Goal:** Verify `/api/ingest/click` works with real data format

**Steps:**
1. Start dev server: `npm run dev`
2. Test with curl/Postman:
   ```bash
   curl -X POST http://localhost:3005/api/ingest/click \
     -H "Content-Type: application/json" \
     -d '{
       "clickId": "TEST_CLICK_001",
       "ip": "192.168.1.100",
       "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
       "campaign": "test-campaign",
       "source": "youtube",
       "medium": "carlos-gaming",
       "landingPage": "https://rushbet.com/register",
       "referrer": "https://youtube.com"
     }'
   ```
3. Check response (should return customer ID)
4. Go to `/dashboard/customers` and verify customer created
5. Check `/dashboard/clicks` and verify click recorded
6. Verify clickId saved as identifier

**Success criteria:**
- ✅ API returns 200 status
- ✅ Customer profile created
- ✅ Click recorded with correct data
- ✅ Identifier created with type "CLICK_ID"

---

### [ ] 1.2 Test Lead Ingestion API
**Goal:** Verify `/api/ingest/lead` works and links to existing click

**Steps:**
1. Test with same clickId from previous test:
   ```bash
   curl -X POST http://localhost:3005/api/ingest/lead \
     -H "Content-Type: application/json" \
     -d '{
       "clickId": "TEST_CLICK_001",
       "email": "testuser@example.com",
       "phone": "+51999888777",
       "firstName": "Juan",
       "lastName": "Pérez",
       "campaign": "test-campaign"
     }'
   ```
2. Check response
3. Go to customer profile (from step 1.1)
4. Verify email and phone added to same profile
5. Check identifiers tab shows: clickId + email + phone

**Success criteria:**
- ✅ API returns 200 status
- ✅ Email/phone added to SAME customer (not new customer)
- ✅ Lead recorded in `/dashboard/leads`
- ✅ All 3 identifiers linked to one profile

---

### [ ] 1.3 Test Postback/Conversion API
**Goal:** Verify `/api/postback` receives deposits and updates journey

**Steps:**
1. First, check current journey state:
   - Go to customer profile from step 1.2
   - Note current stage (should be -1)
   - Note journey type (should be "acquisition")

2. Send deposit postback:
   ```bash
   curl -X POST http://localhost:3005/api/postback \
     -H "Content-Type: application/json" \
     -d '{
       "eventType": "deposit",
       "clickId": "TEST_CLICK_001",
       "email": "testuser@example.com",
       "depositAmount": 100,
       "currency": "USD",
       "operatorId": "rushbet",
       "userId": "rush_test_001"
     }'
   ```

3. Verify response
4. Check customer profile again:
   - Stage should change: -1 → 1
   - Journey type should change: "acquisition" → "retention"
   - Total revenue should show $100
5. Check `/dashboard/events` for deposit event

**Success criteria:**
- ✅ API returns 200 status
- ✅ Journey stage updated to 1
- ✅ Journey type changed to "retention"
- ✅ Revenue tracked correctly
- ✅ Event recorded

---

### [ ] 1.4 Test Journey Message Scheduling
**Goal:** Verify messages get scheduled based on customer stage

**Steps:**
1. Go to `/dashboard/journey-automation`
2. Check if messages were scheduled for test customer
3. Verify message content includes customer name
4. Check scheduled time is correct based on stage

**Success criteria:**
- ✅ Welcome message scheduled after click
- ✅ Retention message scheduled after deposit
- ✅ Messages show correct customer details
- ✅ No duplicate messages

---

## ✅ Phase 2: Configure Redtrack Integration (1 hour)

### [ ] 2.1 Get CRM API Endpoint Ready
**Goal:** Prepare endpoint URL for Redtrack

**Steps:**
1. If testing locally: Set up ngrok
   ```bash
   ngrok http 3005
   ```
2. Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
3. Note full endpoint: `https://abc123.ngrok.io/api/ingest/click`
4. Test endpoint is accessible from outside:
   ```bash
   curl https://abc123.ngrok.io/api/health
   ```

**For production:**
- Deploy CRM to production server
- Use real domain: `https://crm.yourdomain.com/api/ingest/click`

**Success criteria:**
- ✅ Endpoint accessible from internet
- ✅ Returns proper response to test requests

---

### [ ] 2.2 Configure Redtrack Postback
**Goal:** Make Redtrack send click data to CRM

**Steps:**
1. Log into Redtrack account
2. Go to: Traffic Sources → [Your Traffic Source] → Settings
3. Find "Postback URL" or "Webhook" section
4. Add postback URL:
   ```
   https://abc123.ngrok.io/api/ingest/click?clickId={click_id}&campaign={campaign_name}&source={source}&medium={medium}&ip={ip}&ua={user_agent}&landing={landing_page}
   ```
5. Map Redtrack parameters to CRM expected format
6. Enable postback
7. Save settings

**Redtrack parameter mapping:**
- `{click_id}` → clickId
- `{campaign_name}` → campaign
- `{source}` → source
- `{medium}` → medium
- `{ip}` → ip
- `{user_agent}` → userAgent
- `{landing_page}` → landingPage

**Success criteria:**
- ✅ Postback URL configured in Redtrack
- ✅ All parameters mapped correctly
- ✅ Postback enabled

---

### [ ] 2.3 Test Real Click from Redtrack
**Goal:** Generate real click and verify it reaches CRM

**Steps:**
1. Get tracking link from Redtrack
2. Click the link (or use click simulator in Redtrack)
3. Check CRM immediately:
   - Go to `/dashboard/clicks`
   - Should see new click appear
   - Verify click data is correct
4. Check customer was created
5. Verify clickId matches Redtrack

**Success criteria:**
- ✅ Click appears in CRM within seconds
- ✅ Customer profile created automatically
- ✅ All tracking parameters captured
- ✅ clickId matches Redtrack dashboard

---

## ✅ Phase 3: Configure Landing Page Form (2 hours)

### [ ] 3.1 Review Existing Lead Form
**Goal:** Understand current form setup

**Steps:**
1. Open `/Users/bheelz/Desktop/Todoalrojo/lead-form.html`
2. Check form fields
3. Check form submission method
4. Note if clickId is captured from URL

**Document:**
- Where form submits currently
- What fields are captured
- How clickId is handled

---

### [ ] 3.2 Update Form to Send to CRM
**Goal:** Make form POST data to CRM API

**Steps:**
1. Add hidden field for clickId:
   ```html
   <input type="hidden" name="clickId" id="clickId">
   ```

2. Add JavaScript to capture clickId from URL:
   ```javascript
   // Get clickId from URL parameter
   const urlParams = new URLSearchParams(window.location.search);
   const clickId = urlParams.get('clickid') || urlParams.get('click_id');
   document.getElementById('clickId').value = clickId;
   ```

3. Update form submission to POST to CRM:
   ```javascript
   form.addEventListener('submit', async (e) => {
     e.preventDefault();

     const formData = {
       clickId: document.getElementById('clickId').value,
       email: document.getElementById('email').value,
       phone: document.getElementById('phone').value,
       firstName: document.getElementById('firstName').value,
       lastName: document.getElementById('lastName').value,
       campaign: urlParams.get('campaign') || 'default'
     };

     const response = await fetch('https://your-crm.com/api/ingest/lead', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(formData)
     });

     if (response.ok) {
       // Redirect to casino
       window.location.href = 'https://rushbet.com/register';
     }
   });
   ```

**Success criteria:**
- ✅ Form captures clickId from URL
- ✅ Form submits to CRM API
- ✅ User redirected after submission

---

### [ ] 3.3 Test Form Submission
**Goal:** Verify form creates lead in CRM

**Steps:**
1. Open form in browser with clickId parameter:
   `http://localhost:8080/lead-form.html?clickid=FORM_TEST_001&campaign=test`
2. Fill out form with test data
3. Submit form
4. Check CRM:
   - Go to `/dashboard/leads`
   - Verify lead appears
   - Check customer profile has email/phone
5. Verify clickId linked correctly

**Success criteria:**
- ✅ Lead recorded in CRM
- ✅ Customer profile updated with email/phone
- ✅ Form redirects to casino after submit
- ✅ clickId captured correctly

---

## ✅ Phase 4: Configure Zapier Integration (1 hour)

### [ ] 4.1 Set Up Zapier Webhook Trigger
**Goal:** Create webhook to receive casino postbacks

**Steps:**
1. Log into Zapier
2. Create new Zap
3. Trigger: "Webhooks by Zapier"
4. Choose: "Catch Hook"
5. Copy webhook URL (e.g., `https://hooks.zapier.com/hooks/catch/123456/xyz789/`)
6. Give this URL to casino operators
7. Send test webhook to get sample data structure

**Document:**
- Zapier webhook URL
- Sample payload structure from casino

**Success criteria:**
- ✅ Zapier webhook created
- ✅ URL ready to share with casinos
- ✅ Test payload received

---

### [ ] 4.2 Configure Zapier to Forward to CRM
**Goal:** Make Zapier send postbacks to CRM

**Steps:**
1. In same Zap, add Action step
2. Action: "Webhooks by Zapier" → "POST"
3. URL: `https://your-crm.com/api/postback`
4. Method: POST
5. Data (map from trigger):
   ```json
   {
     "eventType": "deposit",
     "clickId": "{{clickId}}",
     "email": "{{email}}",
     "phone": "{{phone}}",
     "depositAmount": "{{amount}}",
     "currency": "{{currency}}",
     "operatorId": "{{operator}}",
     "userId": "{{userId}}"
   }
   ```
6. Header: `Content-Type: application/json`
7. Test the action
8. Turn on Zap

**Success criteria:**
- ✅ Zapier forwards to CRM successfully
- ✅ Field mapping correct
- ✅ Zap turned on

---

### [ ] 4.3 Test Full Conversion Flow
**Goal:** Simulate real casino deposit

**Steps:**
1. Send test postback to Zapier webhook:
   ```bash
   curl -X POST https://hooks.zapier.com/hooks/catch/123456/xyz789/ \
     -H "Content-Type: application/json" \
     -d '{
       "event": "deposit",
       "clickId": "FORM_TEST_001",
       "email": "testuser@example.com",
       "amount": 100,
       "currency": "USD",
       "operator": "rushbet",
       "userId": "rush_12345"
     }'
   ```

2. Wait 5-10 seconds
3. Check Zapier dashboard:
   - Verify Zap ran successfully
   - Check it forwarded to CRM
4. Check CRM:
   - Customer journey updated?
   - Stage changed?
   - Revenue recorded?

**Success criteria:**
- ✅ Zapier receives postback
- ✅ Zapier forwards to CRM
- ✅ CRM processes correctly
- ✅ Journey stage updates
- ✅ Messages reschedule

---

## ✅ Phase 5: Message Sending Setup (3 hours)

### [ ] 5.1 Choose Email Provider
**Goal:** Sign up for email service

**Options:**
- **Postmark** (recommended - easy, reliable)
- SendGrid
- Mailgun
- Amazon SES

**Steps:**
1. Sign up for Postmark
2. Verify domain
3. Get API key
4. Add to `.env`:
   ```
   EMAIL_PROVIDER=postmark
   POSTMARK_API_KEY=your_key_here
   DEFAULT_FROM_EMAIL=noreply@yourdomain.com
   ```

**Success criteria:**
- ✅ Account created
- ✅ Domain verified
- ✅ API key obtained
- ✅ Added to .env

---

### [ ] 5.2 Choose SMS Provider
**Goal:** Sign up for SMS service

**Options:**
- **Laaffic** (you mentioned this)
- Twilio
- Vonage

**Steps:**
1. Sign up for Laaffic
2. Get API credentials
3. Configure sender ID
4. Add to `.env`:
   ```
   SMS_PROVIDER=laaffic
   LAAFFIC_API_KEY=your_key_here
   LAAFFIC_SENDER_ID=YourBrand
   ```

**Success criteria:**
- ✅ Account created
- ✅ API credentials obtained
- ✅ Sender ID configured
- ✅ Added to .env

---

### [ ] 5.3 Update Email Provider Code
**Goal:** Make email provider use real API

**File:** `/crm-system/src/lib/messaging/email-provider.ts`

**Steps:**
1. Install Postmark package:
   ```bash
   cd crm-system
   npm install postmark
   ```

2. Update `send()` method to call real API
3. Keep mock as fallback for development
4. Add error handling
5. Log all sends

**Test:**
```bash
# Test email send
curl -X POST http://localhost:3005/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello from CRM!</h1>"
  }'
```

**Success criteria:**
- ✅ Real email received
- ✅ Fallback to mock works if no API key
- ✅ Errors logged properly

---

### [ ] 5.4 Update SMS Provider Code
**Goal:** Make SMS provider use real API

**File:** `/crm-system/src/lib/messaging/sms-provider.ts`

**Steps:**
1. Update `send()` method to call Laaffic API
2. Keep mock as fallback
3. Add error handling
4. Log all sends

**Test:**
```bash
# Test SMS send
curl -X POST http://localhost:3005/api/test/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+51999888777",
    "message": "Test SMS from CRM"
  }'
```

**Success criteria:**
- ✅ Real SMS received
- ✅ Fallback to mock works
- ✅ Errors logged properly

---

### [ ] 5.5 Set Up Message Processing Cron Job
**Goal:** Auto-send scheduled messages every 5 minutes

**For local testing:**
1. Manually trigger:
   ```bash
   curl http://localhost:3005/api/cron/process-messages
   ```
2. Check messages get sent
3. Verify status updates from PENDING → SENT

**For production (Vercel):**
1. Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/process-messages",
       "schedule": "*/5 * * * *"
     }]
   }
   ```

**For production (Render):**
1. Go to Render dashboard
2. Add Cron Job
3. Command: `curl https://your-crm.com/api/cron/process-messages`
4. Schedule: `*/5 * * * *`

**Success criteria:**
- ✅ Manual trigger works
- ✅ Messages send successfully
- ✅ Cron job configured for production
- ✅ Runs every 5 minutes

---

## ✅ Phase 6: End-to-End Testing (2 hours)

### [ ] 6.1 Test Complete Flow - Acquisition Journey
**Goal:** Test full user journey from click to deposit

**Scenario: New user through Carlos Gaming**

1. **Generate click through Redtrack:**
   - Create tracking link in Redtrack
   - Click it (or simulate)
   - Verify appears in CRM `/dashboard/clicks`

2. **Fill lead form:**
   - Open landing page with clickId parameter
   - Fill form with test email
   - Submit
   - Verify lead in `/dashboard/leads`

3. **Check journey started:**
   - Find customer in `/dashboard/customers`
   - Verify stage: -1
   - Verify journey type: "acquisition"
   - Check welcome message scheduled

4. **Manually process messages:**
   ```bash
   curl http://localhost:3005/api/cron/process-messages
   ```
   - Check email sent
   - Verify message status: SENT

5. **Simulate deposit:**
   - Send postback through Zapier (or direct to CRM)
   - Verify stage changes to 1
   - Verify journey switches to "retention"
   - Check retention messages scheduled

6. **Process retention messages:**
   ```bash
   curl http://localhost:3005/api/cron/process-messages
   ```
   - Verify "thank you" email sent

**Success criteria:**
- ✅ Click tracked
- ✅ Lead captured
- ✅ Journey automated correctly
- ✅ Messages sent at right times
- ✅ Stage progression works
- ✅ Journey type switches

---

### [ ] 6.2 Test Multi-Brand Segmentation
**Goal:** Verify same customer can have different journeys per brand

**Scenario: User clicks links for both Rushbet and Roobet**

1. **Click Rushbet link:**
   - Generate click with `operatorId: rushbet`
   - Verify customer created with Rushbet journey

2. **Click Roobet link (same user):**
   - Use SAME email but `operatorId: roobet`
   - Verify SAME customer but NEW journey state

3. **Deposit on Rushbet only:**
   - Send postback with `operatorId: rushbet`
   - Verify Rushbet journey → stage 1
   - Verify Roobet journey → still stage -1

4. **Check messages:**
   - Rushbet: Retention messages
   - Roobet: Still acquisition messages

**Success criteria:**
- ✅ One customer, two journey states
- ✅ Each journey independent
- ✅ Messages segmented by brand
- ✅ No cross-contamination

---

### [ ] 6.3 Test Influencer Attribution
**Goal:** Verify conversions credit correct influencer

**Scenario:**

1. **Create test influencer:**
   - Go to `/dashboard/influencers`
   - Create "Test Influencer"
   - Note ID

2. **Create test campaign:**
   - Go to `/dashboard/campaigns`
   - Create campaign linked to test influencer

3. **Send click with influencer tracking:**
   ```bash
   curl -X POST http://localhost:3005/api/ingest/click \
     -H "Content-Type: application/json" \
     -d '{
       "clickId": "ATTR_TEST_001",
       "campaign": "test-campaign",
       "influencerId": "test-influencer-id",
       "source": "youtube",
       "medium": "video"
     }'
   ```

4. **Send lead + deposit**
5. **Check influencer stats:**
   - Go to influencer profile
   - Verify stats updated:
     - +1 click
     - +1 lead
     - +1 conversion
     - +revenue

**Success criteria:**
- ✅ Click attributed to influencer
- ✅ Conversion credited correctly
- ✅ Revenue tracked
- ✅ Stats update in real-time

---

### [ ] 6.4 Test Identity Graph
**Goal:** Verify system links all identifiers to one person

**Scenario: User uses multiple devices/emails**

1. **First click from mobile:**
   ```json
   {
     "clickId": "IDENTITY_001",
     "deviceId": "device_mobile_123",
     "ip": "192.168.1.100"
   }
   ```

2. **Second click from desktop:**
   ```json
   {
     "clickId": "IDENTITY_002",
     "deviceId": "device_desktop_456",
     "email": "user@example.com"
   }
   ```

3. **Lead submission:**
   ```json
   {
     "clickId": "IDENTITY_001",
     "email": "user@example.com",
     "phone": "+51999888777"
   }
   ```

4. **Check customer profile:**
   - Should have ONE customer
   - Identifiers:
     - ✅ 2 click IDs
     - ✅ 2 device IDs
     - ✅ 1 email
     - ✅ 1 phone
   - All linked to same profile

**Success criteria:**
- ✅ No duplicate profiles created
- ✅ All identifiers linked correctly
- ✅ Activity from all devices shows in one timeline

---

### [ ] 6.5 Test Message Templates
**Goal:** Verify custom templates work per brand

**Steps:**
1. Go to `/dashboard/message-templates`
2. Create custom template for Rushbet:
   - Journey: Acquisition
   - Stage: 0 (welcome)
   - Channel: Email
   - Content: Custom message with {firstName}

3. Trigger journey that uses this template
4. Process messages
5. Verify email uses custom template
6. Check personalization works ({firstName} replaced)

**Success criteria:**
- ✅ Custom template saved
- ✅ Used in journey automation
- ✅ Personalization works
- ✅ Brand-specific content sent

---

## ✅ Phase 7: Production Deployment (2 hours)

### [ ] 7.1 Prepare Environment Variables
**Goal:** Set all required env vars for production

**Create production `.env`:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth
NEXTAUTH_URL=https://crm.yourdomain.com
NEXTAUTH_SECRET=your_secret_here
JWT_SECRET=your_jwt_secret_here

# Email
EMAIL_PROVIDER=postmark
POSTMARK_API_KEY=your_production_key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# SMS
SMS_PROVIDER=laaffic
LAAFFIC_API_KEY=your_production_key
LAAFFIC_SENDER_ID=YourBrand

# Cron Security
CRON_SECRET=random_secret_here

# Feature Flags
ENABLE_REAL_SENDING=true
```

**Success criteria:**
- ✅ All variables documented
- ✅ Production keys obtained
- ✅ Secrets generated

---

### [ ] 7.2 Deploy to Production
**Goal:** Get CRM running on production server

**Options:**
- Vercel (easiest)
- Render
- Railway
- AWS/DigitalOcean

**Steps (Vercel):**
1. Install Vercel CLI: `npm i -g vercel`
2. In crm-system folder: `vercel`
3. Follow prompts
4. Set environment variables in Vercel dashboard
5. Deploy: `vercel --prod`
6. Note production URL

**Success criteria:**
- ✅ CRM accessible at production URL
- ✅ All pages load correctly
- ✅ Database connected
- ✅ API endpoints work

---

### [ ] 7.3 Update Redtrack with Production URL
**Goal:** Point Redtrack to production CRM

**Steps:**
1. Go to Redtrack settings
2. Update postback URL from ngrok to production:
   `https://crm.yourdomain.com/api/ingest/click`
3. Test with real click
4. Verify appears in production CRM

**Success criteria:**
- ✅ Redtrack points to production
- ✅ Clicks flow to production CRM
- ✅ No errors

---

### [ ] 7.4 Update Zapier with Production URL
**Goal:** Point Zapier to production CRM

**Steps:**
1. Go to Zapier dashboard
2. Edit existing Zap
3. Update action URL:
   `https://crm.yourdomain.com/api/postback`
4. Test Zap
5. Turn on

**Success criteria:**
- ✅ Zapier points to production
- ✅ Postbacks reach production CRM
- ✅ Conversions process correctly

---

### [ ] 7.5 Set Up Production Cron Job
**Goal:** Auto-send messages in production

**Vercel:**
- Already set in `vercel.json` (from Phase 5.5)
- Verify cron runs: Check Vercel logs

**Render:**
1. Add Cron Job in dashboard
2. URL: `https://crm.yourdomain.com/api/cron/process-messages`
3. Schedule: `*/5 * * * *`
4. Add header: `Authorization: Bearer ${CRON_SECRET}`

**Success criteria:**
- ✅ Cron job configured
- ✅ Runs every 5 minutes
- ✅ Messages send automatically
- ✅ Logs show successful runs

---

### [ ] 7.6 Update Landing Page Forms
**Goal:** Point forms to production

**Steps:**
1. Update form POST URL in all landing pages
2. Change from localhost to production:
   `https://crm.yourdomain.com/api/ingest/lead`
3. Deploy updated forms
4. Test submission

**Success criteria:**
- ✅ Forms point to production
- ✅ Submissions work
- ✅ Leads appear in CRM

---

### [ ] 7.7 Give Postback URL to Casino Operators
**Goal:** Enable real conversion tracking

**Steps:**
1. Document your postback URL:
   `https://crm.yourdomain.com/api/postback`

2. Create integration doc for operators:
   ```
   POST https://crm.yourdomain.com/api/postback

   Required fields:
   - eventType: "registration" | "deposit" | "ftd"
   - clickId: Click ID from tracking link
   - email: User's email
   - depositAmount: Amount (for deposits)
   - currency: Currency code
   - operatorId: Your operator ID (rushbet/roobet/stake)
   - userId: Your internal user ID
   ```

3. Send to each casino operator
4. Request test postback from each
5. Verify test postbacks work

**Success criteria:**
- ✅ Documentation sent to operators
- ✅ Test postbacks received
- ✅ All operators integrated

---

## ✅ Phase 8: Monitoring & Optimization (Ongoing)

### [ ] 8.1 Set Up Logging
**Goal:** Track all important events

**Add logging for:**
- All API requests
- Message sends (success/failure)
- Journey state changes
- Postback receipts
- Errors

**Success criteria:**
- ✅ Logs accessible
- ✅ Can debug issues
- ✅ Performance tracked

---

### [ ] 8.2 Create Monitoring Dashboard
**Goal:** Quick health check

**Metrics to track:**
- API response times
- Message delivery rate
- Conversion rate
- Active journeys
- Error rate

**Success criteria:**
- ✅ Dashboard shows key metrics
- ✅ Alerts for issues
- ✅ Daily reports

---

### [ ] 8.3 Test at Scale
**Goal:** Ensure system handles real volume

**Steps:**
1. Monitor first 100 real users
2. Check for bottlenecks
3. Optimize slow queries
4. Adjust message frequency if needed

**Success criteria:**
- ✅ No performance issues
- ✅ All messages send on time
- ✅ Data accurate

---

## 📊 Testing Checklist

Before going live, verify:

- [ ] Real click from Redtrack → CRM works
- [ ] Form submission → CRM works
- [ ] Casino postback → Zapier → CRM works
- [ ] Messages schedule correctly
- [ ] Messages send via real email/SMS
- [ ] Journey stages progress
- [ ] Identity graph links correctly
- [ ] Multi-brand segmentation works
- [ ] Influencer attribution accurate
- [ ] All dashboard pages show real data
- [ ] Export functions work
- [ ] No duplicate customers created
- [ ] Message personalization works
- [ ] Frequency caps enforced
- [ ] Unsubscribe links work
- [ ] Production cron job runs
- [ ] All API endpoints respond
- [ ] Error handling works
- [ ] Logs are clean

---

## 🎯 Priority Order

**Week 1:**
- Phase 1: Test existing APIs (CRITICAL)
- Phase 2: Redtrack integration (CRITICAL)
- Phase 3: Landing page forms (CRITICAL)

**Week 2:**
- Phase 4: Zapier integration (CRITICAL)
- Phase 5: Message sending (HIGH)
- Phase 6: End-to-end testing (HIGH)

**Week 3:**
- Phase 7: Production deployment (MEDIUM)
- Phase 8: Monitoring setup (LOW)

---

## 📝 Notes

- Test each phase thoroughly before moving to next
- Keep detailed notes of what works/doesn't work
- Document any API changes needed
- Save all test data for debugging
- Take screenshots of successful tests

**Start with Phase 1, Task 1.1** 👇
