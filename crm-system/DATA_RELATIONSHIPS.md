# Data Relationships & Attribution Flow

This document explains how all data in the CRM system is linked together and how to verify the complete attribution chain.

## 🔗 Entity Relationships

### Core Data Flow
```
Click ID → Customer → Lead → Event (Registration/Deposit)
    ↓
Campaign ← Influencer → Short Link
    ↓
Brand/Operator → Client
```

## 📊 Test Data Overview

### Customers with Complete Attribution

#### 1. Diego Rodriguez (Full Conversion)
- **Click ID**: `CLK_1759665718350_001`
- **Source**: Instagram → Carlos Gaming (Influencer)
- **Campaign**: VIP Reload
- **Brand**: Roobet
- **Journey**:
  - Click tracked with session ID
  - Lead submitted
  - Registered
  - First deposit: $278.03

**Test in UI**:
1. Go to `/dashboard/customers` → Search "Diego"
2. Click VIEW → See all events, click ID, influencer
3. Go to `/dashboard/influencers` → Click Carlos Gaming → See Diego in conversions
4. Go to `/dashboard/campaigns` → VIP Reload → See Diego's conversion
5. Go to `/dashboard/events` → See deposit with click ID attribution

#### 2. Miguel Garcia (Lead Only)
- **Click ID**: `CLK_1759665718363_002`
- **Source**: TikTok → Maria Casino (Influencer)
- **Campaign**: Summer Promo
- **Brand**: Roobet
- **Journey**:
  - Click tracked
  - Lead submitted
  - No conversion yet

**Test in UI**:
1. Go to `/dashboard/customers` → Search "Miguel"
2. See lead but no events
3. Go to `/dashboard/influencers` → Maria Casino → See Miguel in leads
4. Go to `/dashboard/campaigns` → Summer Promo → See lead

#### 3. Sofia Lopez (Multiple Deposits)
- **Click ID**: `CLK_1759665718367_003`
- **Source**: Instagram → Carlos Gaming (Influencer)
- **Campaign**: Peru Launch
- **Brand**: Rushbet
- **Journey**:
  - Click tracked
  - Lead submitted
  - Registered
  - First deposit: $200
  - Second deposit: $250

**Test in UI**:
1. Go to `/dashboard/customers` → Search "Sofia"
2. See $450 total revenue, multiple deposits
3. Go to `/dashboard/brands` → Rushbet → See Sofia
4. Go to `/dashboard/events` → Filter by Peru Launch → See both deposits

## 🎯 Campaign-Influencer Relationships

### VIP Reload Campaign
- **Influencer**: Carlos Gaming (@carlosgaming)
- **Platform**: Instagram
- **Short Link**: `rb.link/vip-carlos`
- **Conversions**: Diego Rodriguez

### Summer Promo Campaign
- **Influencer**: Maria Casino (@mariacasino)
- **Platform**: TikTok
- **Short Link**: `rb.link/summer-maria`
- **Leads**: Miguel Garcia

### Peru Launch Campaign
- **Influencer**: Carlos Gaming (@carlosgaming)
- **Platform**: Instagram
- **Conversions**: Sofia Lopez

## 🔍 How to Verify Data Relationships

### 1. Click ID Attribution Chain
```bash
# Run this SQL to see complete attribution for Diego
SELECT
  c.clickId,
  cust.firstName,
  cust.lastName,
  l.campaign as lead_campaign,
  e.eventType,
  e.value
FROM Click c
JOIN Customer cust ON c.customerId = cust.id
LEFT JOIN Lead l ON l.clickId = c.clickId
LEFT JOIN Event e ON e.clickId = c.clickId
WHERE c.clickId = 'CLK_1759665718350_001';
```

### 2. Influencer Performance
Check influencer stats are accurate:
- Carlos Gaming: 2 clicks, 2 leads, 2 registrations, 2 FTD
- Maria Casino: 1 click, 1 lead, 0 registrations, 0 FTD

### 3. Campaign Performance
- VIP Reload: 1 click, 1 lead, 2 events, $278.03 revenue
- Summer Promo: 1 click, 1 lead, 0 events
- Peru Launch: 1 click, 1 lead, 3 events, $450 revenue

## 📱 UI Testing Checklist

### Customer Page
- [x] Shows correct click ID
- [x] Links to campaign
- [x] Links to influencer
- [x] Shows all events
- [x] Displays proper brand/operator

### Influencer Page
- [x] Shows assigned campaigns
- [x] Lists all customers from their links
- [x] Accurate click/lead/conversion counts
- [x] Shows proper attribution

### Campaign Page
- [x] Lists assigned influencers
- [x] Shows all customers
- [x] Accurate statistics
- [x] Links to brand

### Brand/Operator Page
- [x] Shows all customers
- [x] Lists campaigns
- [x] Accurate revenue totals

### Events/Conversions Page
- [x] Shows click ID
- [x] Links to customer
- [x] Links to influencer (if applicable)
- [x] Shows campaign attribution

## 🔄 Data Synchronization

All updates should cascade properly:

1. **Customer Event** → Updates:
   - Customer total revenue
   - Campaign total revenue/events
   - Influencer stats (if attributed)
   - Brand/Operator stats

2. **Campaign-Influencer Assignment** → Updates:
   - Influencer's campaign list
   - Campaign's influencer list

3. **Link-Influencer Assignment** → Updates:
   - Short link tracking
   - Influencer attribution for clicks

## 🚀 Running the Seed

To regenerate this data structure:

```bash
npx tsx prisma/seed-comprehensive.ts
```

This will:
1. Clean all existing data
2. Create brands, campaigns, influencers
3. Link them via junction tables
4. Create customers with full attribution chains
5. Update all statistics

## 📝 Notes

- All click IDs follow pattern: `CLK_[timestamp]_[sequence]`
- Session IDs follow: `SES_[timestamp]_[sequence]`
- All data properly linked via foreign keys
- Junction tables maintain many-to-many relationships
- Statistics are calculated and stored for performance
