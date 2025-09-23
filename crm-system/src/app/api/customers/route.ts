import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  masterEmail: z.string().email('Invalid email format'),
  masterPhone: z.string().optional().transform(val => val === '' ? undefined : val),
  company: z.string().optional().transform(val => val === '' ? undefined : val),
  jobTitle: z.string().optional().transform(val => val === '' ? undefined : val),
  source: z.string().optional().transform(val => val === '' ? undefined : val),
  country: z.string().optional().transform(val => val === '' ? undefined : val),
  region: z.string().optional().transform(val => val === '' ? undefined : val),
  city: z.string().optional().transform(val => val === '' ? undefined : val),
  timezone: z.string().optional().transform(val => val === '' ? undefined : val),
  language: z.string().optional().transform(val => val === '' ? undefined : val),
  assignedTeam: z.array(z.string()).optional()
})

const updateCustomerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  masterEmail: z.string().email().optional(),
  masterPhone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  source: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  assignedTeam: z.array(z.string()).optional()
})

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('id')

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID is required'
      }, { status: 400 })
    }

    const { CustomerService } = await import('@/lib/customer-service')

    // Use CustomerService which handles cascade deletion properly
    const deletedCustomer = await CustomerService.deleteCustomer(customerId)

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
      deletedCustomer
    })

  } catch (error) {
    console.error('Delete customer error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete customer'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const query = searchParams.get('q')
    const includeRelated = searchParams.get('includeRelated') === 'true'

    console.log('👥 Fetching customers with parameters:', {
      page,
      limit,
      query,
      includeRelated,
      timestamp: new Date().toISOString()
    })

    const { prisma } = await import('@/lib/prisma')

    if (query) {
      console.log('🔍 Searching customers with query:', { query })

      // Search customers with related data if requested
      const customers = await prisma.customer.findMany({
        where: {
          OR: [
            { masterEmail: { contains: query, mode: 'insensitive' } },
            { masterPhone: { contains: query } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: includeRelated ? {
          clicks: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              campaign: true,
              source: true,
              medium: true,
              ip: true,
              createdAt: true
            }
          },
          leads: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              campaign: true,
              source: true,
              medium: true,
              value: true,
              createdAt: true
            }
          },
          events: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              eventType: true,
              campaign: true,
              value: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              clicks: true,
              leads: true,
              events: true
            }
          }
        } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      console.log('✅ Search results:', {
        totalFound: customers.length,
        withRelatedData: includeRelated
      })

      return NextResponse.json({
        success: true,
        customers,
        total: customers.length,
        page: 1,
        limit: customers.length,
        totalPages: 1
      })
    } else {
      console.log('📊 Fetching customers with pagination...')

      if (includeRelated) {
        // Get customers with related data directly
        const customers = await prisma.customer.findMany({
          include: {
            clicks: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                campaign: true,
                source: true,
                medium: true,
                ip: true,
                createdAt: true
              }
            },
            leads: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                campaign: true,
                source: true,
                medium: true,
                value: true,
                createdAt: true
              }
            },
            events: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                eventType: true,
                campaign: true,
                value: true,
                createdAt: true
              }
            },
            _count: {
              select: {
                clicks: true,
                leads: true,
                events: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        })

        const total = await prisma.customer.count()
        const totalPages = Math.ceil(total / limit)

        console.log('✅ Customers with related data loaded:', {
          totalCustomers: customers.length,
          totalClicks: customers.reduce((sum, c) => sum + (c._count?.clicks || 0), 0),
          totalLeads: customers.reduce((sum, c) => sum + (c._count?.leads || 0), 0),
          totalEvents: customers.reduce((sum, c) => sum + (c._count?.events || 0), 0),
          page,
          totalPages
        })

        return NextResponse.json({
          success: true,
          customers,
          total,
          page,
          limit,
          totalPages
        })
      } else {
        // List customers with pagination using CustomerService
        const { CustomerService } = await import('@/lib/customer-service')
        const result = await CustomerService.listCustomers(page, limit)

        console.log('✅ Basic customers loaded:', {
          totalCustomers: result.customers.length,
          page: result.page,
          totalPages: result.totalPages
        })

        return NextResponse.json({
          success: true,
          customers: result.customers,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        })
      }
    }

  } catch (error) {
    console.error('❌ Get customers error:', error)
    console.error('📊 Error details:', {
      name: error?.constructor?.name,
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'), // Limit stack trace
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customers'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCustomerSchema.parse(body)

    const { prisma } = await import('@/lib/prisma')

    // Simple customer creation
    const customer = await prisma.customer.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        masterEmail: validatedData.masterEmail,
        masterPhone: validatedData.masterPhone || null,
        company: validatedData.company || null,
        jobTitle: validatedData.jobTitle || null,
        source: validatedData.source || null,
        country: validatedData.country || null,
        region: validatedData.region || null,
        city: validatedData.city || null,
        timezone: validatedData.timezone || null,
        language: validatedData.language || null,
        assignedTeam: validatedData.assignedTeam || []
      }
    })

    return NextResponse.json({
      success: true,
      customer,
      message: 'Customer created successfully'
    })

  } catch (error) {
    console.error('Create customer error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create customer'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('id')

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID is required'
      }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateCustomerSchema.parse(body)

    const { prisma } = await import('@/lib/prisma')

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'Customer updated successfully'
    })

  } catch (error) {
    console.error('Update customer error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update customer'
    }, { status: 500 })
  }
}