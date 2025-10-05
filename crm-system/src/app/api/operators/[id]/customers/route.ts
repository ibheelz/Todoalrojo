import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const operatorId = params.id
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')

    console.log('🔄 Fetching customers for operator:', operatorId, 'stage:', stage)

    // Build where condition for journey state stage filter
    let journeyStateWhere: any = {
      operatorId: operatorId
    }

    if (stage && stage !== 'all') {
      journeyStateWhere.stage = parseInt(stage)
    }

    // Fetch customers with their journey states for this operator
    const customers = await prisma.customer.findMany({
      where: {
        journeyStates: {
          some: journeyStateWhere
        }
      },
      include: {
        journeyStates: {
          where: {
            operatorId: operatorId
          },
          select: {
            stage: true,
            depositCount: true,
            totalDepositValue: true,
            currentJourney: true,
            emailCount: true,
            smsCount: true,
            lastEmailAt: true,
            lastSmsAt: true,
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected format
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      masterEmail: customer.masterEmail,
      masterPhone: customer.masterPhone,
      firstName: customer.firstName,
      lastName: customer.lastName,
      journeyState: customer.journeyStates[0] ? {
        stage: customer.journeyStates[0].stage,
        depositCount: customer.journeyStates[0].depositCount,
        totalDepositValue: customer.journeyStates[0].totalDepositValue.toString(),
        currentJourney: customer.journeyStates[0].currentJourney,
        emailCount: customer.journeyStates[0].emailCount,
        smsCount: customer.journeyStates[0].smsCount,
        lastEmailAt: customer.journeyStates[0].lastEmailAt?.toISOString() || null,
        lastSmsAt: customer.journeyStates[0].lastSmsAt?.toISOString() || null,
      } : null
    }))

    console.log('✅ Found customers:', {
      total: transformedCustomers.length,
      byStage: stage !== 'all' ? `stage ${stage}` : 'all stages'
    })

    return NextResponse.json({
      success: true,
      customers: transformedCustomers,
      total: transformedCustomers.length
    })

  } catch (error) {
    console.error('❌ Get operator customers error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customers',
      details: error?.message
    }, { status: 500 })
  }
}
