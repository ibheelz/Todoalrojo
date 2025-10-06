import cron from 'node-cron';

const PRODUCTION_URL = 'https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app';
const CRON_SECRET = process.env.CRON_SECRET || 'hREcE2ftRlXHsggmtsoE9ROMzPQNXZQ2Vpdq3TEfvS0=';

async function triggerRedtrackSync() {
  console.log(`\n🔄 [REDTRACK] Triggering sync... ${new Date().toISOString()}`);

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/cron/sync-redtrack`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ [REDTRACK] Sync failed (${response.status}): ${text.substring(0, 200)}`);
      return;
    }

    const data = await response.json();

    if (data.success) {
      console.log(`✅ [REDTRACK] Synced ${data.results?.imported || 0} clicks, ${data.results?.skipped || 0} skipped`);
    } else {
      console.error(`⚠️  [REDTRACK] Sync returned error: ${data.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error(`❌ [REDTRACK] Request failed: ${error.message}`);
  }
}

async function triggerMessageProcessing() {
  console.log(`\n📨 [MESSAGES] Triggering processing... ${new Date().toISOString()}`);

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/cron/process-messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ [MESSAGES] Processing failed (${response.status}): ${text.substring(0, 200)}`);
      return;
    }

    const data = await response.json();

    if (data.success) {
      console.log(`✅ [MESSAGES] Processed ${data.results?.processed || 0} messages, ${data.results?.failed || 0} failed`);
    } else {
      console.error(`⚠️  [MESSAGES] Processing returned error: ${data.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error(`❌ [MESSAGES] Request failed: ${error.message}`);
  }
}

console.log('🚀 Starting Redtrack & Message Cron Service...');
console.log(`📍 Production URL: ${PRODUCTION_URL}`);
console.log('📋 Schedules:');
console.log('   - Redtrack Sync: Every 1 minute');
console.log('   - Message Processing: Every 5 minutes');
console.log('\n🔄 Running initial syncs now...\n');

// Run immediately
triggerRedtrackSync();
triggerMessageProcessing();

// Schedule Redtrack sync every 1 minute
cron.schedule('* * * * *', () => {
  triggerRedtrackSync();
});

// Schedule message processing every 5 minutes
cron.schedule('*/5 * * * *', () => {
  triggerMessageProcessing();
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down cron service...');
  process.exit(0);
});
