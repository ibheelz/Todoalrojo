# 🔗 Integration Guide - Redtrack & Zapier

This guide shows how to integrate your CRM with Redtrack (click tracking) and Zapier (conversion postbacks).

## 📍 Production URLs

Your CRM is deployed at:
```
https://crm-system-5nlaj3rtm-miela-digitals-projects.vercel.app
```

**Dashboard:**
```
https://crm-system-5nlaj3rtm-miela-digitals-projects.vercel.app/dashboard
```

**Login:**
- Email: `abiola@mieladigital.com`
- Password: `admin123`

---

## 🎯 Redtrack Integration

### Step 1: Configure Click Postback in Redtrack

In your Redtrack campaign settings, configure the postback URL:

**Postback URL:**
```
https://crm-system-5nlaj3rtm-miela-digitals-projects.vercel.app/api/ingest/click
```

**Method:** `POST`

**Content-Type:** `application/json`

**Payload:**
```json
{
  "clickId": "{clickid}",
  "ip": "{ip}",
  "userAgent": "{useragent}",
  "campaign": "{campaign}",
  "source": "{source}",
  "medium": "{medium}",
  "landingPage": "{landingpage}",
  "operatorId": "rushbet"
}
```

**Redtrack Tokens:**
- `{clickid}` - Unique click identifier
- `{ip}` - User's IP address
- `{useragent}` - Browser user agent
- `{campaign}` - Campaign name
- `{source}` - Traffic source
- `{medium}` - Traffic medium
- `{landingpage}` - Landing page URL

**Important:**
- Replace `"rushbet"` with your actual operator ID (`rushbet`, `roobet`, `stake`, etc.)
- The `operatorId` field triggers automatic journey creation for new users

### Step 2: Test Redtrack Integration

Send a test postback from Redtrack, or use curl:

```bash
curl -X POST https://crm-system-5nlaj3rtm-miela-digitals-projects.vercel.app/api/ingest/click \
  -H "Content-Type: application/json" \
  -d '{
    "clickId": "TEST_CLICK_001",
    "ip": "190.12.34.56",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "campaign": "summer-promo",
    "source": "google",
    "medium": "cpc",
    "landingPage": "https://rushbet.com/landing",
    "operatorId": "rushbet"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "clickId": "cmgfinq3z0005k2ohec89c7iv",
  "userId": "cmgfinmu00000k2ohaohs1zy0",
  "journeyStarted": false,
  "message": "Click tracked successfully"
}
```

---

## 📝 Lead Capture Integration

If you have custom forms or landing pages that capture leads:

**Endpoint:**
```
https://crm-system-5nlaj3rtm-miela-digitals-projects.vercel.app/api/ingest/lead
```

**Method:** `POST`

