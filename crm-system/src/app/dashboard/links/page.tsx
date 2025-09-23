'use client'

import { useState, useEffect } from 'react'

interface ShortLink {
  id: string
  shortCode: string
  originalUrl: string
  title?: string
  description?: string
  campaign?: string
  source?: string
  medium?: string
  customDomain: string
  shortUrl: string
  isActive: boolean
  isPublic: boolean
  totalClicks: number
  uniqueClicks: number
  lastClickAt?: string
  createdAt: string
  clickCount: number
  influencerId?: string | null
}

interface LinkSummary {
  totalLinks: number
  totalClicks: number
  totalUniqueClicks: number
  totalPages: number
  currentPage: number
  campaigns: Array<{ name: string; count: number }>
}

interface Campaign {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface Influencer {
  id: string
  name: string
  email: string | null
  socialHandle: string | null
  platform: string
  status: string
}

export default function LinksPage() {
  const [links, setLinks] = useState<ShortLink[]>([])
  const [summary, setSummary] = useState<LinkSummary | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null)
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'compact' | 'table'>('compact')
  const [highlightMap, setHighlightMap] = useState<Record<string, number>>({})
  const [toasts, setToasts] = useState<Array<{ id: string; text: string }>>([])
  const [formData, setFormData] = useState({
    originalUrl: '',
    title: '',
    description: '',
    campaign: '',
    source: '',
    medium: '',
    customCode: '',
    influencerIds: [],
    isPublic: true,
    allowBots: false,
    trackClicks: true
  })

  useEffect(() => {
    fetchLinks()
    fetchCampaigns()
    fetchInfluencers()
  }, [page, searchTerm, selectedCampaign])

  // Live updates via SSE: refresh on clicks/leads/ftd/resets
  useEffect(() => {
    const es = new EventSource('/api/events')
    const onStats = (e: MessageEvent) => {
      try {
        const evt = JSON.parse((e as MessageEvent).data)
        // console.debug('[LINKS PAGE] SSE event', evt)
        if (!evt || !evt.type) return
        if (['click', 'lead', 'ftd', 'resetInfluencer', 'resetCampaign'].includes(evt.type)) {
          fetchLinks()
          // Toasts
          if (evt.type === 'click') addToast('New click detected')
          if (evt.type === 'lead') addToast('New lead recorded')
          if (evt.type === 'ftd') addToast('New FTD conversion')
          if (evt.type === 'resetInfluencer' || evt.type === 'resetCampaign') addToast('Stats were reset')
        }
      } catch {}
    }
    // @ts-ignore - EventSource typings
    es.addEventListener('stats', onStats)
    return () => es.close()
  }, [page, searchTerm, selectedCampaign])

