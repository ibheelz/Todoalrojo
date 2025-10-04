import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    // Check if tables exist
    let tablesExist = false
    let tableCount = 0
    let missingTables: string[] = []

    try {
      // Test key tables
      const tables = ['Customer', 'AdminUser', 'Lead', 'Click', 'Event']
      const results = await Promise.allSettled([
        prisma.customer.count(),
        prisma.adminUser.count(),
        prisma.lead.count(),
        prisma.click.count(),
        prisma.event.count(),
      ])

      tableCount = results.filter(r => r.status === 'fulfilled').length

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          missingTables.push(tables[index])
        }
      })

      tablesExist = tableCount === tables.length
    } catch (tableError) {
      console.error('Table check error:', tableError)
    }

    return NextResponse.json({
      status: tablesExist ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: 'connected',
      tables: {
        exist: tablesExist,
        count: `${tableCount}/5`,
        missing: missingTables
      },
      service: 'Identity Graph CRM'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Database connection failed'
    }, { status: 503 })
  }
}