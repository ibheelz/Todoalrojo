import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🗑️ Dropping existing tables...')

    // Drop all tables in the correct order (respecting foreign keys)
    const dropStatements = [
      'DROP TABLE IF EXISTS "events" CASCADE',
      'DROP TABLE IF EXISTS "clicks" CASCADE',
      'DROP TABLE IF EXISTS "leads" CASCADE',
      'DROP TABLE IF EXISTS "customers" CASCADE',
      'DROP TABLE IF EXISTS "admin_users" CASCADE',
      'DROP TYPE IF EXISTS "AdminRole" CASCADE'
    ]

    for (const statement of dropStatements) {
      await prisma.$executeRawUnsafe(statement)
    }

    console.log('✅ All tables dropped successfully')

    return NextResponse.json({
      success: true,
      message: 'Database tables reset successfully - you can now run /api/init',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Reset database error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database reset failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}