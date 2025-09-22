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

    const { prisma } = await import('@/lib/prisma')

    if (query) {
      // Search customers with simple schema
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
        orderBy: { createdAt: 'desc' },
        take: 50
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
      // List customers with pagination using CustomerService
      const { CustomerService } = await import('@/lib/customer-service')
      const result = await CustomerService.listCustomers(page, limit)

      return NextResponse.json({
        success: true,
        customers: result.customers,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      })
    }

  } catch (error) {
    console.error('Get customers error:', error)
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