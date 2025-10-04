import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params
    console.log('🗺️ [JOURNEY] Fetching journey for customer:', customerId)

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        identifiers: true,
        clicks: {
          orderBy: { createdAt: 'asc' }
        },
        leads: {
          orderBy: { createdAt: 'asc' }
        },
        events: {
          orderBy: { eventTime: 'asc' }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found'
      }, { status: 404 })
    }

    // Build complete journey timeline
    const journeySteps = []

    // Add clicks to timeline
    customer.clicks.forEach(click => {
      journeySteps.push({
        id: click.id,
        type: 'CLICK',
        timestamp: click.clickTime,
        title: 'Landing Page Visit',
        description: `Visited ${click.landingPage || 'landing page'}`,
        data: {
          campaign: click.campaign,
          source: click.source,
          medium: click.medium,
          clickId: click.clickId,
          ip: click.ip,
          userAgent: click.userAgent,
          referrer: click.referrer,
          landingPage: click.landingPage,
          country: click.country,
          city: click.city,
          device: click.device,
          browser: click.browser,
          os: click.os,
          isMobile: click.isMobile,
          isTablet: click.isTablet,
          isDesktop: click.isDesktop
        },
        metadata: {
          icon: 'cursor-click',
          color: 'yellow'
        }
      })
    })

    // Add leads to timeline
    customer.leads.forEach(lead => {
      journeySteps.push({
        id: lead.id,
        type: 'LEAD',
        timestamp: lead.submittedAt,
        title: 'Lead Form Submission',
        description: `Submitted form with email: ${lead.email}`,
        data: {
          email: lead.email,
          phone: lead.phone,
          firstName: lead.firstName,
          lastName: lead.lastName,
          fullName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
          campaign: lead.campaign,
          source: lead.source,
          clickId: lead.clickId,
          isEmailValid: lead.isEmailValid,
          isPhoneValid: lead.isPhoneValid,
          customFields: lead.customFields,
          qualityScore: lead.qualityScore,
          value: lead.value,
          currency: lead.currency,
          formUrl: lead.formUrl
        },
        metadata: {
          icon: 'document-text',
          color: 'yellow'
        }
      })
    })

    // Add events to timeline
    customer.events.forEach(event => {
      const eventConfig = getEventConfig(event.eventType)

      journeySteps.push({
        id: event.id,
        type: 'EVENT',
        eventType: event.eventType,
        timestamp: event.eventTime,
        title: event.eventName || eventConfig.title,
        description: getEventDescription(event),
        data: {
          eventType: event.eventType,
          eventName: event.eventName,
          category: event.category,
          properties: event.properties,
          value: event.value,
          currency: event.currency,
          quantity: event.quantity,
          campaign: event.campaign,
          source: event.source,
          medium: event.medium,
          clickId: event.clickId,
          isConverted: event.isConverted,
          isRevenue: event.isRevenue
        },
        metadata: {
          icon: eventConfig.icon,
          color: eventConfig.color
        }
      })
    })

    // Sort all steps by timestamp
    journeySteps.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Find the click ID that led to the first conversion
    const firstConversionEvent = customer.events
      .filter(e => e.isConverted || e.isRevenue)
      .sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime())[0]

    const conversionClickId = firstConversionEvent?.clickId ||
      customer.leads.find(l => l.clickId)?.clickId ||
      customer.clicks[0]?.clickId || null

    // Calculate journey stats
    const stats = {
      totalSteps: journeySteps.length,
      totalClicks: customer.clicks.length,
      totalLeads: customer.leads.length,
      totalEvents: customer.events.length,
      totalRevenue: customer.totalRevenue,
      firstSeen: customer.firstSeen,
      lastSeen: customer.lastSeen,
      journeyDuration: customer.lastSeen.getTime() - customer.firstSeen.getTime(),
      conversionEvents: customer.events.filter(e => e.isConverted).length,
      revenueEvents: customer.events.filter(e => e.isRevenue).length
    }

    console.log('✅ [JOURNEY] Journey fetched successfully:', journeySteps.length, 'steps')

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          masterEmail: customer.masterEmail,
          masterPhone: customer.masterPhone,
          source: customer.source,
          country: customer.country,
          city: customer.city
        },
        identifiers: customer.identifiers,
        journey: journeySteps,
        stats,
        conversionClickId
      }
    })

  } catch (error) {
    console.error('❌ [JOURNEY] Error fetching journey:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

function getEventConfig(eventType: string) {
  const configs: Record<string, { title: string; icon: string; color: string }> = {
    CLICK: { title: 'Click', icon: 'cursor-click', color: 'yellow' },
    LEAD: { title: 'Lead Submission', icon: 'document-text', color: 'yellow' },
    REGISTRATION: { title: 'Account Registration', icon: 'user-plus', color: 'yellow' },
    LOGIN: { title: 'Login', icon: 'login', color: 'yellow' },
    DEPOSIT: { title: 'Deposit', icon: 'credit-card', color: 'yellow' },
    FTD: { title: 'First Time Deposit', icon: 'currency-dollar', color: 'yellow' },
    PURCHASE: { title: 'Purchase', icon: 'shopping-cart', color: 'yellow' },
    WITHDRAWAL: { title: 'Withdrawal', icon: 'cash', color: 'yellow' },
    BET: { title: 'Bet Placed', icon: 'dice', color: 'yellow' },
    WIN: { title: 'Win', icon: 'trophy', color: 'yellow' },
    LOSS: { title: 'Loss', icon: 'x-circle', color: 'yellow' },
    CUSTOM: { title: 'Custom Event', icon: 'lightning-bolt', color: 'yellow' }
  }

  return configs[eventType] || configs.CUSTOM
}

function getEventDescription(event: any): string {
  switch (event.eventType) {
    case 'FTD':
    case 'DEPOSIT':
      return `${event.eventType === 'FTD' ? 'First deposit' : 'Deposit'} of ${event.value} ${event.currency || 'USD'}`
    case 'PURCHASE':
      return `Purchased item for ${event.value} ${event.currency || 'USD'}`
    case 'WITHDRAWAL':
      return `Withdrew ${event.value} ${event.currency || 'USD'}`
    case 'BET':
      return `Placed bet of ${event.value} ${event.currency || 'USD'}`
    case 'WIN':
      return `Won ${event.value} ${event.currency || 'USD'}`
    case 'REGISTRATION':
      return 'Created account'
    case 'LOGIN':
      return 'Logged into account'
    default:
      return event.eventName || `${event.eventType} event`
  }
}