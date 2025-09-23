import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createLinkSchema = z.object({
  originalUrl: z.string().url('Invalid URL format'),
  title: z.string().optional(),
  description: z.string().optional(),
  campaign: z.string().optional(),
  source: z.string().optional(),
  medium: z.string().optional(),
  content: z.string().optional(),
  term: z.string().optional(),
  customCode: z.string().optional(),
  customDomain: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  isPublic: z.boolean().default(true),
  allowBots: z.boolean().default(false),
  trackClicks: z.boolean().default(true),
})

function generateShortCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createLinkSchema.parse(body)

    let shortCode = validatedData.customCode

    // Generate or validate short code
    if (!shortCode) {
      let attempts = 0
      do {
        shortCode = generateShortCode()
        attempts++
        if (attempts > 10) {
          shortCode = generateShortCode(8) // Use longer code if too many collisions
          break
        }
      } while (await prisma.shortLink.findUnique({ where: { shortCode } }))
    } else {
      // Check if custom code is already taken
      const existing = await prisma.shortLink.findUnique({ where: { shortCode } })
      if (existing) {
        return NextResponse.json({
          success: false,
          error: 'Custom short code is already taken'
        }, { status: 400 })
      }
    }

    // Create the short link
    const shortLink = await prisma.shortLink.create({
      data: {
        shortCode,
        originalUrl: validatedData.originalUrl,
        title: validatedData.title,
        description: validatedData.description,
        campaign: validatedData.campaign,
        source: validatedData.source,
        medium: validatedData.medium,
        content: validatedData.content,
        term: validatedData.term,
        customDomain: validatedData.customDomain || 'localhost:3005',
        password: validatedData.password,
        expiresAt: validatedData.expiresAt,
        isPublic: validatedData.isPublic,
        allowBots: validatedData.allowBots,
        trackClicks: validatedData.trackClicks,
      }
    })

    const shortUrl = `http://${shortLink.customDomain}/s/${shortLink.shortCode}`

    return NextResponse.json({
      success: true,
      data: {
        ...shortLink,
        shortUrl
      }
    })

  } catch (error) {
    console.error('Create link error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create short link',
      details: error?.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const campaign = searchParams.get('campaign') || 'all'
    const isActive = searchParams.get('isActive')
    const offset = (page - 1) * limit

    // Build where conditions
    let whereConditions: any = {}

    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalUrl: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search, mode: 'insensitive' } },
        { campaign: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (campaign && campaign !== 'all') {
      whereConditions.campaign = campaign
    }

    if (isActive !== null && isActive !== undefined) {
      whereConditions.isActive = isActive === 'true'
    }

    // Get links with pagination
    const links = await prisma.shortLink.findMany({
      where: whereConditions,
      include: {
        _count: {
          select: {
            clicks: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    // Get total count
    const totalCount = await prisma.shortLink.count({ where: whereConditions })

    // Get summary statistics
    const summaryStats = await prisma.shortLink.aggregate({
      where: whereConditions,
      _count: true,
      _sum: {
        totalClicks: true,
        uniqueClicks: true
      }
    })

    // Get campaigns for filtering
    const campaigns = await prisma.shortLink.groupBy({
      by: ['campaign'],
      where: {
        ...whereConditions,
        campaign: { not: null }
      },
      _count: { campaign: true },
      orderBy: { _count: { campaign: 'desc' } }
    })

    // Enhance links with short URLs
    const enhancedLinks = links.map(link => ({
      ...link,
      shortUrl: `http://${link.customDomain}/s/${link.shortCode}`,
      clickCount: link._count.clicks
    }))

    const summary = {
      totalLinks: summaryStats._count || 0,
      totalClicks: Number(summaryStats._sum.totalClicks || 0),
      totalUniqueClicks: Number(summaryStats._sum.uniqueClicks || 0),
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      campaigns: campaigns.map(c => ({
        name: c.campaign,
        count: c._count.campaign
      }))
    }

    return NextResponse.json({
      success: true,
      links: enhancedLinks,
      summary
    })

  } catch (error) {
    console.error('Get links error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch links',
      details: error?.message
    }, { status: 500 })
  }
}