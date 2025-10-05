# 🎮 CRM System - Complete User Guide

## 🚀 Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the demo page:**
   Navigate to: `http://localhost:3005/dashboard/demo`

3. **Seed mock data (FIRST TIME ONLY):**
   - Click "Seed database with realistic mock data" button
   - Wait for confirmation
   - Now explore all pages!

## 📍 All Available Pages

### Main Dashboard Pages

#### 1. **Demo & Testing** (`/dashboard/demo`)
- **Purpose:** Central hub for testing all functionality
- **Features:**
  - One-click mock data seeding
  - Test message processing
  - Test postback webhooks
  - System architecture overview
  - Links to all other pages

#### 2. **Brands** (`/dashboard/brands`)
- **Purpose:** Multi-operator/brand management
- **What you'll see:**
  - 3 brands: Roobet, Rushbet, Stake
  - Performance metrics (leads, registrations, FTD, revenue)
  - Customer stage distribution per brand
  - Click any brand to see brand-specific customers

#### 3. **Brand Detail** (`/dashboard/brands/[id]`)
- **Purpose:** View all customers for a specific brand
- **What you'll see:**
  - Brand configuration (email domain, SMS provider, status)
  - Customer list filtered by brand
  - Journey stage filters
  - Message counts (emails sent, SMS sent)

#### 4. **Campaigns** (`/dashboard/campaigns`)
- **Purpose:** Campaign performance tracking
- **What you'll see:**
  - 5 campaigns with realistic conversion data
  - Click tracking, lead generation, registration, FTD metrics
  - Influencer assignments
  - Campaign status (active/paused)
  - Click influencer names to view their profiles

#### 5. **Influencers** (`/dashboard/influencers`)
- **Purpose:** Influencer partnership management
- **What you'll see:**
  - 5 influencers with performance stats
  - Total clicks, leads, registrations, FTD
  - Platform info (YouTube, Instagram, TikTok, Twitch)
  - Campaign assignments
  - Compact and table views
  - Click "VIEW" to see influencer details

#### 6. **Influencer Detail** (`/dashboard/influencers/[id]`)
- **Purpose:** Deep dive into influencer performance
- **What you'll see:**
  - Performance stats (clicks, leads, regs, FTD)
  - Conversion rates
  - Contact information
  - Social media stats
  - Associated campaigns
  - Revenue attribution

#### 7. **Customers** (`/dashboard/customers`)
- **Purpose:** Customer profiles with identity graph
- **What you'll see:**
  - 50 customers with complete profiles
  - Identity graph (email, phone, click IDs)
  - Journey stages
  - Activity history
  - Click any customer to view full profile

#### 8. **Customer Detail** (`/dashboard/customers/[id]`)
- **Purpose:** Complete customer journey view
- **What you'll see:**
  - Journey timeline
  - All identifiers (email, phone, devices, click IDs)
  - Activity history (clicks, leads, events)
  - Current journey stage
  - Message history
  - Attribution data (campaign, influencer, source)

#### 9. **Journey Automation** (`/dashboard/journey-automation`)
- **Purpose:** View and manage automated messaging
- **What you'll see:**
  - Journey stats (active journeys, stage distribution)
  - Message status (pending, sent, failed)
  - Scheduled messages with customer details
  - Test data generators
  - Process messages button (simulates sending)

#### 10. **Message Templates** (`/dashboard/message-templates`)
- **Purpose:** Customize messages for each brand and journey
- **What you'll see:**
  - Templates grouped by brand and journey type
  - Edit message content, subject lines, CTA links
  - Preview templates before saving
  - Filter by brand, journey type, channel
  - Create new templates

## 🎯 Testing Workflow

### Step 1: Seed Mock Data
1. Go to `/dashboard/demo`
2. Click "Seed database with realistic mock data"
3. Wait for success message showing:
   - 3 operators created
   - 5 influencers created
   - 5 campaigns created
   - 50 customers created

### Step 2: Explore Brand Segmentation
1. Go to `/dashboard/brands`
2. See all 3 brands (Roobet, Rushbet, Stake)
3. Click on "Roobet" to view brand detail
4. See customers segmented by brand
5. Notice journey states and message counts

### Step 3: View Campaign Performance
1. Go to `/dashboard/campaigns`
2. See 5 campaigns with conversion data
3. Notice influencer assignments
4. Click an influencer name → See influencer profile
5. From influencer profile → Click "View Campaign" → Back to campaigns

### Step 4: Check Customer Journeys
1. Go to `/dashboard/customers`
2. Click any customer
3. See full journey timeline
4. Notice identity graph with multiple identifiers
5. See attribution data (campaign, influencer, source)
6. View activity history (clicks, leads, events)

### Step 5: Test Journey Automation
1. Go to `/dashboard/journey-automation`
2. See journey stats and message status
3. Click any message to view details
4. Notice customer attribution in modal
5. Click customer name → Goes to customer profile
6. Click brand name → Goes to brand detail

### Step 6: Customize Message Templates
1. Go to `/dashboard/message-templates`
2. See templates grouped by brand
3. Click "New Template" to create one
4. Select brand, journey type, message type, day, channel
5. Write your message content
6. Add CTA text and link
7. Preview before saving

### Step 7: Process Messages
1. Go to `/dashboard/demo`
2. Click "Process pending messages"
3. See mock email/SMS sending in action
4. View results (total, sent, failed)
5. Go back to `/dashboard/journey-automation`
6. See messages marked as "SENT"

