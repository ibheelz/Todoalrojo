import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seed = searchParams.get('seed')
    const size = searchParams.get('size') || '40'

    if (!seed) {
      return NextResponse.json({ error: 'Seed parameter is required' }, { status: 400 })
    }

    // Construct DiceBear URL
    const dicebearUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=374151&radius=50`

    // Fetch from DiceBear with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(dicebearUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Miela-CRM/1.0'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`DiceBear API returned ${response.status}`)
      }

      const svgContent = await response.text()

      // Return SVG with proper headers
      return new NextResponse(svgContent, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Access-Control-Allow-Origin': '*'
        }
      })

    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('DiceBear fetch error:', fetchError)

      // Return a simple SVG fallback with initials
      const initials = seed.substring(0, 2).toUpperCase()
      const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4']
      const color = colors[Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length]

      const fallbackSvg = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${parseInt(size) / 2}" cy="${parseInt(size) / 2}" r="${parseInt(size) / 2}" fill="${color}"/>
          <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="${parseInt(size) * 0.4}" font-weight="bold">${initials}</text>
        </svg>
      `.trim()

      return new NextResponse(fallbackSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600', // Cache fallback for 1 hour
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

  } catch (error) {
    console.error('Avatar API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}