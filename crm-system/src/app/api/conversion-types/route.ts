import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createConversionTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional()
})

// GET - List all conversion types
export async function GET() {
  try {
    const conversionTypes = await prisma.conversionType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            events: true,
            customerConversions: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: conversionTypes
    })
  } catch (error) {
    console.error('Error fetching conversion types:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch conversion types'
    }, { status: 500 })
  }
}

// POST - Create a new conversion type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createConversionTypeSchema.parse(body)

    const conversionType = await prisma.conversionType.create({
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: conversionType
    })
  } catch (error) {
    console.error('Error creating conversion type:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({
        success: false,
        error: 'Conversion type with this name already exists'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create conversion type'
    }, { status: 500 })
  }
}