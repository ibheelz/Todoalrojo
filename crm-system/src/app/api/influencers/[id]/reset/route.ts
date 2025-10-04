import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emitStats } from '@/lib/event-bus'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ success: false, error: 'Missing influencer id' }, { status: 400 })
    console.log('[RESET INFLUENCER] Request for id=', id)

    const updated = await prisma.influencer.update({
      where: { id },
      data: {
        resetAt: new Date(),
        totalClicks: 0,
        totalLeads: 0,
        totalRegs: 0,
        totalFtd: 0,
      }
    })

    console.log('[RESET INFLUENCER] Updated and zeroed counters for id=', updated.id)
    emitStats({ type: 'resetInfluencer', payload: { id: updated.id } })
    return NextResponse.json({ success: true, id: updated.id })
  } catch (error) {
    console.error('Reset influencer stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to reset influencer stats' }, { status: 500 })
  }
}
