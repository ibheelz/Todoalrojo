# Journey Automation Testing Guide

## 🚀 Getting Started

Your journey automation system is now fully functional! This guide will help you test every feature.

## 📍 Access the Dashboard

1. Navigate to: `http://localhost:3005/dashboard/journey-automation`
2. You should see the Journey Automation dashboard with:
   - Test Data Generator
   - Stats Overview (4 cards)
   - Message Queue & History
   - Journey Types
   - Stage Distribution
   - Message Statistics

## 🧪 Step-by-Step Testing Guide

### Step 1: Generate Test Data

Click one of the test data buttons at the top:

**Option A: Full Test Set (Recommended)**
- Click "Full Test Set" button
- This creates 13 test customers across all stages:
  - 3 users at Stage -1 (Not Registered)
  - 3 users at Stage 0 (Registered, No Deposit)
  - 3 users at Stage 1 (First Deposit)
  - 2 users at Stage 2 (Second Deposit)
  - 2 users at Stage 3+ (High Value/VIP)
- ✅ You should see an alert: "Test Data Generated! 13 customers created with journeys"

**Option B: Acquisition Only**
- Click "Acquisition Only" button
- Creates 5 customers with acquisition journeys
- Great for testing the 7-day email/SMS sequence

**Option C: Retention Only**
- Click "Retention Only" button
- Creates 5 customers with retention journeys
- Great for testing the 5-day redeposit campaign

### Step 2: Review the Stats

After generating test data, you should see updated numbers:

✅ **Total Journeys Card**:
- Should show 13+ (depending on which option you chose)
- Shows how many are "active"

✅ **Pending Messages Card**:
- Should show 30+ messages (acquisition creates 5 msgs per user, retention creates 3 msgs per user)
- These are ready to be sent

✅ **Sent Messages**:
- Will be 0 initially
- Will increase after processing messages

✅ **Failed Messages**:
- Should be 0 if everything is working

### Step 3: Explore the Message Queue

Scroll down to "Message Queue & History" table:

✅ You should see all scheduled messages with:
- Customer name and contact info
- Message type (WELCOME, BONUS_REMINDER, SOCIAL_PROOF, etc.)
- Channel (EMAIL or SMS with icons)
- Journey type (ACQUISITION or RETENTION)
- Day number in the sequence
- Scheduled date/time
- Status badge (PENDING/SCHEDULED)
- Eye icon to preview the message

**Filter Messages**:
- Click "All" to see everything
- Click "Pending" to see only pending messages
- Click "Sent" to see sent messages
- Click "Failed" to see failed messages

### Step 4: Preview Message Content

Click the eye icon (👁️) on any message:

✅ A modal will pop up showing:
- Customer details
- Message status
- Email subject (for emails)
- Full HTML content (for emails) or SMS text
- Scheduled time
- Sent time (if sent)
- Failure reason (if failed)

**Close the modal** by clicking the X button or clicking outside.

### Step 5: Process Messages

Click the "Process Messages" button at the top right:

✅ You should see an alert with results:
```
✅ Message Processing Complete

📤 Sent: X messages
❌ Failed: 0 messages
⏭️ Skipped: 0 messages
```

**What happens**:
- All messages with `scheduledFor` <= NOW will be "sent"
- Mock email/SMS providers simulate sending
- Messages move from PENDING → SENT
- Counters update in real-time

**After processing**:
- Refresh the page or click "Refresh All"
- The "Sent Messages" card should increase
- Filter to "Sent" to see which messages were processed
- Click the eye icon to see sent timestamps

### Step 6: Review Stage Distribution

Scroll to "User Lifecycle Stages" section:

