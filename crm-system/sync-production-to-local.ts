import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function syncData() {
  console.log('\n🔄 [SYNC] Starting production → local sync...');
  console.log(`⏰ [SYNC] ${new Date().toISOString()}\n`);

  try {
    // Run the actual sync using npx tsx with a separate script
    const { stdout, stderr } = await execPromise('npx tsx sync-worker.ts', {
      env: {
        ...process.env,
      },
      cwd: process.cwd(),
      timeout: 120000, // 2 minutes timeout
    });

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('\n✅ [SYNC] Sync completed successfully!\n');

  } catch (error: any) {
    console.error('❌ [SYNC] Sync error:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
  }
}

async function runSync() {
  try {
    await syncData();
  } catch (error) {
    console.error('❌ [SYNC] Failed:', error);
  }
}

// Run immediately on start
console.log('🚀 Starting production → local sync service...');
console.log('📋 Schedule: Every 5 minutes');
console.log('🔄 Running initial sync now...\n');

runSync();

// Schedule to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
  runSync();
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down sync service...');
  process.exit(0);
});
