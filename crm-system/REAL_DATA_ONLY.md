# CRM System - Real Redtrack Data Only

## ✅ System Status

**Both production and local databases are completely clean - NO fake/test data!**

All data will come ONLY from your real Redtrack campaigns.

---

## 📊 How Real Data Flows

### 1. **Clicks** (Real-time from Redtrack)

Every time someone clicks your campaign link in Redtrack, the data comes instantly to your CRM.

**Your Redtrack Postback URL:**
```
https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/api/ingest/click?sub1={clickid}&campaign={campaign}&source={source}&ip={ip}
```

**Where to add this:**
- In Redtrack Dashboard → Campaign Settings → Postback URL
- Or in Traffic Source Settings → S2S Postback

**What happens:**
1. User clicks your campaign link
2. Redtrack sends the click to your CRM instantly
3. CRM creates customer + click record
4. Data appears on your dashboard immediately

---

### 2. **Conversions** (Every 1 minute from Redtrack API)

The CRM automatically fetches conversions from Redtrack API every minute.

**What's running:**
- ✅ Cron service running in background (every 1 minute)
- ✅ Syncs conversions from Redtrack API
- ✅ Links conversions to customers via click ID
- ✅ Updates customer revenue and stats

**Check logs:**
```bash
tail -f redtrack-cron.log
```

---

### 3. **Local Sync** (Every 5 minutes from Production)

Your local database automatically syncs from production every 5 minutes.

**What's running:**
- ✅ Sync service running in background
- ✅ Pulls latest 100 customers, 200 clicks, 100 leads
- ✅ One-way sync (production → local only)

**Check logs:**
```bash
tail -f sync.log
```

---

## 🎯 What You Need to Do

### Step 1: Add Postback URL in Redtrack

1. Login to Redtrack
2. Go to your campaign settings
3. Find "Postback URL" or "S2S Postback" field
4. Paste this URL:
   ```
   https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/api/ingest/click?sub1={clickid}&campaign={campaign}&source={source}&ip={ip}
   ```
5. Save

### Step 2: Test It Works

Send a test click from Redtrack and check:

**Production Dashboard:**
```
https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/dashboard/customers
```

**Local Dashboard:**
```
http://localhost:3005/dashboard/customers
```

---

## 📁 Background Services Running

### On Your Machine:

1. **Local Dev Server** (port 3005)
   ```bash
   npm run dev
   ```

2. **Production → Local Sync** (every 5 minutes)
   ```bash
   # Check if running:
   ps aux | grep sync-production-to-local
   ```

3. **Redtrack Conversion Sync** (every 1 minute)
   ```bash
   # Check if running:
   ps aux | grep trigger-redtrack-sync
   ```

4. **Prisma Studio** (port 5555)
   ```bash
   npm run db:studio
   ```

---

## 🔍 Monitoring Real Data

### Watch Logs:

```bash
# Redtrack conversion sync
tail -f redtrack-cron.log

# Production to local sync
tail -f sync.log

# Vercel production logs
vercel logs --follow
```

### Check Databases:

```bash
# Local database
npm run db:studio

# Or view directly
open http://localhost:5555
```

### Check Dashboards:

**Production:**
- Customers: https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/dashboard/customers
- Campaigns: https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/dashboard/campaigns
- Clicks: https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/dashboard/clicks

**Local:**
- Customers: http://localhost:3005/dashboard/customers
- Campaigns: http://localhost:3005/dashboard/campaigns
- Clicks: http://localhost:3005/dashboard/clicks

---

## ❌ No Fake Data

**What was removed:**
- ✅ All test customers deleted
- ✅ All test clicks deleted
- ✅ All test campaigns deleted
- ✅ All test leads deleted
- ✅ All mock data scripts deleted

**What will populate:**
- ✅ Real clicks from Redtrack only
- ✅ Real conversions from Redtrack API only
- ✅ Real customer data from actual campaigns only

---

## 📞 Real Data Sources

### Clicks Come From:
- ✅ Redtrack postback URL (real-time)
- ❌ NO fake/test data
- ❌ NO manually created clicks

### Conversions Come From:
- ✅ Redtrack API sync (every 1 minute)
- ✅ Zapier postbacks (if configured)
- ❌ NO fake/test conversions

### Campaigns, Leads, Events:
- ✅ Created automatically from real Redtrack data
- ❌ NO manually created data

---

## 🚀 Next Steps

1. **Add postback URL to Redtrack** (see Step 1 above)
2. **Run a real campaign** with Redtrack
3. **Watch data flow** into your CRM dashboards
4. **Verify everything works** with real traffic

Your CRM is now 100% production-ready with ZERO fake data!

All data will come ONLY from your real Redtrack campaigns.
