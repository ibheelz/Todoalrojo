'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlusIcon, TargetIcon, WarningIcon, SearchIcon } from '@/components/ui/icons'
import CampaignModal from '@/components/ui/campaign-modal'

interface CampaignStats {
  totalClicks: number
  totalLeads: number
  totalEvents: number
  uniqueUsers: number
  duplicateLeads: number
  fraudClicks: number
  conversionRate: number
  duplicateRate: number
  fraudRate: number
  avgQualityScore: number
  totalLeadValue: number
  totalEventValue: number
  totalRevenue: number
}

type CampaignStatus = 'active' | 'paused' | 'inactive'

interface Campaign {
  id: string
  name: string
  slug: string
  description: string | null
  clientId: string | null
  brandId: string | null
  logoUrl?: string | null
  influencerId?: string | null
  status: CampaignStatus
  registrations: number | null
  ftd: number | null
  approvedRegistrations: number | null
  qualifiedDeposits: number | null
  createdAt: string
  updatedAt: string
  stats: CampaignStats
}

interface Influencer {
  id: string
  name: string
  email: string | null
  socialHandle: string | null
  platform: string
  status: string
}

const SortIcon = ({ field, sortField, sortDirection }: { field: string, sortField: string, sortDirection: 'asc' | 'desc' }) => {
  if (sortField !== field) {
    return (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }

  return sortDirection === 'asc' ? (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'compact' | 'table'>('compact')
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [rowHighlight, setRowHighlight] = useState<Record<string, number>>({})
  const [toasts, setToasts] = useState<Array<{ id: string; text: string }>>([])

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
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [managingCampaign, setManagingCampaign] = useState<Campaign | null>(null)

  // Date filtering state
  const [dateFilter, setDateFilter] = useState('today')
  const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' })
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCampaigns()
    fetchInfluencers()
  }, [])

  // Listen for campaign reset events and zero local stats
  useEffect(() => {
    const handler = (e: any) => {
      console.log('[CAMPAIGNS PAGE] campaign:reset event', e?.detail)
      const id = e.detail?.id
      if (!id) return
      setCampaigns(prev => prev.map(c => c.id === id ? {
        ...c,
        registrations: 0,
        ftd: 0,
        approvedRegistrations: 0,
        qualifiedDeposits: 0,
        stats: {
          ...c.stats,
          totalClicks: 0,
          totalLeads: 0,
          totalEvents: 0,
          totalLeadValue: 0,
          totalEventValue: 0,
          totalRevenue: 0,
          conversionRate: 0,
          duplicateRate: 0,
          fraudRate: 0,
          avgQualityScore: 0,
          uniqueUsers: 0,
          duplicateLeads: 0,
          fraudClicks: 0,
        }
      } : c))
    }
    window.addEventListener('campaign:reset' as any, handler as any)
    return () => window.removeEventListener('campaign:reset' as any, handler as any)
  }, [])

  // Subscribe to server-sent events to refresh instantly
  useEffect(() => {
    const es = new EventSource('/api/events')
    const onStats = (e: MessageEvent) => {
      try {
        const evt = JSON.parse((e as MessageEvent).data)
        console.log('[CAMPAIGNS PAGE] SSE event', evt)
        if (!evt || !evt.type) return
        if (['click', 'lead', 'ftd', 'campaignDelta', 'resetCampaign'].includes(evt.type)) {
          console.log('[CAMPAIGNS PAGE] SSE triggering fetchCampaigns')
          fetchCampaigns()
          const addToast = (text: string) => {
            const id = Math.random().toString(36).slice(2)
            setToasts((prev) => [...prev, { id, text }])
            setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
          }
          if (evt.type === 'click') addToast('New click detected')
          if (evt.type === 'lead') addToast('New lead recorded')
          if (evt.type === 'ftd') addToast('New FTD conversion')
          if (evt.type === 'resetCampaign') addToast('Campaign stats reset')
        }
      } catch {}
    }
    // @ts-ignore
    es.addEventListener('stats', onStats)
    return () => es.close()
  }, [dateFilter, customDateRange])

  // Helper function to get influencer name
  const getInfluencerName = (influencerId: string | null | undefined): string => {
    if (!influencerId) return 'No influencer'
    const influencer = influencers.find(inf => inf.id === influencerId)
    return influencer ? `${influencer.name} (${influencer.socialHandle})` : 'Unknown Influencer'
  }

  const fetchInfluencers = async () => {
    try {
      console.log('📊 [CAMPAIGNS] Fetching influencers...')
      const response = await fetch('/api/influencers?activeOnly=true', { cache: 'no-store' })
      const data = await response.json()
      if (data.success) {
        setInfluencers(data.influencers)
        console.log('✅ [CAMPAIGNS] Loaded influencers:', data.influencers.length)
      }
    } catch (error) {
      console.error('❌ [CAMPAIGNS] Error fetching influencers:', error)
    }
  }

  // Refetch campaigns when date filter changes
  useEffect(() => {
    if (dateFilter !== 'custom') {
      fetchCampaigns()
    }
  }, [dateFilter])

  // Refetch campaigns when custom date range is applied
  useEffect(() => {
    if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
      fetchCampaigns()
    }
  }, [customDateRange])

  // Filter campaigns by search only (metrics are already filtered by date on server)
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (campaign.description && campaign.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [dropdownOpen])

  const fetchCampaigns = async () => {
    try {
      const before: Record<string, { clicks: number; leads: number; events: number; regs: number; ftd: number }> = {}
      campaigns.forEach((c) => {
        before[c.id] = {
          clicks: c.stats?.totalClicks || 0,
          leads: c.stats?.totalLeads || 0,
          events: c.stats?.totalEvents || 0,
          regs: c.registrations || 0,
          ftd: c.ftd || 0,
        }
      })
      // Build query parameters for date filtering
      const params = new URLSearchParams({
        includeStats: 'true',
        dateFilter,
      })

      // Add custom date range if applicable
      if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
        params.append('fromDate', customDateRange.from)
        params.append('toDate', customDateRange.to)
      }

      const response = await fetch(`/api/campaigns?${params.toString()}`, { cache: 'no-store' })
      const data = await response.json()

      if (data.success) {
        // Convert isActive boolean to status for backwards compatibility
        const campaignsWithStatus = data.campaigns.map((campaign: any) => ({
          ...campaign,
          status: campaign.isActive ? 'active' : 'paused' as CampaignStatus
        }))

        // 🔍 DEBUGGING: Log conversion type data for each campaign
        console.log('🔍 [CAMPAIGNS DEBUG] Fetched campaigns with conversion types:')
        campaignsWithStatus.forEach((campaign: any) => {
          console.log(`🔍 [${campaign.name}]:`, {
            registrations: campaign.registrations,
            ftd: campaign.ftd,
            approvedRegistrations: campaign.approvedRegistrations,
            qualifiedDeposits: campaign.qualifiedDeposits
          })
        })

        setCampaigns(campaignsWithStatus)
        const changedIds: string[] = []
        campaignsWithStatus.forEach((c: any) => {
          const prev = before[c.id]
          if (!prev) return
          if ((c.stats?.totalClicks || 0) > prev.clicks || (c.stats?.totalLeads || 0) > prev.leads || (c.stats?.totalEvents || 0) > prev.events || (c.registrations || 0) > prev.regs || (c.ftd || 0) > prev.ftd) {
            changedIds.push(c.id)
          }
        })
        if (changedIds.length) {
          setRowHighlight((prev) => {
            const next = { ...prev }
            const now = Date.now()
            changedIds.forEach((id) => (next[id] = now))
            return next
          })
          setTimeout(() => {
            setRowHighlight((prev) => {
              const next: Record<string, number> = { ...prev }
              changedIds.forEach((id) => delete next[id])
              return next
            })
          }, 2500)
        }
      } else {
        setError('Failed to load campaigns')
      }
    } catch (err) {
      setError('Failed to fetch campaigns')
    } finally {
      setLoading(false)
    }
  }

  const updateCampaignStatus = async (campaignId: string, newStatus: CampaignStatus) => {
    try {
      // Optimistically update the UI
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: newStatus }
          : campaign
      ))

      // Close dropdown
      setDropdownOpen(null)

      // Here you would make an API call to update the campaign status
      // const response = await fetch(`/api/campaigns/${campaignId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // })

      console.log(`Campaign ${campaignId} status updated to ${newStatus}`)
    } catch (err) {
      console.error('Failed to update campaign status:', err)
      // Revert optimistic update on error
      fetchCampaigns()
    }
  }

  const getStatusConfig = (status: CampaignStatus) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          color: 'green',
          bgClass: 'bg-green-500/10',
          textClass: 'text-green-400',
          borderClass: 'border-green-500/30',
          indicatorClass: 'bg-green-500'
        }
      case 'paused':
        return {
          label: 'Paused',
          color: 'yellow',
          bgClass: 'bg-primary/10',
          textClass: 'text-primary',
          borderClass: 'border-primary/30',
          indicatorClass: 'bg-primary'
        }
      case 'inactive':
        return {
          label: 'Inactive',
          color: 'red',
          bgClass: 'bg-red-500/10',
          textClass: 'text-red-400',
          borderClass: 'border-red-500/30',
          indicatorClass: 'bg-red-500'
        }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleCreateCampaign = async (campaignData: any) => {
    try {
      console.log('Creating campaign:', campaignData)

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      })

      const result = await response.json()

      if (result.success) {
        fetchCampaigns()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const handleManageCampaign = (campaign: Campaign) => {
    // Directly open the edit modal
    setManagingCampaign(campaign)
  }

  const handleViewCampaign = (campaignId: string) => {
    router.push(`/dashboard/campaigns/${campaignId}`)
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        fetchCampaigns()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }



  // Sort campaigns by selected field or default to status
  const sortedCampaigns = filteredCampaigns.sort((a, b) => {
    if (!sortField) {
      // Default sort by status (active first, then paused, then inactive)
      const statusOrder = { 'active': 0, 'paused': 1, 'inactive': 2 }
      return statusOrder[a.status] - statusOrder[b.status]
    }

    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'status':
        const statusOrder = { 'active': 0, 'paused': 1, 'inactive': 2 }
        aValue = statusOrder[a.status]
        bValue = statusOrder[b.status]
        break
      case 'clicks':
        aValue = a.stats.totalClicks
        bValue = b.stats.totalClicks
        break
      case 'leads':
        aValue = a.stats.totalLeads
        bValue = b.stats.totalLeads
        break
      case 'conversion':
        aValue = a.stats.conversionRate
        bValue = b.stats.conversionRate
        break
      case 'created':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-primary">
              Campaign Management
            </h1>
            <p className="text-lg text-muted-foreground font-medium mt-2">
              Create, monitor, and optimize your marketing campaigns
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="premium-card p-8 shimmer">
              <div className="space-y-4">
                <div className="h-6 bg-muted/20 rounded w-2/3"></div>
                <div className="h-4 bg-muted/20 rounded w-1/2"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-8 bg-muted/20 rounded"></div>
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

  if (error) {
    return (
      <div className="space-y-8">
        <div className="premium-card p-12 text-center">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
            <WarningIcon size={32} />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Error Loading Campaigns</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button onClick={fetchCampaigns} className="premium-button-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Live Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div key={t.id} className="px-3 py-2 rounded-lg bg-white text-black text-sm shadow-lg border border-black/10">
            {t.text}
          </div>
        ))}
      </div>
      <div className="space-y-2 xxs:space-y-1 xs:space-y-3 sm:space-y-6 p-1 xxs:p-1 xs:p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              Campaign Management
            </h1>
            <p className="text-white/60 text-sm sm:text-base mt-1">Manage your marketing campaigns</p>
          </div>

          {/* Mobile Controls - Shows on mobile only */}
          <div className="lg:hidden space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Total Campaigns Count */}
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white min-w-0 flex-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black flex-shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span className="text-black text-sm font-bold whitespace-nowrap">
                  {sortedCampaigns.length} Campaign{sortedCampaigns.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Date Filter */}
              <div className="relative min-w-0 flex-1 sm:flex-initial sm:min-w-[180px]">
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
                        fetchCampaigns()
                      }
                    }}
                    className="px-4 py-3 rounded-xl bg-primary text-black text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Create Campaign Button */}
            <div className="flex">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 w-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(253, 198, 0, 0.3)',
                  boxShadow: '0 8px 32px rgba(253, 198, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  color: '#0a0a0a'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M12 5v14"/>
                  <path d="M5 12h14"/>
                </svg>
                <span>New Campaign</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar and Desktop Controls */}
        <div className="space-y-4 lg:space-y-0">
          {/* Desktop Layout - All on one row */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center space-x-3 flex-1 max-w-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="search"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base"
              />
            </div>

            {/* Right-aligned Controls */}
            <div className="flex items-center gap-4">
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
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm h-[52px] min-w-[180px]"
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

              {/* Total Campaigns Count */}
              <div className="flex items-center justify-center gap-2 px-4 rounded-xl bg-white h-[52px] min-w-[140px] flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black flex-shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span className="text-black text-sm font-bold whitespace-nowrap">
                  {sortedCampaigns.length} Campaign{sortedCampaigns.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Create Campaign Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
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
                  <path d="M12 5v14"/>
                  <path d="M5 12h14"/>
                </svg>
                <span className="whitespace-nowrap">New Campaign</span>
              </button>

              {/* View Mode Toggle - Hidden unless sidebar is compressed */}
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
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden bg-white/10 border border-white/20 rounded-xl p-4 flex items-center space-x-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Custom Date Range Picker */}
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
                      fetchCampaigns()
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

        {/* Campaign Display */}
        {sortedCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {searchQuery ? 'No campaigns match your search' : 'No campaigns found'}
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search terms or clear the filter to see all campaigns'
                : 'Create your first campaign to start tracking your marketing performance and manage conversions.'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Create Campaign</span>
            </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Super Responsive Table View */
          <div className="bg-white/5 rounded-xl lg:rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-2 sm:px-3 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-12 sm:w-16">
                      #
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide min-w-[200px] sm:w-64">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 sm:space-x-2 hover:text-white transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                        <span className="hidden sm:inline">CAMPAIGN</span>
                        <span className="sm:hidden">CAMP</span>
                        <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                      </button>
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide min-w-[150px]">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span>INFLUENCER</span>
                      </div>
                    </th>
                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-16 sm:w-24">
                      <button
                        onClick={() => handleSort('clicks')}
                        className="flex items-center space-x-1 sm:space-x-2 hover:text-white transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                          <path d="M9 12l2 2 4-4"/>
                          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                          <path d="M18 12c0 3-3 6-6 6s-6-3-6-6 3-6 6-6 6 3 6 6"/>
                        </svg>
                        <span>CLICKS</span>
                        <SortIcon field="clicks" sortField={sortField} sortDirection={sortDirection} />
                      </button>
                    </th>
                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-16 sm:w-24">
                      <button
                        onClick={() => handleSort('leads')}
                        className="flex items-center space-x-1 sm:space-x-2 hover:text-white transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="8.5" cy="7" r="4"/>
                          <line x1="20" y1="8" x2="20" y2="14"/>
                          <line x1="23" y1="11" x2="17" y2="11"/>
                        </svg>
                        <span>LEADS</span>
                        <SortIcon field="leads" sortField={sortField} sortDirection={sortDirection} />
                      </button>
                    </th>
                    {/* Show conversion type columns only if at least one campaign has them enabled */}
                    {(() => {
                      const showRegistrations = sortedCampaigns.some(campaign => campaign.registrations !== null && campaign.registrations > 0)
                      console.log('🔍 [TABLE DEBUG] Show Registrations column?', showRegistrations,
                        sortedCampaigns.map(c => ({name: c.name, registrations: c.registrations})))
                      console.log('🔍 [TABLE DEBUG] Total columns for conversion types:',
                        (showRegistrations ? 1 : 0) +
                        (sortedCampaigns.some(c => c.ftd !== null && c.ftd > 0) ? 1 : 0) +
                        (sortedCampaigns.some(c => c.approvedRegistrations !== null && c.approvedRegistrations > 0) ? 1 : 0) +
                        (sortedCampaigns.some(c => c.qualifiedDeposits !== null && c.qualifiedDeposits > 0) ? 1 : 0)
                      )
                      return showRegistrations
                    })() && (
                      <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-16 sm:w-24">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                          </svg>
                          <span>REGS</span>
                        </div>
                      </th>
                    )}
                    {sortedCampaigns.some(campaign => campaign.ftd !== null && campaign.ftd > 0) && (
                      <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-16 sm:w-24">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                            <circle cx="12" cy="2" r="3"/>
                            <path d="M12 21v-3"/>
                            <path d="M12 18h.01"/>
                            <path d="M8 5v5a4 4 0 0 0 8 0V5"/>
                          </svg>
                          <span>FTD</span>
                        </div>
                      </th>
                    )}
                    {sortedCampaigns.some(campaign => campaign.approvedRegistrations !== null && campaign.approvedRegistrations > 0) && (
                      <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-16 sm:w-24">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                          </svg>
                          <span>AREG</span>
                        </div>
                      </th>
                    )}
                    {sortedCampaigns.some(campaign => campaign.qualifiedDeposits !== null && campaign.qualifiedDeposits > 0) && (
                      <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-16 sm:w-24">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                            <circle cx="12" cy="2" r="3"/>
                            <path d="M12 21v-3"/>
                            <path d="M12 18h.01"/>
                            <path d="M8 5v5a4 4 0 0 0 8 0V5"/>
                          </svg>
                          <span>QFTD</span>
                        </div>
                      </th>
                    )}
                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-20 sm:w-28">
                      <button
                        onClick={() => handleSort('created')}
                        className="flex items-center space-x-1 sm:space-x-2 hover:text-white transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span className="hidden sm:inline">CREATED</span>
                        <span className="sm:hidden">DATE</span>
                        <SortIcon field="created" sortField={sortField} sortDirection={sortDirection} />
                      </button>
                    </th>
                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide min-w-[120px] sm:min-w-[160px]">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        <span className="hidden sm:inline">STATUS & ACTIONS</span>
                        <span className="sm:hidden text-[9px]">ACTIONS</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sortedCampaigns.map((campaign, index) => (
                    <tr
                      key={campaign.id}
                      className={`transition-colors ${rowHighlight[campaign.id] ? 'bg-green-500/10' : 'hover:bg-white/5'}`}
                    >
                      <td className="px-2 sm:px-3 py-3 sm:py-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getStatusConfig(campaign.status).indicatorClass}`} />
                            <span className="text-white/60 text-xs sm:text-sm font-medium">{index + 1}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-primary rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {campaign.logoUrl ? (
                              <img
                                src={campaign.logoUrl}
                                alt={`${campaign.name} logo`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <TargetIcon size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-black" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white text-xs sm:text-sm lg:text-base truncate">{campaign.name}</div>
                            <div className="text-[10px] sm:text-xs text-white/60 truncate">{campaign.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        {campaign.influencerId ? (
                          <Link
                            href={`/dashboard/influencers/${campaign.influencerId}`}
                            className="text-white/80 hover:text-primary text-xs sm:text-sm truncate transition-colors"
                          >
                            {getInfluencerName(campaign.influencerId)}
                          </Link>
                        ) : (
                          <div className="text-white/80 text-xs sm:text-sm truncate">{getInfluencerName(campaign.influencerId)}</div>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="text-primary font-semibold text-xs sm:text-sm">{campaign.stats.totalClicks.toLocaleString()}</div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="text-primary font-semibold text-xs sm:text-sm">{campaign.stats.totalLeads.toLocaleString()}</div>
                      </td>
                      {/* Only show conversion type data for campaigns that have them enabled */}
                      {sortedCampaigns.some(c => c.registrations !== null && c.registrations > 0) && (
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          {campaign.registrations !== null && campaign.registrations > 0 ? (
                            <div className="text-primary font-semibold text-xs sm:text-sm">
                              {campaign.registrations}
                            </div>
                          ) : (
                            <div className="text-gray-500 font-normal text-xs sm:text-sm">
                              Null
                            </div>
                          )}
                        </td>
                      )}
                      {sortedCampaigns.some(c => c.ftd !== null && c.ftd > 0) && (
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          {campaign.ftd !== null && campaign.ftd > 0 ? (
                            <div className="text-green-400 font-semibold text-xs sm:text-sm">
                              {campaign.ftd}
                            </div>
                          ) : (
                            <div className="text-gray-500 font-normal text-xs sm:text-sm">
                              Null
                            </div>
                          )}
                        </td>
                      )}
                      {sortedCampaigns.some(c => c.approvedRegistrations !== null && c.approvedRegistrations > 0) && (
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          {campaign.approvedRegistrations !== null && campaign.approvedRegistrations > 0 ? (
                            <div className="text-white font-semibold text-xs sm:text-sm">
                              {campaign.approvedRegistrations}
                            </div>
                          ) : (
                            <div className="text-gray-500 font-normal text-xs sm:text-sm">
                              Null
                            </div>
                          )}
                        </td>
                      )}
                      {sortedCampaigns.some(c => c.qualifiedDeposits !== null && c.qualifiedDeposits > 0) && (
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          {campaign.qualifiedDeposits !== null && campaign.qualifiedDeposits > 0 ? (
                            <div className="text-green-400 font-semibold text-xs sm:text-sm">
                              {campaign.qualifiedDeposits}
                            </div>
                          ) : (
                            <div className="text-gray-500 font-normal text-xs sm:text-sm">
                              Null
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="flex flex-col">
                          <div className="text-white font-medium text-xs sm:text-sm">
                            <span className="hidden sm:inline">
                              {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit'
                              })}
                            </span>
                            <span className="sm:hidden">
                              {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                                month: 'numeric',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="text-white/50 text-[10px] sm:text-xs">
                            {new Date(campaign.createdAt).getFullYear()}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-right">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                          {/* Status Dropdown */}
                          <div className="relative" ref={dropdownOpen === campaign.id ? dropdownRef : null}>
                            <button
                              onClick={() => setDropdownOpen(dropdownOpen === campaign.id ? null : campaign.id)}
                              className={`w-14 sm:w-20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-xs font-medium flex items-center justify-center space-x-1 border transition-colors ${
                                getStatusConfig(campaign.status).bgClass
                              } ${
                                getStatusConfig(campaign.status).textClass
                              } ${
                                getStatusConfig(campaign.status).borderClass
                              }`}
                            >
                              <span className="text-[7px] sm:text-[8px] tracking-[0.2em] sm:tracking-[0.3em]">{getStatusConfig(campaign.status).label.toUpperCase()}</span>
                            </button>

                            {dropdownOpen === campaign.id && (
                              <div className="absolute top-full right-0 mt-1 w-28 sm:w-32 bg-background/95 border border-white/20 rounded-lg overflow-hidden z-10">
                                <button
                                  onClick={() => updateCampaignStatus(campaign.id, 'active')}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs hover:bg-green-500/10 flex items-center space-x-1 sm:space-x-2 text-green-400"
                                >
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
                                  <span>Active</span>
                                </button>
                                <button
                                  onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs hover:bg-primary/10 flex items-center space-x-1 sm:space-x-2 text-primary"
                                >
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
                                  <span>Paused</span>
                                </button>
                                <button
                                  onClick={() => updateCampaignStatus(campaign.id, 'inactive')}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs hover:bg-red-500/10 flex items-center space-x-1 sm:space-x-2 text-red-400"
                                >
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" />
                                  <span>Inactive</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* View Button */}
                          <button
                            onClick={() => handleViewCampaign(campaign.id)}
                            className="w-10 sm:w-16 px-1 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs font-bold rounded-lg bg-primary text-black hover:bg-primary/90 transition-colors flex items-center justify-center"
                          >
                            <span className="hidden sm:inline">VIEW</span>
                            <span className="sm:hidden">V</span>
                          </button>

                          {/* Manage Button */}
                          <button
                            onClick={() => handleManageCampaign(campaign)}
                            className="w-12 sm:w-20 px-1 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-xs font-bold rounded-lg bg-white text-black hover:bg-white/90 transition-colors flex items-center justify-center"
                          >
                            <span className="hidden sm:inline">MANAGE</span>
                            <span className="sm:hidden">M</span>
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
          /* Responsive Compact View Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {sortedCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="group relative rounded-xl lg:rounded-2xl px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6 cursor-pointer transition-all duration-300 bg-white/5 border border-white/10"
              >
                {/* Status Light Indicator */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${getStatusConfig(campaign.status).indicatorClass}`} />
                </div>

                {/* Campaign Header */}
                <div className="mb-4 sm:mb-5 -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 sm:-mt-5 lg:-mt-6 px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-4 sm:pb-5 rounded-t-xl lg:rounded-t-2xl bg-white/5" style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-primary rounded-lg xl:rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {campaign.logoUrl ? (
                        <img
                          src={campaign.logoUrl}
                          alt={`${campaign.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <TargetIcon size={20} className="sm:w-6 sm:h-6 lg:w-[26px] lg:h-[26px] text-black" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm sm:text-base lg:text-lg mb-0 truncate">{campaign.name}</h3>
                      <p className="text-white/60 text-xs font-mono truncate">
                        <span className="sm:hidden">{campaign.slug}</span>
                        <span className="hidden sm:inline">{campaign.slug} | {formatDate(campaign.createdAt)}</span>
                      </p>
                      <p className="text-white/50 text-[10px] sm:text-xs truncate mt-1">
                        <span className="text-primary">Influencer:</span> {getInfluencerName(campaign.influencerId)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid - Dynamic layout based on enabled conversion types */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-auto gap-2 sm:gap-3 lg:gap-2 py-3 sm:py-4" style={{
                  gridTemplateColumns: `repeat(${2 +
                    (campaign.registrations !== null && campaign.registrations > 0 ? 1 : 0) +
                    (campaign.ftd !== null && campaign.ftd > 0 ? 1 : 0) +
                    (campaign.approvedRegistrations !== null && campaign.approvedRegistrations > 0 ? 1 : 0) +
                    (campaign.qualifiedDeposits !== null && campaign.qualifiedDeposits > 0 ? 1 : 0)}, minmax(0, 1fr))`
                }}>
                  <div className="flex flex-col items-center py-1.5 sm:py-2">
                    <div className="bg-primary text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                      {campaign.stats.totalClicks.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">Clicks</div>
                  </div>
                  <div className="flex flex-col items-center py-1.5 sm:py-2">
                    <div className="bg-primary text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                      {campaign.stats.totalLeads.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">Leads</div>
                  </div>
                  {/* Only show conversion types that are enabled for this campaign */}
                  {(() => {
                    const showRegs = campaign.registrations !== null && campaign.registrations > 0
                    console.log(`🔍 [COMPACT DEBUG] ${campaign.name} - Show Registrations?`, showRegs, 'Value:', campaign.registrations)
                    return showRegs
                  })() && (
                    <div className="flex flex-col items-center py-1.5 sm:py-2">
                      <div className="bg-primary text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                        {campaign.registrations}
                      </div>
                      <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">Regs</div>
                    </div>
                  )}
                  {campaign.ftd !== null && campaign.ftd > 0 && (
                    <div className="flex flex-col items-center py-1.5 sm:py-2">
                      <div className="bg-primary text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                        {campaign.ftd}
                      </div>
                      <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">FTD</div>
                    </div>
                  )}
                  {campaign.approvedRegistrations !== null && campaign.approvedRegistrations > 0 && (
                    <div className="flex flex-col items-center py-1.5 sm:py-2">
                      <div className="bg-white text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                        {campaign.approvedRegistrations}
                      </div>
                      <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">AREG</div>
                    </div>
                  )}
                  {campaign.qualifiedDeposits !== null && campaign.qualifiedDeposits > 0 && (
                    <div className="flex flex-col items-center py-1.5 sm:py-2">
                      <div className="bg-green-500 text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                        {campaign.qualifiedDeposits}
                      </div>
                      <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">QFTD</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-white/10">
                  {/* Status Toggle Button */}
                  <div className="relative" ref={dropdownOpen === campaign.id ? dropdownRef : null}>
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === campaign.id ? null : campaign.id)}
                      className={`w-full px-2 sm:px-3 py-1 sm:py-1.5 rounded-md lg:rounded-lg text-[10px] sm:text-xs font-medium border transition-colors flex items-center justify-center ${
                        getStatusConfig(campaign.status).bgClass
                      } ${
                        getStatusConfig(campaign.status).textClass
                      } ${
                        getStatusConfig(campaign.status).borderClass
                      }`}
                    >
                      <span className="text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em]">
                        {getStatusConfig(campaign.status).label.toUpperCase()}
                      </span>
                    </button>

                    {/* Status Options Dropdown */}
                    {dropdownOpen === campaign.id && (
                      <div className="absolute bottom-full left-0 mb-2 w-28 sm:w-32 bg-background/95 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden z-10">
                        <button
                          onClick={() => updateCampaignStatus(campaign.id, 'active')}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs hover:bg-green-500/10 flex items-center space-x-2 text-green-400"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Active</span>
                        </button>
                        <button
                          onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs hover:bg-primary/10 flex items-center space-x-2 text-primary"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span>Paused</span>
                        </button>
                        <button
                          onClick={() => updateCampaignStatus(campaign.id, 'inactive')}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs hover:bg-red-500/10 flex items-center space-x-2 text-red-400"
                        >
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Inactive</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <button
                    onClick={() => handleViewCampaign(campaign.id)}
                    className="w-full px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-md lg:rounded-lg bg-primary text-black hover:bg-primary/90 transition-colors flex items-center justify-center"
                  >
                    VIEW
                  </button>

                  {/* Manage Button */}
                  <button
                    onClick={() => handleManageCampaign(campaign)}
                    className="w-full px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-black bg-white hover:bg-white/90 rounded-md lg:rounded-lg transition-colors flex items-center justify-center"
                  >
                    <span className="sm:hidden">EDIT</span>
                    <span className="hidden sm:inline">MANAGE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campaign Creation Modal */}
        <CampaignModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCampaign}
        />

        {/* Campaign Edit Modal */}
        {managingCampaign && (
          <CampaignModal
            isOpen={true}
            onClose={() => setManagingCampaign(null)}
            onDelete={handleDeleteCampaign}
            onSubmit={async (updatedData) => {
              try {
                console.log('Updating campaign:', managingCampaign.id, updatedData)

                const response = await fetch(`/api/campaigns/${managingCampaign.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedData)
                })

                const result = await response.json()

                if (result.success) {
                  setManagingCampaign(null)
                  fetchCampaigns()
                } else {
                  throw new Error(result.error)
                }
              } catch (error) {
                console.error('Error updating campaign:', error)
              }
            }}
            editMode={managingCampaign}
          />
        )}
      </div>
    </div>
  )
}
