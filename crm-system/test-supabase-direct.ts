import { PrismaClient } from '@prisma/client'

async function testDirect() {
  // Try direct connection (port 5432, no pgbouncer)
  const directUrl = "postgresql://postgres.nrovjtqirgyugkjhsatq:aqc!gab_xrz4nqf3HFU@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"

  console.log('Testing direct Supabase connection...')

  const prisma = new PrismaClient({
    datasourceUrl: directUrl
  })

  try {
    await prisma.$connect()
    console.log('✅ Direct connection successful')

    const count = await prisma.shortLink.count()
    console.log(`✅ Found ${count} short links`)

    await prisma.$disconnect()
  } catch (error: any) {
    console.error('❌ Direct connection failed:', error.message)

    // Try alternative direct connection (port 6543)
    console.log('\nTrying port 6543...')
    const altUrl = "postgresql://postgres.nrovjtqirgyugkjhsatq:aqc!gab_xrz4nqf3HFU@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"

    const prisma2 = new PrismaClient({
      datasourceUrl: altUrl
    })

    try {
      await prisma2.$connect()
      console.log('✅ Port 6543 connection successful')

      const count = await prisma2.shortLink.count()
      console.log(`✅ Found ${count} short links`)
      console.log(`\n✅ USE THIS URL:\n${altUrl}`)

      await prisma2.$disconnect()
    } catch (error2: any) {
      console.error('❌ Port 6543 also failed:', error2.message)

      // Try db.supabase.co domain
      console.log('\nTrying db.supabase.co domain...')
      const dbUrl = "postgresql://postgres.nrovjtqirgyugkjhsatq:aqc!gab_xrz4nqf3HFU@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

      const prisma3 = new PrismaClient({
        datasourceUrl: dbUrl
      })

      try {
        await prisma3.$connect()
        console.log('✅ SSL connection successful')

        const count = await prisma3.shortLink.count()
        console.log(`✅ Found ${count} short links`)
        console.log(`\n✅ USE THIS URL:\n${dbUrl}`)

        await prisma3.$disconnect()
      } catch (error3: any) {
        console.error('❌ All connection attempts failed')
        console.error('Error:', error3.message)
        process.exit(1)
      }
    }
  }
}

testDirect()
