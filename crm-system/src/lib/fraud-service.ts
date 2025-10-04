import { prisma } from './prisma'

export interface FraudAlert {
  id: string
  type: 'IP_SPAM' | 'EMAIL_SPAM' | 'PHONE_SPAM' | 'VPN_DETECTED' | 'BOT_DETECTED' | 'RAPID_FIRE' | 'DUPLICATE_BURST'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  data: any
  affectedEntities: string[]
  createdAt: Date
  resolved: boolean
}

export class FraudService {
  // Detect IP-based fraud patterns
  static async detectIPFraud(timeWindow = 60): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = []
    const since = new Date(Date.now() - timeWindow * 60 * 1000)

    // Same IP submitting multiple leads
    const ipSpam = await prisma.$queryRaw<Array<{ip: string, count: bigint, emails: string}>>`
      SELECT ip, COUNT(*) as count,
             STRING_AGG(DISTINCT email, ', ') as emails
      FROM leads
      WHERE created_at >= ${since} AND ip IS NOT NULL
      GROUP BY ip
      HAVING COUNT(*) >= 5
      ORDER BY count DESC
    `

    for (const spam of ipSpam) {
      alerts.push({
        id: `ip-spam-${spam.ip}-${Date.now()}`,
        type: 'IP_SPAM',
        severity: Number(spam.count) >= 10 ? 'CRITICAL' : 'HIGH',
        title: `IP Spam Detected: ${spam.ip}`,
        description: `IP ${spam.ip} submitted ${spam.count} leads in ${timeWindow} minutes`,
        data: { ip: spam.ip, count: spam.count, emails: spam.emails },
        affectedEntities: [spam.ip],
        createdAt: new Date(),
        resolved: false
      })
    }

    // Same IP with multiple different emails
    const ipEmailVariation = await prisma.$queryRaw<Array<{ip: string, email_count: bigint}>>`
      SELECT ip, COUNT(DISTINCT email) as email_count
      FROM leads
      WHERE created_at >= ${since} AND ip IS NOT NULL AND email IS NOT NULL
      GROUP BY ip
      HAVING COUNT(DISTINCT email) >= 3 AND COUNT(*) >= 5
    `

    for (const variation of ipEmailVariation) {
      alerts.push({
        id: `ip-email-variation-${variation.ip}-${Date.now()}`,
        type: 'EMAIL_SPAM',
        severity: 'HIGH',
        title: `Email Variation Fraud: ${variation.ip}`,
        description: `IP ${variation.ip} used ${variation.email_count} different emails`,
        data: { ip: variation.ip, emailCount: variation.email_count },
        affectedEntities: [variation.ip],
        createdAt: new Date(),
        resolved: false
      })
    }

