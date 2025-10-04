'use client'

import { useEffect, useMemo, useState } from 'react'

export default function LeadFormPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [ageVerification, setAgeVerification] = useState(false)
  const [promotionalConsent, setPromotionalConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<null | { message: string; redirectUrl?: string }>(null)
  const [error, setError] = useState<string | null>(null)

  // Extract tracking params from URL
  const tracking = useMemo(() => {
    if (typeof window === 'undefined') return {}
    const p = new URLSearchParams(window.location.search)
    return {
      clickId: p.get('clickId') || p.get('click_id') || undefined,
      campaign: p.get('campaign') || p.get('utm_campaign') || undefined,
      source: p.get('source') || p.get('utm_source') || 'lead-form',
      landingPage: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      redirectUrl: p.get('redirect') || undefined,
      language: navigator?.language,
      platform: navigator?.platform,
      userAgent: navigator?.userAgent,
    }
  }, [])

  useEffect(() => {
    // Basic theming polish: ensure dark background applied (root already uses dark)
    document.documentElement.classList.add('dark')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        fullName,
        email,
        phone,
        countryCode,
        ageVerification,
        promotionalConsent,
        emailVerified: false,
        phoneVerified: false,
        ...tracking,
      }

      const res = await fetch('/api/ingest/lead-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Submission failed')
      }
      setSuccess({ message: 'Thanks! Your details were submitted successfully.', redirectUrl: (tracking as any).redirectUrl })
      // Optional redirect after short delay
      if ((tracking as any).redirectUrl) {
        setTimeout(() => {
          window.location.href = (tracking as any).redirectUrl
        }, 1200)
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md premium-card">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-primary">Lead Form</h1>
          <p className="text-white/60 text-sm">Enter your details to get started</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="px-4 py-3 rounded-lg bg-green-500/20 text-green-200 border border-green-500/30">
              {success.message}
            </div>
            {success.redirectUrl && (
              <div className="text-white/60 text-sm">Redirecting…</div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/20 text-red-200 border border-red-500/30">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-white/80 mb-1">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                placeholder="jane@example.com"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm text-white/80 mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  placeholder="+1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-white/80 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  placeholder="555-123-4567"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input id="age" type="checkbox" checked={ageVerification} onChange={(e) => setAgeVerification(e.target.checked)} className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50" />
              <label htmlFor="age" className="text-sm text-white/80">I confirm I am over 18</label>
            </div>

            <div className="flex items-center gap-2">
              <input id="promo" type="checkbox" checked={promotionalConsent} onChange={(e) => setPromotionalConsent(e.target.checked)} className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50" />
              <label htmlFor="promo" className="text-sm text-white/80">I agree to receive promotional content</label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(253, 198, 0, 0.3)',
                boxShadow: '0 8px 32px rgba(253, 198, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                color: '#0a0a0a'
              }}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

