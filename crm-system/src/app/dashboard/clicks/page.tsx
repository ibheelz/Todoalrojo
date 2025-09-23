'use client'

import { useState, useEffect, useRef } from 'react'

interface Click {
  id: string
  clickId: string
  customerId: string
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
  }
}

interface ClickSummary {
  totalClicks: number
  uniqueCustomers: number
  fraudClicks: number
  fraudRate: number
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

  // Filtering states
  const [dateFilter, setDateFilter] = useState('today')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [customDateRange, setCustomDateRange] = useState({
    from: '',
    to: ''
  })

  // UI states
  const [showFilters, setShowFilters] = useState(false)
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch clicks')
      console.error('Error fetching clicks:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getDeviceIcon = (click: Click) => {
    if (click.isMobile) return '📱'
    if (click.isTablet) return '📱'
    if (click.isDesktop) return '💻'
    return '🖥️'
  }

  const getBrowserIcon = (browser: string) => {
    switch (browser.toLowerCase()) {
      case 'chrome': return '🔷'
      case 'firefox': return '🔸'
      case 'safari': return '🟠'
      case 'edge': return '🔹'
      default: return '🌐'
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                Clicks
              </h1>
              <p className="text-white/60 text-sm sm:text-base mt-1">Track and analyze click data</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="premium-card p-6 shimmer">
                <div className="space-y-4">
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

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Total Clicks Badge */}
              {summary && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                  <span className="text-xs sm:text-sm text-white/60">Total:</span>
                  <span className="text-sm sm:text-base font-semibold text-white">{summary.totalClicks.toLocaleString()}</span>
                </div>
              )}

              {/* Date Filter Button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all duration-200 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0111 21v-6.586a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
                  </svg>
                  <span className="hidden xs:inline">
                    {dateFilter === 'today' && 'Today'}
                    {dateFilter === 'yesterday' && 'Yesterday'}
                    {dateFilter === 'last7days' && 'Last 7 Days'}
                    {dateFilter === 'last30days' && 'Last 30 Days'}
                    {dateFilter === 'all' && 'All Time'}
                    {dateFilter === 'custom' && 'Custom'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Filters Dropdown */}
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-72 bg-black/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-50">
                    <div className="p-4 space-y-4">
                      {/* Date Filter */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Date Range</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'today', label: 'Today' },
                            { value: 'yesterday', label: 'Yesterday' },
                            { value: 'last7days', label: 'Last 7 Days' },
                            { value: 'last30days', label: 'Last 30 Days' },
                            { value: 'all', label: 'All Time' },
                            { value: 'custom', label: 'Custom' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setDateFilter(option.value)
                                if (option.value === 'custom') {
                                  setShowCustomDatePicker(true)
                                }
                              }}
                              className={`px-3 py-2 text-sm rounded-lg transition-all ${
                                dateFilter === option.value
                                  ? 'bg-primary text-black font-medium'
                                  : 'bg-white/10 text-white/80 hover:bg-white/20'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Campaign Filter */}
                      {summary && summary.campaigns.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Campaign</label>
                          <select
                            value={selectedCampaign}
                            onChange={(e) => setSelectedCampaign(e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                          >
                            <option value="all">All Campaigns</option>
                            {summary.campaigns.map((campaign) => (
                              <option key={campaign.name} value={campaign.name}>
                                {campaign.name} ({campaign.count})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Source Filter */}
                      {summary && summary.sources.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Source</label>
                          <select
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                          >
                            <option value="all">All Sources</option>
                            {summary.sources.map((source) => (
                              <option key={source.name} value={source.name}>
                                {source.name} ({source.count})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Search</label>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search clicks..."
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Date Picker */}
                {showCustomDatePicker && (
                  <div className="absolute right-0 mt-2 w-80 bg-black/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-50">
                    <div className="p-4 space-y-4">
                      <h3 className="text-sm font-medium text-white">Custom Date Range</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-white/60 mb-1">From</label>
                          <input
                            type="date"
                            value={customDateRange.from}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/60 mb-1">To</label>
                          <input
                            type="date"
                            value={customDateRange.to}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCustomDatePicker(false)}
                          className="flex-1 px-3 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleApplyCustomDateRange}
                          className="flex-1 px-3 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="premium-card p-4">
                <div className="text-lg sm:text-xl font-bold text-white">{summary.totalClicks.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-white/60">Total Clicks</div>
              </div>
              <div className="premium-card p-4">
                <div className="text-lg sm:text-xl font-bold text-white">{summary.uniqueCustomers.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-white/60">Unique Customers</div>
              </div>
              <div className="premium-card p-4">
                <div className="text-lg sm:text-xl font-bold text-red-400">{summary.fraudClicks.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-white/60">Fraud Clicks</div>
              </div>
              <div className="premium-card p-4">
                <div className="text-lg sm:text-xl font-bold text-yellow-400">{summary.fraudRate}%</div>
                <div className="text-xs sm:text-sm text-white/60">Fraud Rate</div>
              </div>
            </div>
          )}
        </div>

        {/* Clicks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {clicks.map((click) => (
            <div
              key={click.id}
              className={`premium-card group hover:border-primary/30 transition-all duration-300 ${
                click.isFraud ? 'border-red-500/30 bg-red-500/5' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getDeviceIcon(click)}</span>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {click.customer.firstName} {click.customer.lastName}
                    </div>
                    <div className="text-xs text-white/60">{click.customer.masterEmail}</div>
                  </div>
                </div>
                {click.isFraud && (
                  <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-md border border-red-500/30">
                    Fraud
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-white/60 mb-1">Campaign & Source</div>
                  <div className="text-sm text-white font-medium">{click.campaign}</div>
                  <div className="text-xs text-white/80">{click.source} / {click.medium}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-white/60">Device:</span>
                    <div className="text-white mt-1 flex items-center gap-1">
                      <span>{getBrowserIcon(click.browser)}</span>
                      <span>{click.device}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-white/60">Location:</span>
                    <div className="text-white mt-1">
                      {click.city}, {click.country}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-white/60 mb-1">Landing Page</div>
                  <div className="text-xs text-white/80 truncate">{click.landingPage}</div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="text-xs text-white/40">
                    {formatDate(click.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {clicks.length === 0 && !loading && (
          <div className="premium-card text-center py-12">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No clicks found</h3>
            <p className="text-white/60 mb-6">No clicks match your current filter criteria.</p>
            <button
              onClick={() => {
                setDateFilter('all')
                setSelectedCampaign('all')
                setSelectedSource('all')
                setSearchQuery('')
                setCustomDateRange({ from: '', to: '' })
              }}
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
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}