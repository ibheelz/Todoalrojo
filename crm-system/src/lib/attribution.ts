import { prisma } from '@/lib/prisma'

type CounterIncrements = {
  clicks?: number
  leads?: number
  events?: number
  registrations?: number
  ftd?: number
  revenue?: number
}

export async function incrementCampaignCounters(opts: { campaign?: string | null } & CounterIncrements) {
  const { campaign, clicks = 0, leads = 0, events = 0, registrations = 0, ftd = 0, revenue = 0 } = opts
  if (!campaign) return

  // Find campaign by slug or name (case-insensitive)
  const existing = await prisma.campaign.findFirst({
    where: {
      OR: [
        { slug: { equals: campaign, mode: 'insensitive' } },
        { name: { equals: campaign, mode: 'insensitive' } }
      ]
    }
  })
  if (!existing) return

  const data: any = {}
  if (clicks) data.totalClicks = { increment: clicks }
  if (leads) data.totalLeads = { increment: leads }
  if (events) data.totalEvents = { increment: events }
  if (registrations) data.registrations = (existing.registrations || 0) + registrations
  if (ftd) data.ftd = (existing.ftd || 0) + ftd
  if (revenue) data.totalRevenue = { increment: revenue }

  if (Object.keys(data).length > 0) {
    await prisma.campaign.update({ where: { id: existing.id }, data })
  }
}

export async function incrementInfluencerCountersByLinkId(linkId: string, inc: { clicks?: number; leads?: number; regs?: number; ftd?: number }) {
  if (!linkId) return
  const relations = await prisma.linkInfluencer.findMany({ where: { linkId }, select: { influencerId: true } })
  if (!relations.length) return

  await Promise.all(
    relations.map((rel) =>
      prisma.influencer.update({
        where: { id: rel.influencerId },
        data: {
          totalClicks: inc.clicks ? { increment: inc.clicks } : undefined,
          totalLeads: inc.leads ? { increment: inc.leads } : undefined,
          totalRegs: inc.regs ? { increment: inc.regs } : undefined,
          totalFtd: inc.ftd ? { increment: inc.ftd } : undefined,
        },
      })
    )
  )
}

export async function incrementInfluencerCountersByClickId(clickId?: string | null, inc?: { clicks?: number; leads?: number; regs?: number; ftd?: number }) {
  if (!clickId) return
  const lc = await prisma.linkClick.findUnique({ where: { clickId }, select: { linkId: true } })
  if (!lc?.linkId) return
  await incrementInfluencerCountersByLinkId(lc.linkId, inc || {})
}

