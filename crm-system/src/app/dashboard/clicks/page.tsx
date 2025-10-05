'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/avatar'

interface Click {
  id: string
  clickId: string
  customerId: string | null
  campaign: string
  source: string
  medium: string
  ip: string
  userAgent: string
  referrer?: string
  landingPage: string
  country: string
  city: string
  device: string
  browser: string
  os: string
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isFraud: boolean
  createdAt: string
  customer: {
    id: string
    masterEmail: string
    firstName: string
    lastName: string
  } | null
}

interface ClickSummary {
  totalClicks: number
  uniqueCustomers: number
  fraudClicks: number
  fraudRate: number
  recognizedCustomers: number
  anonymousClicks: number
  recognitionRate: number
  totalPages: number
  currentPage: number
  campaigns: Array<{ name: string; count: number }>
  sources: Array<{ name: string; count: number }>
}

export default function ClicksPage() {
  const [clicks, setClicks] = useState<Click[]>([])
  const [summary, setSummary] = useState<ClickSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [dateFilter, setDateFilter] = useState('today')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [customDateRange, setCustomDateRange] = useState({
    from: '',
    to: ''
  })

  const [showFilters, setShowFilters] = useState(false)
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Fetch clicks data
  useEffect(() => {
    fetchClicks()
  }, [])

  // Refetch clicks when filters change
  useEffect(() => {
    if (dateFilter !== 'custom') {
      fetchClicks()
    }
  }, [dateFilter, selectedCampaign, selectedSource, searchQuery])

  // Refetch clicks when custom date range is applied
  useEffect(() => {
    if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
      fetchClicks()
    }
  }, [customDateRange])

  // Live updates via SSE: refresh on new clicks
  useEffect(() => {
    const es = new EventSource('/api/events')
    const onStats = (e: MessageEvent) => {
      try {
        const evt = JSON.parse((e as MessageEvent).data)
        console.log('[CLICKS PAGE] SSE event', evt)
        if (!evt || !evt.type) return
        if (['click', 'campaignDelta', 'influencerDelta'].includes(evt.type)) {
          fetchClicks()
        }
      } catch {}
    }
    // @ts-ignore - EventSource typings for custom events
    es.addEventListener('stats', onStats)
    return () => es.close()
  }, [dateFilter, selectedCampaign, selectedSource, searchQuery, customDateRange])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false)
        setShowCustomDatePicker(false)
      }
    }

    if (showFilters || showCustomDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showFilters, showCustomDatePicker])

  const fetchClicks = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching clicks with filters:', {
        dateFilter,
        selectedCampaign,
        selectedSource,
        searchQuery,
        customDateRange,
        timestamp: new Date().toISOString()
      })

      const params = new URLSearchParams({
        dateFilter,
        campaign: selectedCampaign,
        source: selectedSource,
        search: searchQuery,
      })

      if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
        params.append('fromDate', customDateRange.from)
        params.append('toDate', customDateRange.to)
      }

      const response = await fetch(`/api/clicks?${params.toString()}`, { cache: 'no-store' })
      const data = await response.json()

      if (data.success) {
        setClicks(data.clicks)
        setSummary(data.summary)
        setError(null)
        console.log('✅ Clicks loaded successfully:', {
          totalClicks: data.clicks.length,
          recognizedCustomers: data.clicks.filter(c => c.customer).length,
          anonymousClicks: data.clicks.filter(c => !c.customer).length,
          fraudClicks: data.clicks.filter(c => c.isFraud).length,
          summary: data.summary
        })
      } else {
        console.error('❌ Failed to fetch clicks:', data.error)
        setError(data.error || 'Failed to fetch clicks')
      }
    } catch (err) {
      console.error('❌ Fetch clicks error:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setDateFilter('today')
    setSelectedCampaign('all')
    setSelectedSource('all')
    setSearchQuery('')
    setCustomDateRange({ from: '', to: '' })
    setShowFilters(false)
    setShowCustomDatePicker(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Generate dicebear avatar URL for customer
  const generateCustomerAvatar = (customer: Click['customer']) => {
    if (!customer) {
      // Use IP-based seed for anonymous users
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
    }

    // Use customer email as seed for consistent avatars
    const seed = customer.masterEmail || customer.id
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  }

  // Get customer display name
  const getCustomerDisplayName = (customer: Click['customer']) => {
    if (!customer) return 'Anonymous User'
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName} ${customer.lastName}`
    }
    return customer.masterEmail || 'Unknown Customer'
  }

  // Get customer identifier for display
  const getCustomerIdentifier = (customer: Click['customer'], ip: string) => {
    if (!customer) return ip
    return customer.masterEmail || ip
  }

  const handleApplyCustomDateRange = () => {
    if (customDateRange.from && customDateRange.to) {
      setShowCustomDatePicker(false)
      fetchClicks()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-2 xxs:space-y-1 xs:space-y-3 sm:space-y-6 p-1 xxs:p-1 xs:p-2 sm:p-4 lg:p-6">
          {/* Header */}
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                Clicks
              </h1>
              <p className="text-white/60 text-sm sm:text-base mt-1">Track and analyze click data</p>
            </div>
          </div>

          {/* Loading Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="premium-card p-4 sm:p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-6 bg-muted/20 rounded w-2/3"></div>
                  <div className="h-4 bg-muted/20 rounded w-1/2"></div>
                  <div className="h-4 bg-muted/20 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="premium-card p-8 text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error Loading Clicks</div>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={fetchClicks}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 mx-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(253, 198, 0, 0.3)',
              boxShadow: '0 8px 32px rgba(253, 198, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              color: '#0a0a0a'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-2 xxs:space-y-1 xs:space-y-3 sm:space-y-6 p-1 xxs:p-1 xs:p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Title and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                Clicks
              </h1>
              <p className="text-white/60 text-sm sm:text-base mt-1">Track and analyze click data</p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-primary text-black shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-muted/20'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" strokeWidth="2" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" strokeWidth="2" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" strokeWidth="2" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" strokeWidth="2" rx="1"/>
                  </svg>
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-primary text-black shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-muted/20'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 6h18M3 12h18M3 18h18" strokeWidth="2"/>
                  </svg>
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="premium-card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by campaign, source, or IP..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                />
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    if (e.target.value === 'custom') {
                      setShowCustomDatePicker(true)
                    }
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                >
                  {[
                    { value: 'today', label: 'Today' },
                    { value: 'yesterday', label: 'Yesterday' },
                    { value: 'last7days', label: 'Last 7 Days' },
                    { value: 'last30days', label: 'Last 30 Days' },
                    { value: 'last90days', label: 'Last 90 Days' },
                    { value: 'custom', label: 'Custom Range' }
                  ].map(option => (
                    <option key={option.value} value={option.value} className="bg-background">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign Filter */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Campaign</label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                >
                  <option value="all" className="bg-background">All Campaigns</option>
                  {summary?.campaigns.map(campaign => (
                    <option key={campaign.name} value={campaign.name} className="bg-background">
                      {campaign.name} ({campaign.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Source</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                >
                  <option value="all" className="bg-background">All Sources</option>
                  {summary?.sources.map(source => (
                    <option key={source.name} value={source.name} className="bg-background">
                      {source.name} ({source.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-3 border border-white/20 text-white/80 rounded-xl hover:bg-white/5 transition-colors backdrop-blur-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Custom Date Picker */}
            {showCustomDatePicker && (
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/80 mb-2">From Date</label>
                    <input
                      type="date"
                      value={customDateRange.from}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/80 mb-2">To Date</label>
                    <input
                      type="date"
                      value={customDateRange.to}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors backdrop-blur-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleApplyCustomDateRange}
                      disabled={!customDateRange.from || !customDateRange.to}
                      className="px-4 py-3 bg-primary text-black rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="premium-card p-3 sm:p-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{summary.totalClicks.toLocaleString()}</div>
              <div className="text-white/60 text-xs sm:text-sm">Total Clicks</div>
            </div>
            <div className="premium-card p-3 sm:p-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">{summary.uniqueCustomers.toLocaleString()}</div>
              <div className="text-white/60 text-xs sm:text-sm">Unique Users</div>
            </div>
            <div className="premium-card p-3 sm:p-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">{summary.recognizedCustomers?.toLocaleString() || 0}</div>
              <div className="text-white/60 text-xs sm:text-sm">Recognized</div>
            </div>
            <div className="premium-card p-3 sm:p-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">{summary.fraudClicks.toLocaleString()}</div>
              <div className="text-white/60 text-xs sm:text-sm">Fraud Clicks</div>
            </div>
            <div className="premium-card p-3 sm:p-4">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400">{summary.recognitionRate?.toFixed(1) || 0}%</div>
              <div className="text-white/60 text-xs sm:text-sm">Recognition Rate</div>
            </div>
          </div>
        )}

        {/* Clicks Data */}
        {viewMode === 'cards' ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {clicks.map((click) => (
              <div key={click.id} className="premium-card p-4 sm:p-6">
                <div className="space-y-3">
                  {/* Header with Avatar */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {/* Customer Avatar */}
                      <Avatar
                        firstName={click.customer?.firstName}
                        lastName={click.customer?.lastName}
                        email={click.customer?.masterEmail}
                        userId={click.customer?.id}
                        size="md"
                      />

                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {getCustomerDisplayName(click.customer)}
                          {click.customer && (
                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30">
                              Recognized
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-white/60">
                          {getCustomerIdentifier(click.customer, click.ip)}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      click.isFraud
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-green-500/20 text-green-300 border border-green-500/30'
                    }`}>
                      {click.isFraud ? 'Fraud' : 'Valid'}
                    </div>
                  </div>

                  {/* Click ID */}
                  <div className="mb-2">
                    <span className="text-xs font-mono text-yellow-400 px-2 py-1 rounded inline-block" style={{
                      background: 'rgba(253, 198, 0, 0.1)',
                      border: '1px solid rgba(253, 198, 0, 0.3)'
                    }}>
                      {click.clickId || 'No Click ID'}
                    </span>
                  </div>

                  {/* Campaign & Source */}
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-white/60">Campaign:</span> <span className="text-primary">{click.campaign}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-white/60">Source:</span> <span className="text-blue-400">{click.source}</span>
                    </div>
                  </div>

                  {/* Device & Location */}
                  <div className="flex justify-between text-sm text-white/60">
                    <span>{click.device} • {click.browser}</span>
                    <span>{click.city}, {click.country}</span>
                  </div>

                  {/* Landing Page */}
                  <div className="text-sm">
                    <span className="text-white/60">Page:</span>
                    <div className="text-xs text-white/40 truncate mt-1">{click.landingPage}</div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-white/40 pt-2 border-t border-white/10">
                    {formatDate(click.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-sm font-medium text-white/80">Click ID</th>
                    <th className="text-left p-3 text-sm font-medium text-white/80">User</th>
                    <th className="text-left p-3 text-sm font-medium text-white/80">Campaign</th>
                    <th className="text-left p-3 text-sm font-medium text-white/80">Source</th>
                    <th className="text-left p-3 text-sm font-medium text-white/80">Device</th>
                    <th className="text-left p-3 text-sm font-medium text-white/80">Location</th>
                    <th className="text-left p-3 text-sm font-medium text-white/80">Date</th>
                    <th className="text-left p-3 text-sm font-medium text-white/80">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clicks.map((click) => (
                    <tr key={click.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3">
                        <span className="text-xs font-mono text-yellow-400 px-2 py-1 rounded inline-block" style={{
                          background: 'rgba(253, 198, 0, 0.1)',
                          border: '1px solid rgba(253, 198, 0, 0.3)'
                        }}>
                          {click.clickId || '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Customer Avatar */}
                          <Avatar
                            firstName={click.customer?.firstName}
                            lastName={click.customer?.lastName}
                            email={click.customer?.masterEmail}
                            userId={click.customer?.id}
                            size="sm"
                          />

                          <div>
                            <div className="font-medium text-white text-sm flex items-center gap-2">
                              {getCustomerDisplayName(click.customer)}
                              {click.customer && (
                                <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded border border-green-500/30">
                                  R
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/60">
                              {getCustomerIdentifier(click.customer, click.ip)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-primary">{click.campaign}</td>
                      <td className="p-3 text-sm text-blue-400">{click.source}</td>
                      <td className="p-3 text-sm text-white/80">{click.device}</td>
                      <td className="p-3 text-sm text-white/80">{click.city}, {click.country}</td>
                      <td className="p-3 text-sm text-white/60">{formatDate(click.createdAt)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          click.isFraud
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>
                          {click.isFraud ? 'Fraud' : 'Valid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {clicks.length === 0 && !loading && (
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 mx-auto mb-6 text-primary">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {searchQuery ? 'No clicks match your search' : 'No clicks found'}
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search terms or clear the filter to see all clicks'
                : 'No clicks tracked yet. Start campaigns to begin monitoring user engagement.'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => window.location.href = '/dashboard/campaigns'}
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
                <span>Start Campaign</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