  // Auto-set compact mode for smaller devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setViewMode('compact')
      }
    }

    // Set initial mode based on screen size
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Helper function to get influencer name
  const getInfluencerName = (influencerId: string | null | undefined): string => {
    if (!influencerId) return '—'
    const influencer = influencers.find(inf => inf.id === influencerId)
    return influencer ? `${influencer.name} (${influencer.socialHandle})` : 'Unknown Influencer'
  }

  // Helper function to get campaign name from slug
  const getCampaignName = (campaignSlug: string | null | undefined): string => {
    if (!campaignSlug) return '—'
    const campaign = campaigns.find(c => c.slug === campaignSlug)
    return campaign ? campaign.name : campaignSlug
  }

  // Get influencers for selected campaign
  const getAvailableInfluencers = () => {
    if (!formData.campaign) return influencers

    // Find campaigns that match the selected campaign slug and get their influencers
    const selectedCampaign = campaigns.find(c => c.slug === formData.campaign)
    if (!selectedCampaign) return influencers

    // For now, return all influencers but we could filter based on campaign-influencer relationships
    return influencers
  }

  const fetchCampaigns = async () => {
    try {
      console.log('📊 Fetching campaigns for links page...', { timestamp: new Date().toISOString() })
      const response = await fetch('/api/campaigns')
      const data = await response.json()

      if (data.success) {
        // Filter only active campaigns
        const activeCampaigns = data.campaigns.filter((campaign: Campaign) => campaign.isActive)
        setCampaigns(activeCampaigns)
        console.log('✅ Campaigns loaded for links:', {
          totalCampaigns: data.campaigns.length,
          activeCampaigns: activeCampaigns.length,
          campaigns: activeCampaigns.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
        })
      }
    } catch (error) {
      console.error('❌ Error fetching campaigns:', error)
    }
  }

  const fetchInfluencers = async () => {
    try {
      console.log('👤 Fetching influencers for links page...', { timestamp: new Date().toISOString() })
      const response = await fetch('/api/influencers?activeOnly=true')
      const data = await response.json()

      if (data.success) {
        setInfluencers(data.influencers)
        console.log('✅ Influencers loaded for links:', {
          totalInfluencers: data.influencers.length,
          influencers: data.influencers.map(i => ({ id: i.id, name: i.name, socialHandle: i.socialHandle, platform: i.platform }))
        })
      }
    } catch (error) {
      console.error('❌ Error fetching influencers:', error)
    }
  }

  const fetchLinks = async () => {
    try {
      const beforeById: Record<string, { clicks: number; unique: number }> = {}
      for (const l of links) beforeById[l.id] = { clicks: l.totalClicks, unique: l.uniqueClicks }
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchTerm,
        campaign: selectedCampaign
      })

      console.log('🔗 Fetching links...', {
        filters: { page, searchTerm, selectedCampaign },
        timestamp: new Date().toISOString()
      })

      const response = await fetch(`/api/links?${params}`)
      const data = await response.json()

      if (data.success) {
        const changedIds: string[] = []
        for (const l of data.links as ShortLink[]) {
          const prev = beforeById[l.id]
          if (prev && (l.totalClicks > prev.clicks || l.uniqueClicks > prev.unique)) changedIds.push(l.id)
        }

        setLinks(data.links)
        setSummary(data.summary)
        if (changedIds.length) {
          setHighlightMap((prev) => {
            const next = { ...prev }
            const now = Date.now()
            changedIds.forEach((id) => (next[id] = now))
            return next
          })
          setTimeout(() => {
            setHighlightMap((prev) => {
              const next: Record<string, number> = { ...prev }
              changedIds.forEach((id) => delete next[id])
              return next
            })
          }, 2500)
        }
        console.log('✅ Links loaded successfully:', {
          totalLinks: data.links.length,
          summary: data.summary,
          linksWithCampaigns: data.links.filter(l => l.campaign).length,
          linksWithInfluencers: data.links.filter(l => l.influencerId).length
        })
      }
    } catch (error) {
      console.error('❌ Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingLink ? `/api/links/${editingLink.id}` : '/api/links'
      const method = editingLink ? 'PUT' : 'POST'

      console.log('💾 Saving link...', {
        method,
        linkId: editingLink?.id,
        formData,
        timestamp: new Date().toISOString()
      })

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Link saved successfully:', {
          linkId: result.data?.id,
          shortCode: result.data?.shortCode,
          campaign: result.data?.campaign,
          influencerId: result.data?.influencerId
        })
        await fetchLinks()
        resetForm()
        alert(editingLink ? 'Link updated successfully!' : 'Link created successfully!')
      } else {
        console.error('❌ Error saving link:', result.error)
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('❌ Error saving link:', error)
      alert('Error saving link')
    }
  }

  const handleEdit = (link: ShortLink) => {
    setEditingLink(link)
    setFormData({
      originalUrl: link.originalUrl,
      title: link.title || '',
      description: link.description || '',
      campaign: link.campaign || '',
      source: link.source || '',
      medium: link.medium || '',
      customCode: '',
      influencerIds: link.influencerIds || [],
      isPublic: link.isPublic,
      allowBots: false,
      trackClicks: true
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return

    try {
      const response = await fetch(`/api/links/${id}`, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        await fetchLinks()
        alert('Link deleted successfully!')
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting link:', error)
      alert('Error deleting link')
    }
  }

  const handleToggleActive = async (link: ShortLink) => {
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.isActive })
      })

      const result = await response.json()

      if (result.success) {
        await fetchLinks()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error toggling link status:', error)
      alert('Error updating link status')
    }
  }

  const resetForm = () => {
    setFormData({
      originalUrl: '',
      title: '',
      description: '',
      campaign: '',
      source: '',
      medium: '',
      customCode: '',
      influencerIds: [],
      isPublic: true,
      allowBots: false,
      trackClicks: true
    })
    setEditingLink(null)
    setShowCreateModal(false)
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('URL copied to clipboard!')
  }

  // Toasts container
  const Toasts = () => (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((t) => (
        <div key={t.id} className="px-3 py-2 rounded-lg bg-white text-black text-sm shadow-lg border border-black/10">
          {t.text}
        </div>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              Link Shortener
            </h1>
            <p className="text-white/60 text-sm sm:text-base mt-1">Create and manage short links with detailed analytics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="premium-card p-8 shimmer">
              <div className="space-y-4">
                <div className="h-6 bg-muted/20 rounded w-2/3"></div>
                <div className="h-4 bg-muted/20 rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-8 bg-muted/20 rounded"></div>
                  <div className="h-8 bg-muted/20 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-2 xxs:space-y-1 xs:space-y-3 sm:space-y-6 p-1 xxs:p-1 xs:p-2 sm:p-4 lg:p-6">
        <Toasts />
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                Link Shortener
              </h1>
              <p className="text-white/60 text-sm sm:text-base mt-1">Create and manage short links with detailed analytics</p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle - Hidden on smaller screens */}
              <div className="hidden xl:flex bg-white/5 rounded-xl p-1 border border-white/10 backdrop-blur-sm">
                {/* Compact View */}
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'compact'
                      ? 'text-black'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                  style={{
                    background: viewMode === 'compact'
                      ? 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))'
                      : 'transparent'
                  }}
                  title="Compact view"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 18h17v-6H4v6zM4 5v6h17V5H4z"/>
                  </svg>
                </button>

                {/* Table View */}
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'text-black'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                  style={{
                    background: viewMode === 'table'
                      ? 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))'
                      : 'transparent'
                  }}
                  title="Table view"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h18c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm0 2v3h18V5H3zm0 5v3h8v-3H3zm10 0v3h8v-3h-8zm-10 5v3h8v-3H3zm10 0v3h8v-3h-8z"/>
                  </svg>
                </button>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 h-[52px] flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(253, 198, 0, 0.3)',
                  boxShadow: '0 8px 32px rgba(253, 198, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  color: '#0a0a0a'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="flex-shrink-0">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span className="whitespace-nowrap">Create Link</span>
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="premium-card">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{summary.totalLinks.toLocaleString()}</p>
                    <p className="text-white/60 text-sm">Total Links</p>
                  </div>
                </div>
              </div>

              <div className="premium-card">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{summary.totalClicks.toLocaleString()}</p>
                    <p className="text-white/60 text-sm">Total Clicks</p>
                  </div>
                </div>
              </div>

              <div className="premium-card">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{summary.totalUniqueClicks.toLocaleString()}</p>
                    <p className="text-white/60 text-sm">Unique Clicks</p>
                  </div>
                </div>
              </div>

              <div className="premium-card">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {summary.totalClicks > 0 ? ((summary.totalUniqueClicks / summary.totalClicks) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-white/60 text-sm">Unique Rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="premium-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, URL, or campaign..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Campaign</label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                >
                  <option value="all" className="bg-background">All Campaigns</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.slug} className="bg-background">
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCampaign('all')
                    setPage(1)
                  }}
                  className="w-full px-4 py-3 border border-white/20 text-white/80 rounded-xl hover:bg-white/5 transition-colors backdrop-blur-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Links Display */}
        {links.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 mx-auto mb-6 text-primary">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {searchTerm ? 'No links match your search' : 'No links found'}
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto leading-relaxed">
              {searchTerm
                ? 'Try adjusting your search terms or clear the filter to see all links'
                : 'Create your first short link to start tracking clicks and managing campaigns.'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all duration-300 whitespace-nowrap mx-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(253, 198, 0, 0.3)',
                  boxShadow: '0 8px 32px rgba(253, 198, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  color: '#0a0a0a'
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Create Link</span>
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-white/80 font-medium min-w-[200px]">Title & Link</th>
                    <th className="text-left py-4 px-4 text-white/80 font-medium min-w-[150px]">Campaign</th>
                    <th className="text-left py-4 px-4 text-white/80 font-medium min-w-[150px]">Influencer</th>
                    <th className="text-left py-4 px-4 text-white/80 font-medium min-w-[100px]">Clicks</th>
                    <th className="text-left py-4 px-4 text-white/80 font-medium min-w-[80px]">Status</th>
                    <th className="text-left py-4 px-4 text-white/80 font-medium min-w-[100px]">Created</th>
                    <th className="text-right py-4 px-4 text-white/80 font-medium min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium text-sm">
                              {link.title || 'Untitled Link'}
                            </h3>
                            <button
                              onClick={() => copyToClipboard(link.shortUrl)}
                              className="text-white/40 hover:text-primary transition-colors"
                              title="Copy URL"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          <code className="text-primary font-mono text-xs bg-primary/10 px-2 py-1 rounded">
                            /{link.shortCode}
                          </code>
                          <div className="text-white/60 text-xs mt-1 truncate max-w-xs" title={link.originalUrl}>
                            {link.originalUrl}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {link.campaign ? (
                          <span className="inline-block px-2 py-1 text-xs rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {link.campaign}
                          </span>
                        ) : (
                          <span className="text-white/40 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-white/80 text-sm">
                          {getInfluencerName(link.influencerId)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <span className="text-white font-medium">{link.totalClicks.toLocaleString()}</span>
                          <span className="text-white/40 text-sm ml-1">
                            ({link.uniqueClicks} unique)
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded-md ${
                          link.isActive
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-white/60 text-sm">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleActive(link)}
                            className="p-2 text-white/40 hover:text-primary transition-colors"
                            title={link.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {link.isActive ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(link)}
                            className="p-2 text-white/40 hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="p-2 text-white/40 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Compact View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {links.map((link) => (
              <div
                key={link.id}
                className="group relative rounded-xl lg:rounded-2xl px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6 cursor-pointer transition-all duration-300 bg-white/5 border border-white/10"
              >
                {/* Status Light Indicator */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                    link.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>

                {/* Link Header */}
                <div className="mb-4 sm:mb-5 -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 sm:-mt-5 lg:-mt-6 px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-4 sm:pb-5 rounded-t-xl lg:rounded-t-2xl bg-white/5" style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-primary rounded-lg xl:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm sm:text-base lg:text-lg mb-1 truncate">
                        {link.title || 'Untitled Link'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <code className="text-primary text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded">
                          /{link.shortCode}
                        </code>
                        <button
                          onClick={() => copyToClipboard(link.shortUrl)}
                          className="text-white/40 hover:text-primary transition-colors"
                          title="Copy URL"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-white/60 text-xs font-mono truncate mt-1">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 py-3 sm:py-4">
                  <div className="flex flex-col items-center py-1.5 sm:py-2">
                    <div className="bg-primary text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                      {link.totalClicks.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">Clicks</div>
                  </div>
                  <div className="flex flex-col items-center py-1.5 sm:py-2">
                    <div className="bg-primary text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                      {link.uniqueClicks.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">Unique</div>
                  </div>
                </div>

                {/* Campaign and Influencer Info */}
                <div className="space-y-2 mb-4">
                  {link.campaign && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-xs">Campaign:</span>
                      <span className="inline-block px-2 py-1 text-xs rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {link.campaign}
                      </span>
                    </div>
                  )}
                  {link.influencerId && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-xs">Influencer:</span>
                      <span className="text-white/80 text-xs truncate">
                        {getInfluencerName(link.influencerId)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleToggleActive(link)}
                    className={`w-full px-2 sm:px-3 py-1 sm:py-1.5 rounded-md lg:rounded-lg text-[10px] sm:text-xs font-medium border transition-colors flex items-center justify-center ${
                      link.isActive
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    <span className="text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em]">
                      {link.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleEdit(link)}
                    className="w-full px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-md lg:rounded-lg bg-primary text-black hover:bg-primary/90 transition-colors flex items-center justify-center"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="w-full px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-md lg:rounded-lg transition-colors flex items-center justify-center"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {summary && summary.totalPages > 1 && (
          <div className="flex justify-between items-center">
            <div className="text-white/60 text-sm">
              Page {summary.currentPage} of {summary.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-white/20 text-white/80 rounded-lg hover:bg-white/5 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(summary.totalPages, page + 1))}
                disabled={page === summary.totalPages}
                className="px-4 py-2 border border-white/20 text-white/80 rounded-lg hover:bg-white/5 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="premium-card max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingLink ? 'Edit Link' : 'Create Short Link'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Original URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.originalUrl}
                      onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                      placeholder="https://example.com/your-long-url"
                      disabled={!!editingLink}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                      placeholder="Optional title for this link"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Custom Code
                    </label>
                    <input
                      type="text"
                      value={formData.customCode}
                      onChange={(e) => setFormData({ ...formData, customCode: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                      placeholder="Optional custom short code"
                      disabled={!!editingLink}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Campaign
                    </label>
                    <select
                      value={formData.campaign}
                      onChange={(e) => {
                        const newCampaign = e.target.value
                        setFormData({
                          ...formData,
                          campaign: newCampaign,
                          // Clear influencers if campaign changes to avoid mismatched relationships
                          influencerIds: []
                        })
                        console.log('📊 Campaign selected for link:', {
                          campaign: newCampaign,
                          availableInfluencers: getAvailableInfluencers().length
                        })
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                    >
                      <option value="" className="bg-background">Select a campaign...</option>
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.slug} className="bg-background">
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Source
                    </label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                      placeholder="Traffic source"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Influencer (Optional)
                      {formData.campaign && (
                        <span className="text-xs text-white/60 ml-2">
                          • For campaign: {getCampaignName(formData.campaign)}
                        </span>
                      )}
                    </label>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {getAvailableInfluencers().length === 0 && (
                        <p className="text-sm text-white/60 italic">No influencers available</p>
                      )}
                      {getAvailableInfluencers().map((influencer) => (
                        <label
                          key={influencer.id}
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer"
                          style={{
                            background: formData.influencerIds.includes(influencer.id) ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                            border: formData.influencerIds.includes(influencer.id) ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.influencerIds.includes(influencer.id)}
                            onChange={(e) => {
                              // Multi-selection behavior
                              const newInfluencerIds = e.target.checked
                                ? [...formData.influencerIds, influencer.id]
                                : formData.influencerIds.filter(id => id !== influencer.id)
                              setFormData({ ...formData, influencerIds: newInfluencerIds })
                              console.log('👤 Influencers selected for link:', {
                                influencerIds: newInfluencerIds,
                                campaign: formData.campaign
                              })
                            }}
                            className="w-4 h-4 text-yellow-400 bg-transparent border-white/30 rounded focus:ring-yellow-400 focus:ring-2"
                          />
                          <div className="flex-1">
                            <div className="text-white font-medium">{influencer.name}</div>
                            <div className="text-sm text-white/60">
                              {influencer.socialHandle} • {influencer.platform}
                            </div>
                          </div>
                          {formData.influencerIds.includes(influencer.id) && (
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors resize-none backdrop-blur-sm"
                      placeholder="Optional description for this link"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isPublic}
                          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
                        />
                        <span className="text-white/80 text-sm">Public</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.trackClicks}
                          onChange={(e) => setFormData({ ...formData, trackClicks: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
                        />
                        <span className="text-white/80 text-sm">Track Clicks</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.allowBots}
                          onChange={(e) => setFormData({ ...formData, allowBots: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
                        />
                        <span className="text-white/80 text-sm">Allow Bot Traffic</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 border border-white/20 text-white/80 rounded-xl hover:bg-white/5 transition-colors backdrop-blur-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(253, 198, 0, 0.3)',
                      boxShadow: '0 8px 32px rgba(253, 198, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      color: '#0a0a0a'
                    }}
                  >
                    {editingLink ? 'Update Link' : 'Create Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
