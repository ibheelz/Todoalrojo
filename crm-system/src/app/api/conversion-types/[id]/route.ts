import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateConversionTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
})

// GET - Get a specific conversion type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const conversionType = await prisma.conversionType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            events: true,
            customerConversions: true
          }
        }
      }
    })

    if (!conversionType) {
      return NextResponse.json({
        success: false,
        error: 'Conversion type not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: conversionType
    })
  } catch (error) {
    console.error('Error fetching conversion type:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch conversion type'
    }, { status: 500 })
  }
}

// PUT - Update a conversion type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const validatedData = updateConversionTypeSchema.parse(body)

    const conversionType = await prisma.conversionType.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: conversionType
    })
  } catch (error) {
    console.error('Error updating conversion type:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({
        success: false,
        error: 'Conversion type not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update conversion type'
    }, { status: 500 })
  }
}

// DELETE - Delete a conversion type (soft delete by setting isActive to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const conversionType = await prisma.conversionType.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      data: conversionType
    })
  } catch (error) {
    console.error('Error deleting conversion type:', error)

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({
        success: false,
        error: 'Conversion type not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete conversion type'
    }, { status: 500 })
  }
}