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
    // Return default conversion types since ConversionType model doesn't exist yet
    const defaultConversionTypes = [
      { id: '1', name: 'FTD', description: 'First Time Deposit', isActive: true, createdAt: new Date(), updatedAt: new Date(), _count: { events: 0 } },
      { id: '2', name: 'Registration', description: 'User Registration', isActive: true, createdAt: new Date(), updatedAt: new Date(), _count: { events: 0 } },
      { id: '3', name: 'Deposit', description: 'Any Deposit', isActive: true, createdAt: new Date(), updatedAt: new Date(), _count: { events: 0 } },
      { id: '4', name: 'Withdrawal', description: 'Withdrawal', isActive: true, createdAt: new Date(), updatedAt: new Date(), _count: { events: 0 } },
    ]

    return NextResponse.json({
      success: true,
      data: defaultConversionTypes
    })
  } catch (error) {
    console.error('Error fetching conversion types:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch conversion types',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Create a new conversion type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createConversionTypeSchema.parse(body)

    // ConversionType model doesn't exist yet, return placeholder response
    return NextResponse.json({
      success: false,
      error: 'Conversion type creation not yet implemented - ConversionType model needs to be added to schema'
    }, { status: 501 })
  } catch (error) {
    console.error('Error creating conversion type:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create conversion type',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}