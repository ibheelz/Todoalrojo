// Update existing ShortLink.customDomain values to a new hostname
// Usage: node scripts/update-short-domains.js NEW_HOSTNAME [OLD_HOSTNAME]

const path = require('path')
const fs = require('fs')
// Load env for DATABASE_URL and others
try {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const dotenv = require('dotenv')
    dotenv.config({ path: envPath })
  }
} catch {}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const NEW_HOST = (process.argv[2] || '').replace(/^https?:\/\//, '')
  const OLD_HOST = (process.argv[3] || '').replace(/^https?:\/\//, '')
  if (!NEW_HOST) {
    console.error('Usage: node scripts/update-short-domains.js NEW_HOSTNAME [OLD_HOSTNAME]')
    process.exit(1)
  }

  console.log('Updating short link domains...', { NEW_HOST, OLD_HOST })

  // Build where clause
  const where = OLD_HOST
    ? { customDomain: OLD_HOST }
    : { customDomain: { endsWith: '.ngrok-free.app' } }

  const result = await prisma.shortLink.updateMany({
    where,
    data: { customDomain: NEW_HOST }
  })

  console.log(`Updated ${result.count} short_links to customDomain=${NEW_HOST}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