### Step 8: Test Postback Integration
1. Go to `/dashboard/demo`
2. Click "Test operator postback webhook"
3. Simulates deposit notification
4. Journey state updates automatically
5. Customer moves from stage 0 → 1
6. Journey switches to "retention"

## 🔗 Navigation Flow

All pages are interconnected:

```
Demo Page
  ↓
  ├→ Brands
  │   ↓
  │   └→ Brand Detail
  │       ↓
  │       └→ Customer (from brand view)
  │
  ├→ Campaigns
  │   ↓
  │   └→ Influencer (click name)
  │       ↓
  │       └→ Influencer Detail
  │
  ├→ Customers
  │   ↓
  │   └→ Customer Detail
  │       ├→ View campaign link
  │       ├→ View brand link
  │       └→ View influencer link
  │
  ├→ Journey Automation
  │   ├→ Message details with customer info
  │   ├→ Link to customer profiles
  │   ├→ Link to brands
  │   └→ Link to message templates
  │
  └→ Message Templates
      └→ Customize all messages
```

## 📊 What the Mock Data Includes

### Operators (Brands)
- **Roobet:** Purple theme, 450 leads, $125k revenue
- **Rushbet:** Red theme, 380 leads, $98k revenue, Peru focus
- **Stake:** Green theme, 520 leads, $156k revenue

### Influencers
- **Carlos Gaming:** YouTube, 250k followers, 180 leads
- **Maria Streamer:** Twitch, 180k followers, 145 leads
- **JuanBets:** Instagram, 95k followers, 92 leads
- **LuckyLisa:** TikTok, 320k followers, 220 leads
- **ProGamerPeru:** YouTube, 420k followers, 310 leads (paused)

### Campaigns
- **Summer Bonus 2024:** Roobet, 2500 clicks, 450 leads
- **Peru Launch Special:** Rushbet, 1980 clicks, 380 leads
- **VIP Reload Bonus:** Stake, 3200 clicks, 520 leads
- **Black Friday Mega Deal:** Roobet, 1850 clicks, 310 leads
- **Sports Betting Championship:** Rushbet, 950 clicks, 145 leads (inactive)

### Customers
- **50 customers** with realistic Peruvian names
- **Complete activity history:** clicks, leads, events
- **Journey states:** Various stages (-1 to 3+)
- **Multiple identifiers:** Email, phone, click IDs
- **Attribution data:** Campaign, influencer, source tracking

### Journey Messages
- **100+ scheduled messages** across different stages
- **Mix of channels:** Email and SMS
- **Various statuses:** Pending, Sent, Delivered, Failed
- **Personalized content** with customer data

### Message Templates
- **27 templates total** (9 per brand)
- **Acquisition templates:** Welcome, Bonus Reminder, Social Proof, Urgency, Final Nudge
- **Retention templates:** Reload, VIP Offer, Social Proof
- **Fully customizable** content, subject, CTA

## 🛠️ API Endpoints

### Seed Mock Data
```bash
POST /api/seed-mock-data
Body: { "action": "reset" }  # or "seed" or "clear"
```

### Process Messages (Cron Job)
```bash
POST /api/cron/process-messages
# Simulates sending all pending messages
```

### Test Postback
```bash
POST /api/postback
Body: {
  "email": "user@example.com",
  "eventType": "deposit",
  "depositAmount": 100,
  "operatorId": "roobet"
}
```

## ✨ Key Features Demonstrated

### 1. Identity Graph
- Single customer profile across all identifiers
- Automatic deduplication
- Email, phone, device ID, click ID tracking

### 2. Multi-Operator Segmentation
- Isolated journeys per brand
- Brand-specific messaging
- Independent customer stages

### 3. Journey Automation
- Acquisition journeys (stages -1 to 0)
- Retention journeys (stages 1+)
- Automated message scheduling
- Frequency caps (max 1 message/day)

### 4. Message Templates
- Customizable per brand
- Different templates for each journey type
- Personalization with {firstName}, {lastName}, {brandName}
- CTA links and buttons

### 5. Attribution Tracking
- Full click-to-conversion tracking
- Influencer revenue sharing
- Campaign performance metrics
- Source/medium/campaign tracking

### 6. Postback Integration
- Deposit notifications from operators
- Automatic journey state updates
- Stage progression
- Revenue tracking

## 🎨 UI Features

- **Dark theme** with premium glassmorphism design
- **Color-coded sections:** Purple (customers), Green (brands), Yellow (influencers)
- **Real-time updates** with mock processing
- **Responsive design** works on all screen sizes
- **Interactive modals** for detailed views
- **Filtering and search** across all pages

## 📝 Notes

- **Mock sending:** All email/SMS sending is simulated (95% success rate)
- **No external APIs:** Everything works offline
- **Realistic data:** Names, locations, metrics all look real
- **Safe to test:** Reset and re-seed anytime without issues
- **Connected pages:** Every page links to relevant related pages

## 🎯 Next Steps

After testing with mock data, you can:

1. **Add real email provider:** Replace mock with Postmark/SendGrid
2. **Add real SMS provider:** Replace mock with Laaffic/Twilio
3. **Set up cron job:** Deploy `/api/cron/process-messages` to run every 5 minutes
4. **Configure webhooks:** Give operators your `/api/postback` URL
5. **Customize templates:** Edit all message templates in the UI
6. **Add authentication:** Currently all pages are accessible

---

**Everything is fully functional with mock data!** 🎉

Navigate to http://localhost:3005/dashboard/demo and start exploring!
