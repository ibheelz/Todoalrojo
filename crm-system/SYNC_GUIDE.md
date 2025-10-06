# Production to Local Data Sync

This guide explains how to automatically sync production data to your local development environment.

## Overview

The sync service automatically pulls data from your production Supabase database to your local PostgreSQL database every 5 minutes.

## What Gets Synced

- **Campaigns** (all)
- **Influencers** (all)
- **Links** (all)
- **Customers** (last 100)
- **Identifiers** (for synced customers)
- **Clicks** (last 200)
- **Leads** (last 100)
- **Events** (last 100)
- **Link Clicks** (last 200)

## Setup

### 1. Environment Variables

Make sure your `.env` file has these variables:

```env
# Local database
DATABASE_URL="postgresql://bheelz@localhost:5432/todoalrojo_crm"

# Production database (Supabase)
DATABASE_URL_PRODUCTION="postgresql://postgres.nrovjtqirgyugkjhsatq:aqc!gab_xrz4nqf3HFU@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"

# Local database (for sync script)
DATABASE_URL_LOCAL="postgresql://bheelz@localhost:5432/todoalrojo_crm"
```

### 2. Running the Sync

#### One-time Sync

To sync data once:

```bash
npm run sync
```

Or run the worker directly:

```bash
npx tsx sync-worker.ts
```

#### Automatic Sync (Every 5 Minutes)

To start the automatic sync service:

```bash
npx tsx sync-production-to-local.ts
```

This will:
1. Run an initial sync immediately
2. Schedule syncs every 5 minutes
3. Keep running in the background

To stop it, press `Ctrl+C`.

#### Run in Background

To run the sync service in the background (recommended):

```bash
# macOS/Linux
npx tsx sync-production-to-local.ts > sync.log 2>&1 &

# To stop it later
ps aux | grep sync-production-to-local
kill <PID>
```

## How It Works

1. **sync-production-to-local.ts** - Main service that schedules syncs every 5 minutes
2. **sync-worker.ts** - Worker script that performs the actual data sync
3. Uses `PrismaClient` with `datasourceUrl` to connect to both databases
4. Performs `upsert` operations to sync data (creates or updates existing records)

## Sync Strategy

- Uses **upsert** to avoid duplicates (updates if exists, creates if not)
- Syncs most recent data first (ordered by creation/update time)
- Limits synced records to avoid overwhelming local database
- Handles foreign key constraints gracefully
- Skips records that fail constraint checks

## Troubleshooting

### Connection Error

If you get a database connection error:

1. Check that your local PostgreSQL is running:
   ```bash
   brew services list
   ```

2. Check that production credentials are correct in `.env`

3. Test connections:
   ```bash
   # Test local
   psql postgresql://bheelz@localhost:5432/todoalrojo_crm -c "SELECT 1"

   # Test production (from .env)
   psql "<PRODUCTION_URL>" -c "SELECT 1"
   ```

### Sync Fails

If the sync fails:

1. Check the error message in the console
2. Check logs in `sync.log` if running in background
3. Try running a one-time sync to see detailed errors:
   ```bash
   npx tsx sync-worker.ts
   ```

### Clear Local Data

To clear all local data and start fresh:

```bash
npx tsx clear-all-local-data.ts
```

Then run the sync again to pull fresh production data.

## Verify Synced Data

After syncing, verify the data:

```bash
# Check via Prisma Studio
npm run db:studio

# Check via dashboard
# Visit http://localhost:3005/dashboard/customers
```

## Production Safety

**Important**: This sync is **one-way** (production → local). Your local changes will NOT affect production.

The sync service only reads from production and writes to local. This ensures:
- ✅ Safe to test locally without affecting production
- ✅ Always have fresh production data for development
- ✅ No risk of corrupting production data

## Notes

- The sync service does NOT delete local data that doesn't exist in production
- Existing records are updated with the latest production data
- New records from production are created in local
- Local-only records (not in production) remain untouched