    return alerts
  }

  // Detect rapid-fire submissions
  static async detectRapidFire(timeWindow = 5): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = []
    const since = new Date(Date.now() - timeWindow * 60 * 1000)

    // Multiple leads from same user in short time
    const rapidFire = await prisma.$queryRaw<Array<{user_id: string, count: bigint, emails: string}>>`
      SELECT user_id, COUNT(*) as count,
             STRING_AGG(DISTINCT email, ', ') as emails
      FROM leads
      WHERE created_at >= ${since} AND user_id IS NOT NULL
      GROUP BY user_id
      HAVING COUNT(*) >= 3
    `

    for (const rapid of rapidFire) {
      alerts.push({
        id: `rapid-fire-${rapid.user_id}-${Date.now()}`,
        type: 'RAPID_FIRE',
        severity: Number(rapid.count) >= 5 ? 'HIGH' : 'MEDIUM',
        title: `Rapid Fire Detected: User ${rapid.user_id}`,
        description: `User submitted ${rapid.count} leads in ${timeWindow} minutes`,
        data: { userId: rapid.user_id, count: rapid.count, emails: rapid.emails },
        affectedEntities: [rapid.user_id],
        createdAt: new Date(),
        resolved: false
      })
    }

    return alerts
  }

  // Detect VPN and proxy usage
  static async detectVPNUsage(): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = []

    // Get recent VPN-flagged clicks
    const vpnClicks = await prisma.click.findMany({
      where: {
        isVPN: true,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            masterEmail: true,
            totalLeads: true
          }
        }
      },
      take: 50
    })

    if (vpnClicks.length > 0) {
      // Group by IP
      const vpnByIP = vpnClicks.reduce((acc, click) => {
        if (!acc[click.ip]) {
          acc[click.ip] = []
        }
        acc[click.ip].push(click)
        return acc
      }, {} as Record<string, typeof vpnClicks>)

      for (const [ip, clicks] of Object.entries(vpnByIP)) {
        if (clicks.length >= 3) {
          alerts.push({
            id: `vpn-detected-${ip}-${Date.now()}`,
            type: 'VPN_DETECTED',
            severity: 'MEDIUM',
            title: `VPN Usage Detected: ${ip}`,
            description: `${clicks.length} VPN connections from IP ${ip}`,
            data: { ip, clickCount: clicks.length, users: clicks.map(c => c.user?.id).filter(Boolean) },
            affectedEntities: [ip],
            createdAt: new Date(),
            resolved: false
          })
        }
      }
    }

    return alerts
  }

  // Detect bot activity
  static async detectBotActivity(): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = []

    // Get recent bot-flagged clicks
    const botClicks = await prisma.click.findMany({
      where: {
        isBot: true,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        ip: true,
        userAgent: true,
        campaign: true,
        createdAt: true
      },
      take: 100
    })

    if (botClicks.length > 10) {
      // Group by user agent
      const botsByUA = botClicks.reduce((acc, click) => {
        const ua = click.userAgent || 'unknown'
        if (!acc[ua]) {
          acc[ua] = []
        }
        acc[ua].push(click)
        return acc
      }, {} as Record<string, typeof botClicks>)

      for (const [userAgent, clicks] of Object.entries(botsByUA)) {
        if (clicks.length >= 5) {
          alerts.push({
            id: `bot-detected-${userAgent.slice(0, 20)}-${Date.now()}`,
            type: 'BOT_DETECTED',
            severity: 'HIGH',
            title: `Bot Activity Detected`,
            description: `${clicks.length} bot clicks detected from same user agent`,
            data: { userAgent, clickCount: clicks.length, campaigns: [...new Set(clicks.map(c => c.campaign))] },
            affectedEntities: [userAgent],
            createdAt: new Date(),
            resolved: false
          })
        }
      }
    }

    return alerts
  }

  // Detect duplicate bursts
  static async detectDuplicateBursts(): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = []
    const since = new Date(Date.now() - 60 * 60 * 1000) // Last hour

    // Get campaigns with high duplicate rates
    const campaignDuplicates = await prisma.$queryRaw<Array<{
      campaign: string,
      total_leads: bigint,
      duplicate_leads: bigint,
      duplicate_rate: number
    }>>`
      SELECT campaign,
             COUNT(*) as total_leads,
             SUM(CASE WHEN is_duplicate = true THEN 1 ELSE 0 END) as duplicate_leads,
             (SUM(CASE WHEN is_duplicate = true THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as duplicate_rate
      FROM leads
      WHERE created_at >= ${since} AND campaign IS NOT NULL
      GROUP BY campaign
      HAVING COUNT(*) >= 10 AND (SUM(CASE WHEN is_duplicate = true THEN 1 ELSE 0 END)::float / COUNT(*)) >= 0.5
    `

    for (const dup of campaignDuplicates) {
      alerts.push({
        id: `duplicate-burst-${dup.campaign}-${Date.now()}`,
        type: 'DUPLICATE_BURST',
        severity: dup.duplicate_rate >= 80 ? 'CRITICAL' : 'HIGH',
        title: `Duplicate Burst: ${dup.campaign}`,
        description: `Campaign has ${dup.duplicate_rate.toFixed(1)}% duplicate rate (${dup.duplicate_leads}/${dup.total_leads} leads)`,
        data: { campaign: dup.campaign, totalLeads: dup.total_leads, duplicateLeads: dup.duplicate_leads, duplicateRate: dup.duplicate_rate },
        affectedEntities: [dup.campaign],
        createdAt: new Date(),
        resolved: false
      })
    }

    return alerts
  }

  // Run comprehensive fraud detection
  static async detectAllFraud(): Promise<FraudAlert[]> {
    const [ipFraud, rapidFire, vpnFraud, botFraud, duplicateFraud] = await Promise.all([
      this.detectIPFraud(),
      this.detectRapidFire(),
      this.detectVPNUsage(),
      this.detectBotActivity(),
      this.detectDuplicateBursts()
    ])

    return [
      ...ipFraud,
      ...rapidFire,
      ...vpnFraud,
      ...botFraud,
      ...duplicateFraud
    ].sort((a, b) => {
      // Sort by severity, then by creation time
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }

  // Get fraud statistics
  static async getFraudStats(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [clickStats, leadStats, userStats] = await Promise.all([
      // Click fraud stats
      prisma.click.aggregate({
        where: { createdAt: { gte: since } },
        _count: {
          _all: true,
          isBot: true,
          isVPN: true,
          isFraud: true
        }
      }),
      // Lead duplicate stats
      prisma.lead.aggregate({
        where: { createdAt: { gte: since } },
        _count: {
          _all: true,
          isDuplicate: true
        }
      }),
      // Flagged users
      prisma.customer.count({
        where: {
          isFraud: true,
          updatedAt: { gte: since }
        }
      })
    ])

    const totalClicks = clickStats._count._all || 0
    const totalLeads = leadStats._count._all || 0

    return {
      totalClicks,
      totalLeads,
      fraudClicks: clickStats._count.isFraud || 0,
      botClicks: clickStats._count.isBot || 0,
      vpnClicks: clickStats._count.isVPN || 0,
      duplicateLeads: leadStats._count.isDuplicate || 0,
      flaggedUsers: userStats,
      fraudClickRate: totalClicks > 0 ? ((clickStats._count.isFraud || 0) / totalClicks * 100) : 0,
      botClickRate: totalClicks > 0 ? ((clickStats._count.isBot || 0) / totalClicks * 100) : 0,
      vpnClickRate: totalClicks > 0 ? ((clickStats._count.isVPN || 0) / totalClicks * 100) : 0,
      duplicateLeadRate: totalLeads > 0 ? ((leadStats._count.isDuplicate || 0) / totalLeads * 100) : 0,
    }
  }
}