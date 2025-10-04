import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST() {
  // Generate a simple ID (since we can't import cuid in this context)
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

  console.log('🚀 Starting database initialization v2...')

  try {
    console.log('🚀 Starting database initialization...')

    // First, try to create the schema using raw SQL
    console.log('📋 Creating database schema...')

    // Create the tables if they don't exist - execute each statement separately
    const statements = [
      // Create AdminRole enum first
      `CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ANALYST', 'VIEWER')`,

      // Create AdminUser table
      `CREATE TABLE IF NOT EXISTS "admin_users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" "AdminRole" NOT NULL DEFAULT 'ANALYST',
        "firstName" TEXT,
        "lastName" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastLogin" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
      )`,

      // Create Customer table
      `CREATE TABLE IF NOT EXISTS "customers" (
        "id" TEXT NOT NULL,
        "masterEmail" TEXT,
        "masterPhone" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "firstName" TEXT,
        "lastName" TEXT,
        "company" TEXT,
        "jobTitle" TEXT,
        "source" TEXT,
        "country" TEXT,
        "region" TEXT,
        "city" TEXT,
        "timezone" TEXT,
        "language" TEXT,
        "profileImage" TEXT,
        "totalClicks" INTEGER NOT NULL DEFAULT 0,
        "totalLeads" INTEGER NOT NULL DEFAULT 0,
        "totalEvents" INTEGER NOT NULL DEFAULT 0,
        "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isFraud" BOOLEAN NOT NULL DEFAULT false,
        "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
        "assignedTeam" TEXT[] DEFAULT ARRAY[]::TEXT[],
        CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
      )`,

      // Create Lead table
      `CREATE TABLE IF NOT EXISTS "leads" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "firstName" TEXT,
        "lastName" TEXT,
        "campaign" TEXT,
        "source" TEXT,
        "medium" TEXT,
        "qualityScore" INTEGER NOT NULL DEFAULT 50,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
      )`,

      // Create Click table
      `CREATE TABLE IF NOT EXISTS "clicks" (
        "id" TEXT NOT NULL,
        "ip" TEXT NOT NULL,
        "clickId" TEXT,
        "campaign" TEXT,
        "source" TEXT,
        "medium" TEXT,
        "userAgent" TEXT,
        "landingPage" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "clicks_pkey" PRIMARY KEY ("id")
      )`,

      // Create Event table
      `CREATE TABLE IF NOT EXISTS "events" (
        "id" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "events_pkey" PRIMARY KEY ("id")
      )`,

      // Create indexes
      `CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_email_key" ON "admin_users"("email")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "customers_masterEmail_key" ON "customers"("masterEmail")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "customers_masterPhone_key" ON "customers"("masterPhone")`
    ]

    // Execute each statement separately with error handling
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement)
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists') && error.code !== '42710') {
          throw error
        }
        console.log(`Skipped statement (already exists): ${statement.split(' ').slice(0, 4).join(' ')}...`)
      }
    }
    console.log('✅ Database schema created successfully')

    // Now check if admin user exists
    try {
      const existingAdmin = await prisma.adminUser.findFirst({
        where: { email: 'abiola@mieladigital.com' }
      })

      if (!existingAdmin) {
        console.log('👤 Creating admin user...')
        const adminPassword = await bcrypt.hash('admin123', 12)

        await prisma.adminUser.create({
          data: {
            id: generateId(),
            email: 'abiola@mieladigital.com',
            passwordHash: adminPassword,
            role: 'SUPER_ADMIN',
            firstName: 'Abiola',
            lastName: 'Admin',
            isActive: true
          }
        })
        console.log('✅ Admin user created successfully')
      } else {
        console.log('👤 Admin user already exists')
      }

      // Create a few sample customers if none exist
      const customerCount = await prisma.customer.count()
      if (customerCount === 0) {
        console.log('👥 Creating sample customers...')

        const sampleCustomers = [
          {
            masterEmail: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            company: 'Tech Corp',
            country: 'United States',
            city: 'New York',
            source: 'Website'
          },
          {
            masterEmail: 'jane.smith@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            company: 'Design Studio',
            country: 'Canada',
            city: 'Toronto',
            source: 'Social Media'
          },
          {
            masterEmail: 'mike.jones@example.com',
            firstName: 'Mike',
            lastName: 'Jones',
            company: 'Startup Inc',
            country: 'United Kingdom',
            city: 'London',
            source: 'Referral'
          }
        ]

        for (const customer of sampleCustomers) {
          await prisma.customer.create({
            data: {
              id: generateId(),
              ...customer
            }
          })
        }
        console.log('✅ Sample customers created')
      }

      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully',
        timestamp: new Date().toISOString()
      })

    } catch (dbError) {
      console.error('Database initialization error:', dbError)

      return NextResponse.json({
        success: false,
        error: 'Database initialization failed',
        details: dbError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Init API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Initialization failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}