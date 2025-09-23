'use client'

import { useState, useEffect, useRef } from 'react'

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

      const response = await fetch(`/api/clicks?${params.toString()}`)
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4" ref={dropdownRef}>
            {/* Search */}
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search by campaign, source, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-muted/10 border border-muted/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-muted/10 border border-muted/20 rounded-xl text-white hover:bg-muted/20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Filters
            </button>

            {/* Clear Filters Button */}
            {(dateFilter !== 'today' || selectedCampaign !== 'all' || selectedSource !== 'all' || searchQuery) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 hover:bg-red-500/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="bg-muted/10 border border-muted/20 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className="w-full px-3 py-2 bg-muted/10 border border-muted/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {[
                      { value: 'today', label: 'Today' },
                      { value: 'yesterday', label: 'Yesterday' },
                      { value: 'last7days', label: 'Last 7 Days' },
                      { value: 'last30days', label: 'Last 30 Days' },
                      { value: 'last90days', label: 'Last 90 Days' },
                      { value: 'custom', label: 'Custom Range' }
                    ].map(option => (
                      <option key={option.value} value={option.value}>
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
                    className="w-full px-3 py-2 bg-muted/10 border border-muted/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="all">All Campaigns</option>
                    {summary?.campaigns.map(campaign => (
                      <option key={campaign.name} value={campaign.name}>
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
                    className="w-full px-3 py-2 bg-muted/10 border border-muted/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="all">All Sources</option>
                    {summary?.sources.map(source => (
                      <option key={source.name} value={source.name}>
                        {source.name} ({source.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Date Picker */}
              {showCustomDatePicker && (
                <div className="border-t border-muted/20 pt-4 mt-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-white/80 mb-2">From Date</label>
                      <input
                        type="date"
                        value={customDateRange.from}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                        className="w-full px-3 py-2 bg-muted/10 border border-muted/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-white/80 mb-2">To Date</label>
                      <input
                        type="date"
                        value={customDateRange.to}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                        className="w-full px-3 py-2 bg-muted/10 border border-muted/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleApplyCustomDateRange}
                        disabled={!customDateRange.from || !customDateRange.to}
                        className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex-shrink-0 border-2 border-primary/30">
                        <img
                          src={generateCustomerAvatar(click.customer)}
                          alt={getCustomerDisplayName(click.customer)}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if dicebear fails
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                        {/* Fallback initials display */}
                        <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
                          {click.customer ?
                            (click.customer.firstName?.[0] || '') + (click.customer.lastName?.[0] || '') :
                            'AU'
                          }
                        </div>
                      </div>

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
                        <div className="flex items-center gap-3">
                          {/* Customer Avatar */}
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex-shrink-0 border-2 border-primary/30">
                            <img
                              src={generateCustomerAvatar(click.customer)}
                              alt={getCustomerDisplayName(click.customer)}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if dicebear fails
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                            {/* Fallback initials display */}
                            <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">
                              {click.customer ?
                                (click.customer.firstName?.[0] || '') + (click.customer.lastName?.[0] || '') :
                                'AU'
                              }
                            </div>
                          </div>

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
          <div className="text-center py-12">
            <div className="text-white/40 text-lg mb-2">No clicks found</div>
            <p className="text-white/60">Try adjusting your filters to see more results.</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}