**Payload:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+51999888777",
  "campaign": "summer-promo",
  "ip": "190.12.34.56",
  "operatorId": "rushbet",
  "value": 100
}
```

**Response:**
```json
{
  "success": true,
  "leadId": "cmgfio27i0007k2ohys9dn5ln",
  "customerId": "cmgfinmu00000k2ohaohs1zy0",
  "isDuplicate": false,
  "qualityScore": 100,
  "journeyStarted": true,
  "message": "Lead captured successfully"
}
```

---

## 🔄 Zapier Integration (Conversion Postbacks)

### Step 1: Configure Zapier Webhook

In your existing system (the one that receives conversions), set up a Zapier webhook to forward conversions to your CRM.

**Trigger:** When conversion happens in your existing system

**Action:** Webhooks by Zapier - POST

**URL:**
```
https://crm-system-5nlaj3rtm-miela-digitals-projects.vercel.app/api/postback
```

**Method:** `POST`

**Content-Type:** `application/json`

**Payload:**
```json
{
  "clickid": "{{clickId}}",
  "email": "{{customerEmail}}",
  "type": "{{conversionType}}",
  "value": {{amount}},
  "transactionId": "{{transactionId}}",
  "operatorId": "{{operatorId}}"
}
```

### Step 2: Conversion Types

The CRM recognizes these conversion types:

| Type | Description | Journey Impact |
|------|-------------|----------------|
| `ftd` | First Time Deposit | Moves customer from acquisition → retention |
| `deposit` | Regular Deposit | Increments deposit count |
| `lead` | Lead/Registration | Creates customer profile |
| `qualified` | Qualified Lead | Updates lead quality |

**Auto-Journey Trigger:**
When a conversion type contains `deposit` or `ftd`, the CRM will:
1. Update the customer's journey stage
2. Cancel pending acquisition messages
3. Start the retention journey automatically

### Step 3: Test Zapier Integration

```bash
curl -X POST https://crm-system-5nlaj3rtm-miela-digitals-projects.vercel.app/api/postback \
  -H "Content-Type: application/json" \
  -d '{
    "clickid": "TEST_CLICK_001",
    "email": "test@todoalrojo.com",
    "type": "ftd",
    "value": 50,
    "transactionId": "TXN_001",
    "operatorId": "rushbet"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "eventId": "cmgfiogfw0009k2ohka0hdast",
  "customerId": "cmgfinmu00000k2ohaohs1zy0",
  "conversionType": "ftd",
  "status": "approved",
  "value": 50,
  "campaign": "summer-promo",
  "source": "google",
  "processingTime": 3759,
  "zapierForwarded": true,
  "message": "Conversion tracked successfully and forwarded to Zapier"
}
```

---

## 🎭 Identity Graph - How It Works

The CRM automatically links all user identifiers to create a single master profile:

### Scenario 1: User Journey
```
1. Click → CRM creates profile with IP + Device ID
2. Lead Form → CRM links email + phone to same profile
3. Deposit → CRM links transaction to same profile
```

### Scenario 2: Multi-Device User
```
1. User clicks on mobile (IP: 1.2.3.4)
2. User fills form on desktop (IP: 5.6.7.8, email: user@example.com)
3. CRM links both IPs to same profile via email
```

### Supported Identifiers
- Email address (primary)
- Phone number (primary)
- Click ID
- IP address
- Device ID
- Browser fingerprint
- User agent

---

## 🚀 Journey Automation

### How Journeys Work

**Acquisition Journey** (Stage 0):
- Triggered when: Click or lead captured with `operatorId`
- Messages: Welcome emails/SMS, bonus offers, deposit reminders
- Duration: Until first deposit (FTD)

**Retention Journey** (Stage 1+):
- Triggered when: First deposit received
- Messages: Loyalty rewards, re-engagement campaigns
- Duration: Ongoing

### Message Scheduling

Messages are automatically scheduled based on the journey configuration:

```
Day 0: Welcome email (immediate)
Day 1: Bonus offer SMS (+24 hours)
Day 3: Deposit reminder email (+72 hours)
Day 7: Last chance offer SMS (+168 hours)
```

Messages are processed every 5 minutes by Vercel Cron Job.

---

## 📊 Dashboard Features

### View Customer Profiles
```
https://crm-system-5nlaj3rtm-miela-digitals-projects.vercel.app/dashboard/customers
```

See all customer profiles with:
- Identity graph (all linked identifiers)
- Journey timeline
- Message history
- Conversion events

### View Campaigns
```
https://crm-system-5nlaj3rtm-miela-digitals-projects.vercel.app/dashboard/campaigns
```

Track campaign performance:
- Clicks, leads, conversions
- Revenue by campaign
- Conversion rates
- ROI metrics

### View Links
```
https://crm-system-5nlaj3rtm-miela-digitals-projects.vercel.app/dashboard/links
```

Monitor tracking links:
- Click counts
- Unique visitors
- Conversion tracking
- Link performance

---

## 🔐 Security

### CRON_SECRET

The cron job endpoint (`/api/cron/process-messages`) is protected with a secret:

```bash
Authorization: Bearer hREcE2ftRlXHsggmtsoE9ROMzPQNXZQ2Vpdq3TEfvS0=
```

This is automatically handled by Vercel Cron. Do not expose this secret.

### API Endpoints

All API endpoints are publicly accessible for webhook integration:
- `/api/ingest/click` - Click tracking
- `/api/ingest/lead` - Lead capture
- `/api/postback` - Conversion postbacks

**No authentication required** for these endpoints to allow Redtrack and Zapier integration.

---

## 🛠 Troubleshooting

### Issue: Clicks not showing in dashboard

**Solution:**
1. Check Redtrack postback logs for errors
2. Verify the payload format matches the API schema
3. Test with curl to isolate the issue

### Issue: Journey not starting automatically

**Solution:**
1. Ensure `operatorId` is provided in click/lead payload
2. Check that the operator exists in your CRM database
3. Verify customer has email or phone number

### Issue: Conversions not updating journey stage

**Solution:**
1. Ensure conversion `type` includes "deposit" or "ftd"
2. Verify `clickid` matches original click tracking
3. Check that customer email or clickId exists in system

### Issue: Messages not sending

**Solution:**
1. Check Vercel deployment logs for cron job execution
2. Verify Postmark and Laaffic credentials in environment variables
3. Ensure customers have valid email/phone numbers
4. Check message status in database (should be PENDING → SENT)

---

## 📞 Support

For questions or issues:
- Check deployment logs in Vercel dashboard
- Review error logs in `/api/health` endpoint
- Contact: abiola@mieladigital.com

---

## 🎉 Next Steps

1. ✅ Configure Redtrack click postback
2. ✅ Set up Zapier conversion webhook
3. ✅ Test full flow (click → lead → deposit)
4. ✅ Monitor dashboard for incoming data
5. ✅ Review journey automation messages
6. ✅ Analyze campaign performance

Your production CRM is ready to track, segment, and engage customers across multiple brands!
