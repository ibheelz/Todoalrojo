export function getShortUrlDomain(): string {
  // In production, use environment variable or custom domain
  // In development, try to use ngrok URL if available, otherwise use localhost

  if (process.env.SHORT_URL_DOMAIN && process.env.SHORT_URL_DOMAIN !== 'example.short') {
    const protocol = process.env.SHORT_URL_PROTOCOL || 'https'
    return `${protocol}://${process.env.SHORT_URL_DOMAIN}`
  }

  // For development, try to detect ngrok URL from headers or environment
  if (process.env.NODE_ENV === 'development') {
    // You could also set NGROK_URL manually in .env when using ngrok
    if (process.env.NGROK_URL) {
      return process.env.NGROK_URL
    }

    // Default to localhost for development
    return `http://localhost:${process.env.PORT || 3005}`
  }

  // Production fallback
  return process.env.NEXTAUTH_URL || 'https://your-domain.com'
}

export function generateShortUrl(shortCode: string, customDomain?: string): string {
  let baseUrl = customDomain || getShortUrlDomain()

  // Ensure protocol is included
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    const protocol = process.env.SHORT_URL_PROTOCOL || 'https'
    baseUrl = `${protocol}://${baseUrl}`
  }

  return `${baseUrl}/s/${shortCode}`
}

export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return getShortUrlDomain().replace(/^https?:\/\//, '')
  }
}