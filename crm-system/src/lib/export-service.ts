import { prisma } from './prisma'
import ExcelJS from 'exceljs'

export class ExportService {
  static async exportUsers(format: 'csv' | 'excel' = 'csv', filters?: any) {
    const users = await prisma.customer.findMany({
      include: {
        identifiers: true,
        _count: {
          select: {
            clicks: true,
            leads: true,
            events: true
          }
        }
      },
      ...(filters?.limit && { take: filters.limit }),
      orderBy: { createdAt: 'desc' }
    })

    if (format === 'csv') {
      return this.generateUserCSV(users)
    } else {
      return this.generateUserExcel(users)
    }
  }

  static async exportLeads(format: 'csv' | 'excel' = 'csv', filters?: any) {
    const leads = await prisma.lead.findMany({
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            masterPhone: true,
            firstName: true,
            lastName: true
          }
        }
      },
      ...(filters?.limit && { take: filters.limit }),
      orderBy: { createdAt: 'desc' }
    })

    if (format === 'csv') {
      return this.generateLeadCSV(leads)
    } else {
      return this.generateLeadExcel(leads)
    }
  }

  static async exportClicks(format: 'csv' | 'excel' = 'csv', filters?: any) {
    const clicks = await prisma.click.findMany({
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            masterPhone: true
          }
        }
      },
      ...(filters?.limit && { take: filters.limit }),
      orderBy: { createdAt: 'desc' }
    })

    if (format === 'csv') {
      return this.generateClickCSV(clicks)
    } else {
      return this.generateClickExcel(clicks)
    }
  }

  static async exportEvents(format: 'csv' | 'excel' = 'csv', filters?: any) {
    const events = await prisma.event.findMany({
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            masterPhone: true
          }
        }
      },
      ...(filters?.limit && { take: filters.limit }),
      orderBy: { createdAt: 'desc' }
    })

    if (format === 'csv') {
      return this.generateEventCSV(events)
    } else {
      return this.generateEventExcel(events)
    }
  }

  private static generateUserCSV(users: any[]) {
    const headers = [
      'User ID',
      'Master Email',
      'Master Phone',
      'First Name',
      'Last Name',
      'Country',
      'Region',
      'City',
      'Total Clicks',
      'Total Leads',
      'Total Events',
      'Total Revenue',
      'Created At',
      'Last Seen',
      'Identifiers'
    ]

    const rows = users.map(user => [
      user.id,
      user.masterEmail || '',
      user.masterPhone || '',
      user.firstName || '',
      user.lastName || '',
      user.country || '',
      user.region || '',
      user.city || '',
      user.totalClicks,
      user.totalLeads,
      user.totalEvents,
      user.totalRevenue,
      user.createdAt.toISOString(),
      user.lastSeen.toISOString(),
      user.identifiers.map((id: any) => `${id.type}:${id.value}`).join('; ')
    ])

    return this.arrayToCSV([headers, ...rows])
  }

  private static generateLeadCSV(leads: any[]) {
    const headers = [
      'Lead ID',
      'User ID',
      'Email',
      'Phone',
      'First Name',
      'Last Name',
      'Campaign',
      'Source',
      'Medium',
      'Country',
      'City',
      'Quality Score',
      'Is Duplicate',
      'Value',
      'Currency',
      'Created At'
    ]

    const rows = leads.map(lead => [
      lead.id,
      lead.userId,
      lead.email || '',
      lead.phone || '',
      lead.firstName || '',
      lead.lastName || '',
      lead.campaign || '',
      lead.source || '',
      lead.medium || '',
      lead.country || '',
      lead.city || '',
      lead.qualityScore || 0,
      lead.isDuplicate ? 'Yes' : 'No',
      lead.value || 0,
      lead.currency || 'USD',
      lead.createdAt.toISOString()
    ])

    return this.arrayToCSV([headers, ...rows])
  }

  private static generateClickCSV(clicks: any[]) {
    const headers = [
      'Click ID',
      'User ID',
      'Click ID (External)',
      'Campaign',
      'Source',
      'Medium',
      'IP',
      'Country',
      'City',
      'Device',
      'Browser',
      'OS',
      'Is Mobile',
      'Is Bot',
      'Is VPN',
      'Created At'
    ]

    const rows = clicks.map(click => [
      click.id,
      click.userId || '',
      click.clickId || '',
      click.campaign || '',
      click.source || '',
      click.medium || '',
      click.ip,
      click.country || '',
      click.city || '',
      click.device || '',
      click.browser || '',
      click.os || '',
      click.isMobile ? 'Yes' : 'No',
      click.isBot ? 'Yes' : 'No',
      click.isVPN ? 'Yes' : 'No',
      click.createdAt.toISOString()
    ])

    return this.arrayToCSV([headers, ...rows])
  }

  private static generateEventCSV(events: any[]) {
    const headers = [
      'Event ID',
      'User ID',
      'Event Type',
      'Event Name',
      'Category',
      'Campaign',
      'Source',
      'Value',
      'Currency',
      'Is Revenue',
      'Is Converted',
      'Created At'
    ]

    const rows = events.map(event => [
      event.id,
      event.userId,
      event.eventType,
      event.eventName || '',
      event.category || '',
      event.campaign || '',
      event.source || '',
      event.value || 0,
      event.currency || 'USD',
      event.isRevenue ? 'Yes' : 'No',
      event.isConverted ? 'Yes' : 'No',
      event.createdAt.toISOString()
    ])

    return this.arrayToCSV([headers, ...rows])
  }

  private static async generateUserExcel(users: any[]) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Users')

    worksheet.columns = [
      { header: 'User ID', key: 'id', width: 20 },
      { header: 'Master Email', key: 'masterEmail', width: 25 },
      { header: 'Master Phone', key: 'masterPhone', width: 15 },
      { header: 'First Name', key: 'firstName', width: 15 },
      { header: 'Last Name', key: 'lastName', width: 15 },
      { header: 'Country', key: 'country', width: 12 },
      { header: 'Region', key: 'region', width: 15 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'Total Clicks', key: 'totalClicks', width: 12 },
      { header: 'Total Leads', key: 'totalLeads', width: 12 },
      { header: 'Total Events', key: 'totalEvents', width: 12 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Last Seen', key: 'lastSeen', width: 20 },
    ]

    users.forEach(user => {
      worksheet.addRow({
        id: user.id,
        masterEmail: user.masterEmail,
        masterPhone: user.masterPhone,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        region: user.region,
        city: user.city,
        totalClicks: user.totalClicks,
        totalLeads: user.totalLeads,
        totalEvents: user.totalEvents,
        totalRevenue: Number(user.totalRevenue),
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
      })
    })

    // Style the header
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    }

    return await workbook.xlsx.writeBuffer()
  }

  private static async generateLeadExcel(leads: any[]) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Leads')

    worksheet.columns = [
      { header: 'Lead ID', key: 'id', width: 20 },
      { header: 'User ID', key: 'userId', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'First Name', key: 'firstName', width: 15 },
      { header: 'Last Name', key: 'lastName', width: 15 },
      { header: 'Campaign', key: 'campaign', width: 20 },
      { header: 'Source', key: 'source', width: 15 },
      { header: 'Medium', key: 'medium', width: 15 },
      { header: 'Country', key: 'country', width: 12 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'Quality Score', key: 'qualityScore', width: 12 },
      { header: 'Is Duplicate', key: 'isDuplicate', width: 12 },
      { header: 'Value', key: 'value', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ]

    leads.forEach(lead => {
      worksheet.addRow({
        id: lead.id,
        userId: lead.userId,
        email: lead.email,
        phone: lead.phone,
        firstName: lead.firstName,
        lastName: lead.lastName,
        campaign: lead.campaign,
        source: lead.source,
        medium: lead.medium,
        country: lead.country,
        city: lead.city,
        qualityScore: lead.qualityScore,
        isDuplicate: lead.isDuplicate ? 'Yes' : 'No',
        value: Number(lead.value || 0),
        currency: lead.currency,
        createdAt: lead.createdAt,
      })
    })

    // Style the header
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    }

    return await workbook.xlsx.writeBuffer()
  }

  private static async generateClickExcel(clicks: any[]) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Clicks')

    worksheet.columns = [
      { header: 'Click ID', key: 'id', width: 20 },
      { header: 'User ID', key: 'userId', width: 20 },
      { header: 'External Click ID', key: 'clickId', width: 20 },
      { header: 'Campaign', key: 'campaign', width: 20 },
      { header: 'Source', key: 'source', width: 15 },
      { header: 'Medium', key: 'medium', width: 15 },
      { header: 'IP', key: 'ip', width: 15 },
      { header: 'Country', key: 'country', width: 12 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'Device', key: 'device', width: 12 },
      { header: 'Browser', key: 'browser', width: 12 },
      { header: 'OS', key: 'os', width: 12 },
      { header: 'Is Mobile', key: 'isMobile', width: 10 },
      { header: 'Is Bot', key: 'isBot', width: 10 },
      { header: 'Is VPN', key: 'isVPN', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ]

    clicks.forEach(click => {
      worksheet.addRow({
        id: click.id,
        userId: click.userId,
        clickId: click.clickId,
        campaign: click.campaign,
        source: click.source,
        medium: click.medium,
        ip: click.ip,
        country: click.country,
        city: click.city,
        device: click.device,
        browser: click.browser,
        os: click.os,
        isMobile: click.isMobile ? 'Yes' : 'No',
        isBot: click.isBot ? 'Yes' : 'No',
        isVPN: click.isVPN ? 'Yes' : 'No',
        createdAt: click.createdAt,
      })
    })

    // Style the header
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    }

    return await workbook.xlsx.writeBuffer()
  }

  private static async generateEventExcel(events: any[]) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Events')

    worksheet.columns = [
      { header: 'Event ID', key: 'id', width: 20 },
      { header: 'User ID', key: 'userId', width: 20 },
      { header: 'Event Type', key: 'eventType', width: 15 },
      { header: 'Event Name', key: 'eventName', width: 20 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Campaign', key: 'campaign', width: 20 },
      { header: 'Source', key: 'source', width: 15 },
      { header: 'Value', key: 'value', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Is Revenue', key: 'isRevenue', width: 12 },
      { header: 'Is Converted', key: 'isConverted', width: 12 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ]

    events.forEach(event => {
      worksheet.addRow({
        id: event.id,
        userId: event.userId,
        eventType: event.eventType,
        eventName: event.eventName,
        category: event.category,
        campaign: event.campaign,
        source: event.source,
        value: Number(event.value || 0),
        currency: event.currency,
        isRevenue: event.isRevenue ? 'Yes' : 'No',
        isConverted: event.isConverted ? 'Yes' : 'No',
        createdAt: event.createdAt,
      })
    })

    // Style the header
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    }

    return await workbook.xlsx.writeBuffer()
  }

  private static arrayToCSV(data: any[][]): string {
    return data.map(row =>
      row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`
        }
        return field
      }).join(',')
    ).join('\n')
  }
}