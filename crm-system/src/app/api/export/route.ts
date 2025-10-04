import { NextRequest, NextResponse } from 'next/server'
import { ExportService } from '@/lib/export-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'users' | 'leads' | 'clicks' | 'events'
    const format = searchParams.get('format') as 'csv' | 'excel' || 'csv'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    if (!type || !['users', 'leads', 'clicks', 'events'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid export type. Must be one of: users, leads, clicks, events'
      }, { status: 400 })
    }

    if (!['csv', 'excel'].includes(format)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid format. Must be csv or excel'
      }, { status: 400 })
    }

    const filters = { limit }
    let data: any
    let filename: string
    let contentType: string

    switch (type) {
      case 'users':
        data = await ExportService.exportUsers(format, filters)
        filename = `users_export_${new Date().toISOString().split('T')[0]}`
        break
      case 'leads':
        data = await ExportService.exportLeads(format, filters)
        filename = `leads_export_${new Date().toISOString().split('T')[0]}`
        break
      case 'clicks':
        data = await ExportService.exportClicks(format, filters)
        filename = `clicks_export_${new Date().toISOString().split('T')[0]}`
        break
      case 'events':
        data = await ExportService.exportEvents(format, filters)
        filename = `events_export_${new Date().toISOString().split('T')[0]}`
        break
      default:
        throw new Error('Invalid export type')
    }

    if (format === 'csv') {
      filename += '.csv'
      contentType = 'text/csv'
    } else {
      filename += '.xlsx'
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    const response = new NextResponse(data)
    response.headers.set('Content-Type', contentType)
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    response.headers.set('Cache-Control', 'no-cache')

    return response

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({
      success: false,
      error: 'Export failed'
    }, { status: 500 })
  }
}