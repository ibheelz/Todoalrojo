import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

interface Props {
  params: { shortCode: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

async function detectDevice(userAgent: string): Promise<{ device: string; isMobile: boolean; isTablet: boolean; isDesktop: boolean; browser: string; os: string; isBot: boolean }> {
  const ua = userAgent.toLowerCase()

  // Bot detection
  const isBot = /bot|crawler|spider|crawling|facebook|twitter|google|bing|msn|duckduckbot|teoma|slurp|yandex/i.test(userAgent)

  // Device detection
  let device = 'unknown'
  let isMobile = false
  let isTablet = false
  let isDesktop = false

  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    device = 'mobile'
    isMobile = true
  } else if (/tablet|ipad/i.test(ua)) {
    device = 'tablet'
    isTablet = true
  } else {
    device = 'desktop'
    isDesktop = true
  }

  // Browser detection
  let browser = 'unknown'
  if (ua.includes('chrome')) browser = 'chrome'
  else if (ua.includes('firefox')) browser = 'firefox'
  else if (ua.includes('safari')) browser = 'safari'
  else if (ua.includes('edge')) browser = 'edge'
  else if (ua.includes('opera')) browser = 'opera'

  // OS detection
  let os = 'unknown'
  if (ua.includes('windows')) os = 'windows'
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macos'
  else if (ua.includes('linux')) os = 'linux'
  else if (ua.includes('android')) os = 'android'
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'ios'

  return { device, isMobile, isTablet, isDesktop, browser, os, isBot }
}

async function getGeoLocation(ip: string): Promise<{ country?: string; region?: string; city?: string }> {
  // In production, you would use a service like ipapi.co, ipgeolocation.io, etc.
  // For now, return empty object
  try {
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { country: 'Local', region: 'Local', city: 'Local' }
    }
    // You can integrate with IP geolocation service here
    return {}
  } catch (error) {
    return {}
  }
}

function generateClickId(): string {
  return 'click_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export default async function ShortLinkRedirect({ params, searchParams }: Props) {
  const { shortCode } = params
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || ''
  const realIP = headersList.get('x-real-ip') || headersList.get('x-forwarded-for') || '127.0.0.1'
  const ip = Array.isArray(realIP) ? realIP[0] : realIP.split(',')[0].trim()
  const referrer = headersList.get('referer') || ''

  try {
    // Find the short link
    const shortLink = await prisma.shortLink.findUnique({
      where: { shortCode }
    })

    if (!shortLink) {
      redirect('/404')
    }

    // Check if link is active
    if (!shortLink.isActive) {
      redirect('/link-inactive')
    }

    // Check if link has expired
    if (shortLink.expiresAt && new Date() > shortLink.expiresAt) {
      redirect('/link-expired')
    }

    // Detect device and browser info
    const deviceInfo = await detectDevice(userAgent)

    // Get geolocation data
    const geoData = await getGeoLocation(ip)

    // Check if this should be tracked
    const shouldTrack = shortLink.trackClicks && (!deviceInfo.isBot || shortLink.allowBots)

    if (shouldTrack) {
      try {
        // Generate unique click ID
        const clickId = generateClickId()

        // Check if this is a unique click (same IP within last hour = not unique)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const recentClick = await prisma.linkClick.findFirst({
          where: {
            linkId: shortLink.id,
            ip: ip,
            createdAt: { gte: oneHourAgo }
          }
        })

        const isUnique = !recentClick

        // Create click record in LinkClick table for link-specific analytics
        await prisma.linkClick.create({
          data: {
            linkId: shortLink.id,
            shortCode: shortLink.shortCode,
            clickId,
            ip,
            userAgent,
            referrer: referrer || null,
            country: geoData.country || null,
            region: geoData.region || null,
            city: geoData.city || null,
            device: deviceInfo.device,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            isMobile: deviceInfo.isMobile,
            isTablet: deviceInfo.isTablet,
            isDesktop: deviceInfo.isDesktop,
            isBot: deviceInfo.isBot,
            isUnique
          }
        })

        // Also create click record in main Click table for general analytics
        await prisma.click.create({
          data: {
            clickId,
            ip,
            userAgent,
            referrer: referrer || null,
            landingPage: shortLink.originalUrl,
            campaign: shortLink.campaign || null,
            source: shortLink.source || 'short-link',
            medium: shortLink.medium || 'link-shortener',
            content: shortLink.content || null,
            term: shortLink.term || null,
            country: geoData.country || null,
            region: geoData.region || null,
            city: geoData.city || null,
            device: deviceInfo.device,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            isMobile: deviceInfo.isMobile,
            isTablet: deviceInfo.isTablet,
            isDesktop: deviceInfo.isDesktop,
            isBot: deviceInfo.isBot,
            clickTime: new Date()
          }
        })

        // Update link statistics
        await prisma.shortLink.update({
          where: { id: shortLink.id },
          data: {
            totalClicks: { increment: 1 },
            uniqueClicks: isUnique ? { increment: 1 } : undefined,
            lastClickAt: new Date()
          }
        })

        // Try to find or create customer if possible
        if (ip && !deviceInfo.isBot) {
          // This integration point connects to your existing customer tracking
          try {
            // You can expand this to integrate with your customer identification logic
            // For now, we'll just log the click for potential future customer matching
          } catch (error) {
            console.error('Customer tracking error:', error)
          }
        }

      } catch (trackingError) {
        console.error('Click tracking error:', trackingError)
        // Continue with redirect even if tracking fails
      }
    }

    // Redirect to the original URL
    redirect(shortLink.originalUrl)

  } catch (error) {
    // Check if this is a Next.js redirect error (which should be allowed to bubble up)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }

    console.error('Short link redirect error:', error)
    redirect('/error')
  }
}