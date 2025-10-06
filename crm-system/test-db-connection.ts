import { PrismaClient } from '@prisma/client'

async function testConnection() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL_PRODUCTION
  })

  try {
    console.log('Testing database connection...')
    console.log('Database URL:', process.env.DATABASE_URL_PRODUCTION?.replace(/:[^:@]+@/, ':****@'))

    await prisma.$connect()
    console.log('✅ Database connected successfully')

    const count = await prisma.shortLink.count()
    console.log(`✅ Found ${count} short links`)

    await prisma.$disconnect()
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

testConnection()