✅ You should see bars showing:
- **Stage -1**: Not Registered (3 users with acquisition journey)
- **Stage 0**: Registered, No Deposit (3 users with acquisition journey)
- **Stage 1**: 1 Deposit (3 users with retention journey)
- **Stage 2**: 2 Deposits (2 users with retention journey)
- **Stage 3+**: High Value (2 users, no journey - they're done!)

Each stage has:
- Color-coded badge
- Icon
- Progress bar showing percentage
- User count

### Step 7: Review Message Statistics

Check the "Email Messages" and "SMS Messages" cards:

✅ **Email Messages** should show:
- PENDING: X emails
- SENT: X emails (after processing)
- FAILED: X emails (if any)

✅ **SMS Messages** should show:
- PENDING: X SMS
- SENT: X SMS (after processing)
- FAILED: X SMS (if any)

### Step 8: Search for Customers

Use the search bar in "Quick Actions":

1. Type a test email (e.g., `test.user.` or `test.lead.`)
2. Press Enter or click "Search"
3. You'll be redirected to the Customers page with search results

### Step 9: View Journey Types

Review the journey cards to understand the flows:

✅ **Acquisition Journey**:
- Stages: -1, 0
- Goal: Convert to first-time depositor
- 7-day flow:
  - D+0: Welcome Email
  - D+1: Bonus Reminder SMS
  - D+3: Social Proof Email
  - D+5: Last Chance SMS
  - D+7: Final Nudge Email

✅ **Retention Journey**:
- Stages: 1, 2
- Goal: Encourage redeposits
- 5-day flow:
  - D+1: Reload Bonus Email
  - D+2: Urgency SMS
  - D+5: VIP Offer Email

### Step 10: Clean Up Test Data

When you're done testing:

1. Click "Clean Test Data" button
2. Confirm the warning dialog
3. ✅ All test customers, journey states, and messages will be deleted
4. You'll see a summary:
```
✅ Test Data Cleaned!

🗑️ Deleted:
- X customers
- X journey states
- X messages
- X identifiers
```

## 🔄 Advanced Testing

### Test Acquisition Journey Flow

1. Generate "Acquisition Only" data
2. Process messages immediately
3. Check that Day 0 emails are sent (scheduled for NOW)
4. The other messages (Day 1, 3, 5, 7) remain pending (future dates)

### Test Retention Journey Flow

1. Generate "Retention Only" data
2. Process messages
3. Check that Day 1 messages are sent (scheduled for tomorrow in production, but can be sent now in testing)

### Test Frequency Caps

The system enforces:
- Max 1 message per customer per day
- Max 3 emails + 2 SMS per acquisition journey
- Max 2 emails + 1 SMS per retention journey
- Unsubscribe honored per channel

### Test Stage Progression

1. View customer in Customers page
2. Check their journey state (upcoming feature)
3. Simulate deposit via postback API (advanced)

## 📊 What to Look For

### Success Indicators ✅

- All stats cards show correct numbers
- Messages appear in the table
- Message previews show proper HTML/text content
- Processing messages updates counters
- Filters work correctly
- Stage distribution matches test data
- No JavaScript errors in browser console

### Red Flags ❌

- Stats show 0 when data exists
- Messages don't appear in table
- Processing doesn't update sent count
- Modal doesn't show message content
- Errors in browser console
- Failed messages without clear reason

## 🎯 Real-World Usage

### In Production

1. **Don't use the test data buttons** - these are for testing only
2. **Journeys start automatically** when:
   - New leads captured from landing pages
   - Operator postbacks received (registration/deposit events)
   - Manual API calls to start journey

3. **Set up cron job** to process messages:
```bash
# Every 15 minutes
*/15 * * * * curl -X POST http://your-domain.com/api/journey/process-messages
```

4. **Monitor the dashboard** regularly:
   - Check pending messages queue
   - Review failed messages
   - Track sent message counts
   - Monitor stage distribution

### Integration with Real Email/SMS

Currently using mock providers. To integrate real services:

1. **For Email** (edit `src/lib/messaging/email-provider.ts`):
   - Replace mock with SendGrid, Mailgun, or Resend
   - Add API keys to environment variables
   - Update send logic

2. **For SMS** (edit `src/lib/messaging/sms-provider.ts`):
   - Replace mock with Twilio or Laffic
   - Add API credentials
   - Update send logic

## 🐛 Troubleshooting

### Messages Not Showing
- Check browser console for errors
- Verify database connection
- Check that Prisma client is generated (`npm run db:generate`)

### Processing Doesn't Work
- Check that scheduledFor dates are in the past
- Verify mock providers are responding
- Check server logs for errors

### Stats Not Updating
- Click "Refresh All" button
- Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
- Check API responses in Network tab

## 📝 API Testing (Advanced)

### Generate Test Data via API
```bash
curl -X POST "http://localhost:3005/api/journey/test-data?action=full"
```

### Process Messages via API
```bash
curl -X POST "http://localhost:3005/api/journey/process-messages"
```

### Get Journey Stats
```bash
curl "http://localhost:3005/api/journey/state?action=stats" -X PUT
```

### View All Messages
```bash
curl "http://localhost:3005/api/journey/messages"
```

### Clean Test Data via API
```bash
curl -X POST "http://localhost:3005/api/journey/test-data?action=clean"
```

## ✨ Next Steps

After successful testing:

1. ✅ Review all features working
2. ✅ Understand journey flows
3. ✅ Test message processing
4. ✅ Clean up test data
5. 🚀 Ready for production integration!

---

**Need Help?**
- Check the main README: `JOURNEY_AUTOMATION_README.md`
- Review API documentation in the README
- Check server logs for detailed error messages
