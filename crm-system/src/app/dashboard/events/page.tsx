'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'

interface Conversion {
  id: string
  eventType: string
  eventName: string
  campaign: string
  customerId: string
  value: number
  metadata: any
  createdAt: string
  customer?: {
    firstName?: string
    lastName?: string
    email?: string
  }
  influencer?: {
    id: string
    name: string
    email?: string
    socialHandle?: string
    profileImage?: string
  } | null
}

interface ConversionSummary {
  totalConversions: number
  totalValue: number
  uniqueCustomers: number
  conversionRate: number
  campaigns: Array<{ name: string; count: number }>
  eventTypes: Array<{ type: string; count: number }>
}

export default function ConversionsPage() {
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [summary, setSummary] = useState<ConversionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' })
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState('all')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [selectedConversion, setSelectedConversion] = useState<Conversion | null>(null)

  const eventTypes = [
    'all', 'registration', 'signup', 'register', 'deposit', 'ftd', 'first_deposit',
    'purchase', 'conversion', 'lead_qualified', 'demo_booked'
  ]

  useEffect(() => {
    fetchConversions()
  }, [dateFilter, customDateRange, selectedEventType, selectedCampaign])

  // Live updates via SSE: refresh on new leads/ftd
  useEffect(() => {
    const es = new EventSource('/api/events')
    const onStats = (e: MessageEvent) => {
      try {
        const evt = JSON.parse((e as MessageEvent).data)
        console.log('[CONVERSIONS PAGE] SSE event', evt)
        if (!evt || !evt.type) return
        if (['lead', 'ftd'].includes(evt.type)) {
          fetchConversions()
        }
      } catch {}
    }
    // @ts-ignore - EventSource typings for custom events
    es.addEventListener('stats', onStats)
    return () => es.close()
  }, [dateFilter, customDateRange, selectedEventType, selectedCampaign])

  const fetchConversions = async () => {
    try {
      setLoading(true)

      console.log('🔄 Fetching conversions with filters:', {
        dateFilter,
        selectedEventType,
        selectedCampaign,
        customDateRange,
        timestamp: new Date().toISOString()
      })

      const params = new URLSearchParams({
        dateFilter,
        eventType: selectedEventType,
        campaign: selectedCampaign,
      })

      if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
        params.append('fromDate', customDateRange.from)
        params.append('toDate', customDateRange.to)
      }

      const response = await fetch(`/api/conversions?${params.toString()}`, { cache: 'no-store' })
      const data = await response.json()

      if (data.success) {
        setConversions(data.events || [])
        setSummary(data.summary || null)
        console.log('✅ Conversions loaded successfully:', {
          totalConversions: data.events?.length || 0,
          recognizedCustomers: data.events?.filter(e => e.customer).length || 0,
          summary: data.summary,
          timestamp: new Date().toISOString()
        })
      } else {
        console.error('❌ Failed to load conversions:', data.error)
        setError('Failed to load conversions')
      }
    } catch (err) {
      console.error('❌ Error fetching conversions:', err)
      setError('Failed to fetch conversions')
    } finally {
      setLoading(false)
    }
  }

  const filteredConversions = conversions.filter(conversion => {
    const matchesSearch =
      conversion.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversion.campaign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conversion.customer?.email && conversion.customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              Conversions
            </h1>
            <p className="text-white/60 text-sm sm:text-base mt-1">Track and analyze conversion events</p>
          </div>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="premium-card p-6 shimmer">
              <div className="space-y-3">
                <div className="h-4 bg-muted/20 rounded w-1/2"></div>
                <div className="h-8 bg-muted/20 rounded w-3/4"></div>
                <div className="h-3 bg-muted/20 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Events Table */}
        <div className="premium-card p-6 shimmer">
          <div className="space-y-4">
            <div className="h-6 bg-muted/20 rounded w-1/4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="premium-card p-12 text-center">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Error Loading Conversions</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button onClick={fetchConversions} className="premium-button-primary">
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
          {/* Title */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              Conversions
            </h1>
            <p className="text-white/60 text-sm sm:text-base mt-1">Track and analyze conversion events</p>
          </div>

          {/* Mobile Controls */}
          <div className="lg:hidden space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Conversion Type Filter */}
              <div className="relative min-w-0 flex-1">
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px'
                  }}
                >
                  {eventTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Conversions' : type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative min-w-0 flex-1">
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    if (e.target.value === 'custom') {
                      setShowCustomDatePicker(true)
                    } else {
                      setShowCustomDatePicker(false)
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range Picker for Mobile */}
            {showCustomDatePicker && (
              <div className="bg-white/10 border border-white/20 rounded-xl p-4 space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <label className="block text-white/80 text-sm mb-2">From Date</label>
                    <input
                      type="date"
                      value={customDateRange.from}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-white/80 text-sm mb-2">To Date</label>
                    <input
                      type="date"
                      value={customDateRange.to}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowCustomDatePicker(false)
                      if (customDateRange.from && customDateRange.to) {
                        fetchConversions()
                      }
                    }}
                    className="px-4 py-3 rounded-xl bg-primary text-black text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center space-x-3 flex-1 max-w-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="search"
                placeholder="Search conversions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base"
              />
            </div>

            {/* Right-aligned Controls */}
            <div className="flex items-center gap-4">
              {/* Conversion Type Filter */}
              <div className="relative flex-shrink-0">
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm h-[52px] min-w-[160px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px'
                  }}
                >
                  {eventTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Conversions' : type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative flex-shrink-0">
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    if (e.target.value === 'custom') {
                      setShowCustomDatePicker(true)
                    } else {
                      setShowCustomDatePicker(false)
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm h-[52px] min-w-[140px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Total Events Count */}
              <div className="flex items-center justify-center gap-2 px-4 rounded-xl bg-white h-[52px] min-w-[140px] flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black flex-shrink-0">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-black text-sm font-bold whitespace-nowrap">
                  {filteredConversions.length} Conversion{filteredConversions.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker for Desktop */}
          {showCustomDatePicker && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-white/80 text-sm mb-2">From Date</label>
                  <input
                    type="date"
                    value={customDateRange.from}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-white/80 text-sm mb-2">To Date</label>
                  <input
                    type="date"
                    value={customDateRange.to}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setShowCustomDatePicker(false)
                      if (customDateRange.from && customDateRange.to) {
                        fetchConversions()
                      }
                    }}
                    className="px-4 py-3 rounded-xl bg-primary text-black text-sm font-medium hover:bg-primary/90 transition-colors h-[52px]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">Total Conversions</p>
                  <p className="text-2xl font-bold text-white mt-1">{summary.totalConversions.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>


            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">Unique Customers</p>
                  <p className="text-2xl font-bold text-white mt-1">{summary.uniqueCustomers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">Conversion Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {summary.conversionRate.toFixed(2)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversions List */}
        <div className="premium-card overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Recent Conversions</h2>
              <div className="text-sm text-white/60">
                {filteredConversions.length} of {conversions.length} conversions
              </div>
            </div>
          </div>

          {filteredConversions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-24 h-24 mx-auto mb-6 text-primary">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3l1-6h11l1 6zM6 15h12M13 15l8-4-8-4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchQuery ? 'No events match your search' : 'No events found'}
              </h3>
              <p className="text-white/60 mb-6 max-w-md mx-auto leading-relaxed">
                {searchQuery
                  ? 'Try adjusting your search terms or clear the filter to see all events'
                  : 'No events recorded yet. Track user actions to understand conversion patterns.'
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
                  <span>Start Tracking</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 p-4 border-b border-white/10 text-sm font-medium text-white/60">
                  <div>Customer</div>
                  <div>Conversion Type</div>
                  <div>Campaign</div>
                  <div>Influencer</div>
                  <div>Date</div>
                  <div>Actions</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-white/10">
                  {filteredConversions.map((conversion) => (
                    <div key={conversion.id} className="grid grid-cols-6 gap-4 p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 text-white">
                        <Avatar
                          firstName={conversion.customer?.firstName}
                          lastName={conversion.customer?.lastName}
                          email={conversion.customer?.email}
                          userId={conversion.customerId}
                          size="sm"
                        />
                        <span>
                          {conversion.customer?.firstName && conversion.customer?.lastName
                            ? `${conversion.customer.firstName} ${conversion.customer.lastName}`
                            : conversion.customer?.email || 'Unknown'
                          }
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-block px-3 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
                          {conversion.eventType}
                        </span>
                      </div>
                      <div className="flex items-center text-white">
                        {conversion.campaign}
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        {conversion.influencer ? (
                          <>
                            <Avatar
                              firstName={conversion.influencer.name}
                              email={conversion.influencer.email}
                              userId={conversion.influencer.id}
                              size="sm"
                            />
                            <span className="text-sm">{conversion.influencer.name}</span>
                          </>
                        ) : (
                          <span className="text-white/40 text-sm">-</span>
                        )}
                      </div>
                      <div className="flex items-center text-white/60 text-sm">
                        {formatDate(conversion.createdAt)}
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => setSelectedConversion(conversion)}
                          className="text-white/40 hover:text-primary transition-colors p-2"
                          title="View details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conversion Details Modal */}
      {selectedConversion && (
        <>
          {/* Full Screen Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-[24]"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            onClick={() => setSelectedConversion(null)}
          />

          {/* Modal Container */}
          <div className="fixed top-0 bottom-0 right-0 z-[25] flex items-center justify-center p-4 left-16 lg:left-80">
            <div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl"
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed */}
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10" style={{
                background: '#0f0f0f',
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full bg-yellow-400/20 rounded-xl flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-yellow-400">Conversion Details</h2>
                      <p className="text-sm text-white/60 mt-1">Complete conversion information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedConversion(null)}
                    className="w-8 h-8 bg-yellow-400 hover:bg-yellow-300 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0"
                    title="Close modal"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
                <div className="p-6 space-y-6 pb-16">
              {/* Customer Section */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3">Customer</h3>
                <div className="flex items-center gap-3">
                  <Avatar
                    firstName={selectedConversion.customer?.firstName}
                    lastName={selectedConversion.customer?.lastName}
                    email={selectedConversion.customer?.email}
                    userId={selectedConversion.customerId}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-white">
                      {selectedConversion.customer?.firstName && selectedConversion.customer?.lastName
                        ? `${selectedConversion.customer.firstName} ${selectedConversion.customer.lastName}`
                        : selectedConversion.customer?.email || 'Unknown'
                      }
                    </p>
                    {selectedConversion.customer?.email && (
                      <p className="text-sm text-white/60">{selectedConversion.customer.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Influencer Section */}
              {selectedConversion.influencer && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-3">Influencer</h3>
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={selectedConversion.influencer.name}
                      email={selectedConversion.influencer.email}
                      userId={selectedConversion.influencer.id}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-white">{selectedConversion.influencer.name}</p>
                      {selectedConversion.influencer.email && (
                        <p className="text-sm text-white/60">{selectedConversion.influencer.email}</p>
                      )}
                      {selectedConversion.influencer.socialHandle && (
                        <p className="text-sm text-white/60">@{selectedConversion.influencer.socialHandle}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Conversion Details */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3">Conversion Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/60">Type</p>
                    <p className="text-white font-medium mt-1">{selectedConversion.eventType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Campaign</p>
                    <p className="text-white font-medium mt-1">{selectedConversion.campaign || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Date</p>
                    <p className="text-white font-medium mt-1">{formatDate(selectedConversion.createdAt)}</p>
                  </div>
                  {selectedConversion.eventName && (
                    <div className="col-span-2">
                      <p className="text-sm text-white/60">Event Name</p>
                      <p className="text-white font-medium mt-1">{selectedConversion.eventName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              {selectedConversion.metadata && Object.keys(selectedConversion.metadata).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-3">Additional Data</h3>
                  <div className="bg-white/5 rounded-lg p-4">
                    <pre className="text-sm text-white/80 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedConversion.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="sticky bottom-0 z-10 px-6 py-4 border-t border-white/10 flex gap-3" style={{
                background: '#0f0f0f',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <a
                  href={`/dashboard/customers/${selectedConversion.customerId}`}
                  className="flex-1 px-6 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-all duration-300 text-sm shadow-lg text-center"
                >
                  View Customer
                </a>
                {selectedConversion.influencer && (
                  <a
                    href={`/dashboard/influencers`}
                    className="flex-1 px-6 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-all duration-300 text-sm shadow-lg text-center"
                  >
                    View Influencer
                  </a>
                )}
              </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
