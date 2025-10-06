# Redtrack Integration Setup Guide

## Overview

Your CRM receives data from Redtrack in two ways:
1. **Clicks** - Real-time via postback URL
2. **Conversions** - Synced every 1 minute via API

## 1. Configure Click Tracking (Postback URL)

### In Redtrack Dashboard:

1. Go to **Traffic Sources** or **Campaign Settings**
2. Find the **Postback URL** or **S2S Postback** field
3. Add this URL:

```
https://crm-system-4moj359bc-miela-digitals-projects.vercel.app/api/ingest/click?sub1={clickid}&campaign={campaign}&source={source}&ip={ip}
```

### Required Parameters:
- `sub1={clickid}` - Redtrack's click ID (REQUIRED)
- `campaign={campaign}` - Campaign name
- `source={source}` - Traffic source
- `ip={ip}` - User IP address

### Optional Parameters:
You can add more for better tracking:
- `sub2={subid2}` - Additional sub ID
- `sub3={subid3}` - Additional sub ID
- `sub4={subid4}` - Additional sub ID
- `medium={medium}` - Traffic medium

### Example Full URL:
```
https://crm-system-4moj359bc-miela-digitals-projects.vercel.app/api/ingest/click?sub1={clickid}&campaign={campaign}&source={source}&ip={ip}&medium={medium}&sub2={subid2}
```

## 2. Verify Click Tracking Works

Test with a manual request:

```bash
curl "https://crm-system-4moj359bc-miela-digitals-projects.vercel.app/api/ingest/click?sub1=TEST_CLICK_123&campaign=test&source=facebook&ip=8.8.8.8"
```

You should get a response like:
```json
{
  "success": true,
  "clickId": "...",
  "userId": "...",
  "message": "Click tracked successfully"
}
```

## 3. Conversion Sync (Already Configured)

The CRM automatically syncs conversions from Redtrack API every 1 minute.

### What It Does:
- Fetches new conversions from Redtrack
- Links them to customers via click ID
- Updates customer revenue and event counts
- No configuration needed on your end!

### API Details:
- **Endpoint**: `https://api.redtrack.io/conversions`
- **Auth**: Uses your Redtrack API key from environment variables
- **Schedule**: Every 1 minute (via external cron service)

## 4. Set Up External Cron Service

Since Vercel free tier doesn't support frequent cron jobs, use an external service:

### Option A: Cron-job.org (Free)

1. Go to https://cron-job.org
2. Create account
3. Add new cron job:
   - **URL**: `https://crm-system-4moj359bc-miela-digitals-projects.vercel.app/api/cron/sync-redtrack`
   - **Schedule**: Every 1 minute (`* * * * *`)
   - **Request Method**: GET
   - **Headers**:
     ```
     Authorization: Bearer hREcE2ftRlXHsggmtsoE9ROMzPQNXZQ2Vpdq3TEfvS0=
     ```

### Option B: EasyCron (Free tier available)

1. Go to https://www.easycron.com
2. Create account
3. Add cron job with same settings as above

### Option C: Run Locally (For Testing)

Run the trigger script on your machine:

```bash
cd /Users/bheelz/Desktop/Todoalrojo/crm-system
npx tsx trigger-redtrack-sync.ts
```

This will trigger syncs every minute while running.

## 5. Verify Everything Works

### Test Flow:

1. **Test Click Tracking**:
   ```bash
   curl "https://crm-system-4moj359bc-miela-digitals-projects.vercel.app/api/ingest/click?sub1=PROD_TEST_001&campaign=prod-test&source=manual&ip=1.2.3.4"
   ```

2. **Trigger Conversion Sync**:
   ```bash
   curl -X GET "https://crm-system-4moj359bc-miela-digitals-projects.vercel.app/api/cron/sync-redtrack" \
     -H "Authorization: Bearer hREcE2ftRlXHsggmtsoE9ROMzPQNXZQ2Vpdq3TEfvS0="
   ```

3. **Check Dashboard**:
   - Visit: https://crm-system-4moj359bc-miela-digitals-projects.vercel.app/dashboard/customers
   - You should see the new customer with the click

4. **Check Local Sync**:
   ```bash
   npm run sync:once
   ```
   - Data should appear in local database

## 6. Production Redtrack URLs

### Click Postback URL (set in Redtrack):
```
https://crm-system-4moj359bc-miela-digitals-projects.vercel.app/api/ingest/click?sub1={clickid}&campaign={campaign}&source={source}&ip={ip}
```

### Conversion Postback URL (for Zapier):
```
https://crm-system-4moj359bc-miela-digitals-projects.vercel.app/api/postback?clickid={clickid}&status=approved&type=Deposit&value={amount}
```

## 7. Redtrack Dynamic Tokens

Use these tokens in your Redtrack postback URLs:

- `{clickid}` - Unique click identifier
- `{campaign}` - Campaign name
- `{source}` - Traffic source
- `{ip}` - User IP address
- `{subid1}`, `{subid2}`, `{subid3}`, `{subid4}`, `{subid5}` - Custom sub IDs
- `{country}` - User country
- `{city}` - User city
- `{device}` - Device type
- `{os}` - Operating system
- `{browser}` - Browser name

## 8. Monitoring

### Check Sync Logs:

```bash
# On local machine
tail -f sync.log

# Check Vercel logs
vercel logs --follow
```

### Check Database:

```bash
# Open Prisma Studio
npm run db:studio

# Or check via SQL
npx prisma studio
```

## Troubleshooting

### Clicks Not Appearing?

1. Check Redtrack postback URL is correct
2. Test manually with curl
3. Check Vercel logs for errors
4. Verify click API endpoint is working

### Conversions Not Syncing?

1. Check cron service is running
2. Verify API key is correct in `.env.production`
3. Test conversion endpoint manually
4. Check Redtrack API is accessible

### Data Not in Local?

1. Check sync service is running: `ps aux | grep sync-production-to-local`
2. Check sync logs: `tail -f sync.log`
3. Run manual sync: `npm run sync:once`

## Summary

✅ **Clicks**: Real-time via Redtrack postback URL → `/api/ingest/click`
✅ **Conversions**: Every 1 minute via Redtrack API → `/api/cron/sync-redtrack`
✅ **Local Sync**: Every 5 minutes production → local
✅ **All Real Data**: No mock/fake data anywhere

Your CRM is now fully integrated with Redtrack and ready for production!
