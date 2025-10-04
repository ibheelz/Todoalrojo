import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['email', 'phone', 'clickId', 'any']).optional().default('any'),
  includeJourney: z.boolean().optional().default(false),
  limit: z.number().min(1).max(100).optional().default(20)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const validatedParams = searchSchema.parse({
      query: searchParams.get('query'),
      type: searchParams.get('type'),
      includeJourney: searchParams.get('includeJourney') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    })

    console.log('🔍 [JOURNEY-SEARCH] Searching for:', validatedParams)

    const { query, type, includeJourney, limit } = validatedParams

    let customers = []

    if (type === 'any') {
      // Search across all identifier types
      const identifiers = await prisma.identifier.findMany({
        where: {
          value: {
            contains: query,
            mode: 'insensitive'
          }
        },
        include: {
          customer: {
            include: {
              identifiers: true,
              _count: {
                select: {
                  clicks: true,
                  leads: true,
                  events: true
                }
              }
            }
          }
        },
        take: limit
      })

      // Also search customer names and other fields
      const directCustomers = await prisma.customer.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { masterEmail: { contains: query, mode: 'insensitive' } },
            { masterPhone: { contains: query, mode: 'insensitive' } },
            { source: { contains: query, mode: 'insensitive' } },
            { country: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } }
          ]
        },
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
        take: limit
      })

      // Combine and deduplicate results
      const customerMap = new Map()

      identifiers.forEach(identifier => {
        if (identifier.customer) {
          customerMap.set(identifier.customer.id, identifier.customer)
        }
      })

      directCustomers.forEach(customer => {
        customerMap.set(customer.id, customer)
      })

      customers = Array.from(customerMap.values())
    } else {
      // Search specific identifier type
      const identifierType = getIdentifierType(type)

      const identifiers = await prisma.identifier.findMany({
        where: {
          type: identifierType,
          value: {
            contains: query,
            mode: 'insensitive'
          }
        },
        include: {
          customer: {
            include: {
              identifiers: true,
              _count: {
                select: {
                  clicks: true,
                  leads: true,
                  events: true
                }
              }
            }
          }
        },
        take: limit
      })

      customers = identifiers.map(identifier => identifier.customer).filter(Boolean)
    }

    // If includeJourney is true, fetch full journey data for each customer
    const results = []

    for (const customer of customers) {
      let journeyData = null

      if (includeJourney) {
        const [clicks, leads, events] = await Promise.all([
          prisma.click.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'asc' },
            take: 50 // Limit to recent journey steps
          }),
          prisma.lead.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'asc' },
            take: 50
          }),
          prisma.event.findMany({
            where: { customerId: customer.id },
            orderBy: { eventTime: 'asc' },
            take: 50
          })
        ])

        journeyData = {
          totalSteps: clicks.length + leads.length + events.length,
          recentClicks: clicks.slice(-5),
          recentLeads: leads.slice(-5),
          recentEvents: events.slice(-5),
          lastActivity: Math.max(
            ...clicks.map(c => c.createdAt.getTime()),
            ...leads.map(l => l.createdAt.getTime()),
            ...events.map(e => e.eventTime.getTime())
          )
        }
      }

      results.push({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        masterEmail: customer.masterEmail,
        masterPhone: customer.masterPhone,
        source: customer.source,
        country: customer.country,
        city: customer.city,
        totalRevenue: customer.totalRevenue,
        firstSeen: customer.firstSeen,
        lastSeen: customer.lastSeen,
        isActive: customer.isActive,
        isFraud: customer.isFraud,
        identifiers: customer.identifiers.map(id => ({
          type: id.type,
          value: id.value,
          isVerified: id.isVerified,
          isPrimary: id.isPrimary
        })),
        counts: customer._count,
        journey: journeyData
      })
    }

    console.log('✅ [JOURNEY-SEARCH] Found', results.length, 'customers')

    return NextResponse.json({
      success: true,
      data: {
        query: validatedParams.query,
        type: validatedParams.type,
        results,
        total: results.length,
        hasMore: results.length === limit
      }
    })

  } catch (error) {
    console.error('❌ [JOURNEY-SEARCH] Error searching journeys:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

function getIdentifierType(type: string) {
  switch (type) {
    case 'email':
      return 'EMAIL'
    case 'phone':
      return 'PHONE'
    case 'clickId':
      return 'CLICK_ID'
    default:
      return 'EMAIL'
  }
}