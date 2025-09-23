import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emitStats } from '@/lib/event-bus'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ success: false, error: 'Missing campaign id' }, { status: 400 })

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        totalClicks: 0,
        totalLeads: 0,
        totalEvents: 0,
        registrations: 0,
        ftd: 0,
        approvedRegistrations: 0,
        qualifiedDeposits: 0,
      }
    })

    emitStats({ type: 'resetCampaign', payload: { id: updated.id } })
    return NextResponse.json({ success: true, id: updated.id })
  } catch (error) {
    console.error('Reset campaign stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to reset campaign stats' }, { status: 500 })
  }
}
