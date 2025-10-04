import { NextRequest, NextResponse } from 'next/server'
import { FraudService } from '@/lib/fraud-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const stats = await FraudService.getFraudStats(days)

    return NextResponse.json({
      success: true,
      stats,
      period: `${days} days`
    })

  } catch (error) {
    console.error('Fraud stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch fraud statistics'
    }, { status: 500 })
  }
}