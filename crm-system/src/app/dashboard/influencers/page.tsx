'use client'

import { useEffect, useState, useRef } from 'react'
import { InfluencerIcon, UsersIcon, EmailIcon, PhoneIcon, CampaignIcon, TargetIcon, AnalyticsIcon, PlusIcon } from '@/components/ui/icons'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Select } from '@/components/ui/select'

interface Campaign {
  id: string
  name: string
  status: 'active' | 'paused' | 'completed'
  startDate: string
  endDate: string | null
}

interface Lead {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  source: string
  campaign: string
  value: number | null
  createdAt: string
  qualityScore: number
}

type InfluencerStatus = 'active' | 'paused' | 'inactive'

interface Influencer {
  id: string
  name: string
  email: string | null
  phone: string | null
  socialHandle: string | null
  platform: string
  followers: number
  engagementRate: number
  category: string
  location: string | null
  status: InfluencerStatus
  assignedCampaigns: string[]
  totalLeads: number
  totalClicks: number
  totalRegs: number
  totalFtd: number
  createdAt: string
  leads: Lead[]
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

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCampaigns, setSelectedCampaigns] = useState([])
  const [viewMode, setViewMode] = useState<'compact' | 'table'>('compact')
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Auto-set compact mode for smaller devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setViewMode('compact')
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch influencers and campaigns in parallel
      const [influencersResponse, campaignsResponse] = await Promise.all([
        fetch('/api/influencers'),
        fetch('/api/campaigns')
      ])

      if (influencersResponse.ok) {
        const influencersData = await influencersResponse.json()
        if (influencersData.success) {
          // Transform data to match the interface
          const transformedInfluencers = influencersData.influencers.map((inf: any) => ({
            id: inf.id,
            name: inf.name,
            email: inf.email,
            phone: inf.phone,
            socialHandle: inf.socialHandle,
            platform: inf.platform || 'Unknown',
            followers: inf.followers || 0,
            engagementRate: inf.engagementRate || 0,
            category: inf.category || 'Uncategorized',
            location: inf.location,
            status: inf.status as InfluencerStatus,
            assignedCampaigns: inf.campaigns?.map((c: any) => c.id) || [],
            totalLeads: inf.totalLeads || 0,
            totalClicks: inf.totalClicks || 0,
            totalRegs: inf.totalRegs || 0,
            totalFtd: inf.totalFtd || 0,
            createdAt: inf.createdAt,
            leads: inf.leads || []
          }))
          setInfluencers(transformedInfluencers)
        }
      }

      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json()
        if (campaignsData.success) {
          const transformedCampaigns = campaignsData.campaigns.map((camp: any) => ({
            id: camp.id,
            name: camp.name,
            status: camp.isActive ? 'active' : 'paused' as any,
            startDate: camp.createdAt,
            endDate: null
          }))
          setCampaigns(transformedCampaigns)
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateInfluencerStatus = async (influencerId: string, newStatus: InfluencerStatus) => {
    try {
      // Optimistically update the UI
      setInfluencers(prev => prev.map(influencer =>
        influencer.id === influencerId
          ? { ...influencer, status: newStatus }
          : influencer
      ))

      // Close dropdown
      setDropdownOpen(null)

      // Here you would make an API call to update the influencer status
      // const response = await fetch(`/api/influencers/${influencerId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // })

      console.log(`Influencer ${influencerId} status updated to ${newStatus}`)
    } catch (err) {
      console.error('Failed to update influencer status:', err)
      // Revert optimistic update on error
      // fetchInfluencers()
    }
  }

  const filteredInfluencers = influencers.filter(influencer =>
    influencer.name.toLowerCase().includes(search.toLowerCase()) ||
    influencer.socialHandle?.toLowerCase().includes(search.toLowerCase()) ||
    influencer.category.toLowerCase().includes(search.toLowerCase())
  )

  // Sort influencers by selected field or default to status
  const sortedInfluencers = filteredInfluencers.sort((a, b) => {
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
        aValue = a.totalClicks
        bValue = b.totalClicks
        break
      case 'leads':
        aValue = a.totalLeads
        bValue = b.totalLeads
        break
      case 'regs':
        aValue = a.totalRegs
        bValue = b.totalRegs
        break
      case 'ftd':
        aValue = a.totalFtd
        bValue = b.totalFtd
        break
      case 'campaigns':
        aValue = a.assignedCampaigns.length
        bValue = b.assignedCampaigns.length
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    return campaign?.name || 'Unknown Campaign'
  }

  const handleAssignToCampaign = (influencerId: string) => {
    setSelectedInfluencer(influencerId)
    setShowAssignModal(true)
  }

  const confirmAssignment = () => {
    if (selectedInfluencer && selectedCampaign) {
      setInfluencers(prev => prev.map(inf =>
        inf.id === selectedInfluencer
          ? { ...inf, assignedCampaigns: [...inf.assignedCampaigns, selectedCampaign] }
          : inf
      ))
      setShowAssignModal(false)
      setSelectedCampaign('')
      setSelectedInfluencer(null)
    }
  }

  const getStatusConfig = (status: InfluencerStatus) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse p-6 space-y-6">
          <div className="h-8 w-64 bg-muted/20 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 h-48"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-2 xxs:space-y-1 xs:space-y-3 sm:space-y-6 p-1 xxs:p-1 xs:p-2 sm:p-4 lg:p-6">
        {/* Header - Super Responsive */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-primary truncate">
                Influencer Management
              </h1>
              <p className="text-white/60 text-sm sm:text-base mt-1">Manage your influencer partnerships</p>
            </div>
            <div className="hidden lg:flex items-center justify-end">
              <button className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(253, 198, 0, 0.3)',
                  boxShadow: '0 8px 32px rgba(253, 198, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  color: '#0a0a0a'
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-4 h-4">
                  <path d="M12 5v14"/>
                  <path d="M5 12h14"/>
                </svg>
                <span>Add Influencer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Controls - Shows on mobile only */}
        <div className="lg:hidden space-y-3">
          {/* Total Influencers Count */}
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black flex-shrink-0">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            <span className="text-black text-sm font-bold whitespace-nowrap">
              {sortedInfluencers.length} Influencer{sortedInfluencers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Add Influencer Button */}
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(253, 198, 0, 0.3)',
              boxShadow: '0 8px 32px rgba(253, 198, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              color: '#0a0a0a'
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="flex-shrink-0">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            <span>Add Influencer</span>
          </button>
        </div>

        {/* Desktop Search Bar and Controls - Shows on desktop only */}
        <div className="hidden lg:flex items-center justify-between gap-4 mb-4 sm:mb-6">
          {/* Responsive Search Bar */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center space-x-3 flex-1 max-w-sm lg:max-w-md xl:max-w-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="Search influencers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base"
            />
          </div>

          {/* Right-aligned controls */}
          <div className="flex items-center gap-4">
            {/* Total Influencers Count */}
            <div className="flex items-center justify-center gap-2 px-4 rounded-xl bg-white h-[52px] min-w-[140px] flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black flex-shrink-0">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              <span className="text-black text-sm font-bold whitespace-nowrap">
                {sortedInfluencers.length} Influencer{sortedInfluencers.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 backdrop-blur-sm">
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

        {/* Mobile Search Bar - Shows on mobile only */}
        <div className="lg:hidden mb-4 sm:mb-6">
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center space-x-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="Search influencers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Content - Super Responsive */}
        {viewMode === 'compact' ? (
          /* Super Responsive Compact View Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {sortedInfluencers.map((influencer) => (
              <div
                key={influencer.id}
                className="group relative rounded-xl lg:rounded-2xl px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6 cursor-pointer transition-all duration-300 bg-white/5 border border-white/10"
              >
                {/* Status Light Indicator */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${getStatusConfig(influencer.status).indicatorClass}`} />
                </div>

                {/* Influencer Header */}
                <div className="mb-4 sm:mb-5 -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 sm:-mt-5 lg:-mt-6 px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-4 sm:pb-5 rounded-t-xl lg:rounded-t-2xl bg-white/5" style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Avatar
                      firstName={influencer.name.split(' ')[0]}
                      lastName={influencer.name.split(' ')[1]}
                      size="md"
                      className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm sm:text-base lg:text-lg mb-0 truncate">{influencer.name}</h3>
                      <p className="text-white/60 text-xs font-mono truncate">
                        <span className="sm:hidden">{influencer.socialHandle}</span>
                        <span className="hidden sm:inline">{influencer.socialHandle} | {new Date(influencer.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 py-3 sm:py-4">
                  <div className="flex flex-col items-center py-1.5 sm:py-2">
                    <div className="bg-primary text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                      {influencer.totalClicks.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">Clicks</div>
                  </div>
                  <div className="flex flex-col items-center py-1.5 sm:py-2">
                    <div className="bg-primary text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                      {influencer.totalLeads.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">Leads</div>
                  </div>
                  <div className="flex flex-col items-center py-1.5 sm:py-2">
                    <div className="bg-primary text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                      {influencer.totalRegs.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">Regs</div>
                  </div>
                  <div className="flex flex-col items-center py-1.5 sm:py-2">
                    <div className="bg-primary text-black font-black mb-2 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md lg:rounded-lg flex items-center justify-center text-xs sm:text-sm w-full">
                      {influencer.totalFtd.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs font-normal text-white/40 uppercase tracking-wide text-center">FTD</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-white/10">
                  {/* Status Toggle Button */}
                  <div className="relative" ref={dropdownOpen === influencer.id ? dropdownRef : null}>
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === influencer.id ? null : influencer.id)}
                      className={`w-full px-2 sm:px-3 py-1 sm:py-1.5 rounded-md lg:rounded-lg text-[10px] sm:text-xs font-medium border transition-colors flex items-center justify-center ${
                        getStatusConfig(influencer.status).bgClass
                      } ${
                        getStatusConfig(influencer.status).textClass
                      } ${
                        getStatusConfig(influencer.status).borderClass
                      }`}
                    >
                      <span className="text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em]">
                        {getStatusConfig(influencer.status).label.toUpperCase()}
                      </span>
                    </button>

                    {/* Status Options Dropdown */}
                    {dropdownOpen === influencer.id && (
                      <div className="absolute bottom-full left-0 mb-2 w-28 sm:w-32 bg-background/95 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden z-10">
                        <button
                          onClick={() => updateInfluencerStatus(influencer.id, 'active')}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs hover:bg-green-500/10 flex items-center space-x-2 text-green-400"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Active</span>
                        </button>
                        <button
                          onClick={() => updateInfluencerStatus(influencer.id, 'paused')}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs hover:bg-primary/10 flex items-center space-x-2 text-primary"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span>Paused</span>
                        </button>
                        <button
                          onClick={() => updateInfluencerStatus(influencer.id, 'inactive')}
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
                    className="w-full px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-md lg:rounded-lg bg-primary text-black hover:bg-primary/90 transition-colors flex items-center justify-center"
                  >
                    VIEW
                  </button>

                  {/* Manage Button */}
                  <button
                    className="w-full px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-black bg-white hover:bg-white/90 rounded-md lg:rounded-lg transition-colors flex items-center justify-center"
                  >
                    <span className="sm:hidden">EDIT</span>
                    <span className="hidden sm:inline">MANAGE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="8.5" cy="7" r="4"/>
                          <line x1="20" y1="8" x2="20" y2="14"/>
                          <line x1="23" y1="11" x2="17" y2="11"/>
                        </svg>
                        <span className="hidden sm:inline">INFLUENCER</span>
                        <span className="sm:hidden">INFL</span>
                        <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                      </button>
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
                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-16 sm:w-24">
                      <button
                        onClick={() => handleSort('regs')}
                        className="flex items-center space-x-1 sm:space-x-2 hover:text-white transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                        <span>REGS</span>
                        <SortIcon field="regs" sortField={sortField} sortDirection={sortDirection} />
                      </button>
                    </th>
                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-16 sm:w-24">
                      <button
                        onClick={() => handleSort('ftd')}
                        className="flex items-center space-x-1 sm:space-x-2 hover:text-white transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                        </svg>
                        <span>FTD</span>
                        <SortIcon field="ftd" sortField={sortField} sortDirection={sortDirection} />
                      </button>
                    </th>
                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide w-20 sm:w-28">
                      <button
                        onClick={() => handleSort('campaigns')}
                        className="flex items-center space-x-1 sm:space-x-2 hover:text-white transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary sm:w-4 sm:h-4">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                        <span className="hidden sm:inline">CAMPAIGNS</span>
                        <span className="sm:hidden">CAMP</span>
                        <SortIcon field="campaigns" sortField={sortField} sortDirection={sortDirection} />
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
                  {sortedInfluencers.map((influencer, index) => (
                    <tr key={influencer.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-2 sm:px-3 py-3 sm:py-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getStatusConfig(influencer.status).indicatorClass}`} />
                            <span className="text-white/60 text-xs sm:text-sm font-medium">{index + 1}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <Avatar
                            firstName={influencer.name.split(' ')[0]}
                            lastName={influencer.name.split(' ')[1]}
                            size="sm"
                            className="w-6 h-6 sm:w-8 sm:h-8"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white text-xs sm:text-sm truncate">{influencer.name}</div>
                            <div className="text-white/60 text-[10px] sm:text-xs truncate">{influencer.socialHandle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="text-primary font-semibold text-xs sm:text-sm">{influencer.totalClicks.toLocaleString()}</div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="text-primary font-semibold text-xs sm:text-sm">{influencer.totalLeads.toLocaleString()}</div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="text-primary font-semibold text-xs sm:text-sm">{influencer.totalRegs.toLocaleString()}</div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="text-primary font-semibold text-xs sm:text-sm">{influencer.totalFtd.toLocaleString()}</div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="text-white text-xs sm:text-sm">
                          <span className="hidden sm:inline">{influencer.assignedCampaigns.length} assigned</span>
                          <span className="sm:hidden">{influencer.assignedCampaigns.length}</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-right">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                          {/* Status Dropdown */}
                          <div className="relative" ref={dropdownOpen === influencer.id ? dropdownRef : null}>
                            <button
                              onClick={() => setDropdownOpen(dropdownOpen === influencer.id ? null : influencer.id)}
                              className={`w-14 sm:w-20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-xs font-medium flex items-center justify-center space-x-1 border transition-colors ${
                                getStatusConfig(influencer.status).bgClass
                              } ${
                                getStatusConfig(influencer.status).textClass
                              } ${
                                getStatusConfig(influencer.status).borderClass
                              }`}
                            >
                              <span className="text-[7px] sm:text-[8px] tracking-[0.2em] sm:tracking-[0.3em]">{getStatusConfig(influencer.status).label.toUpperCase()}</span>
                            </button>

                            {dropdownOpen === influencer.id && (
                              <div className="absolute top-full right-0 mt-1 w-28 sm:w-32 bg-background/95 border border-white/20 rounded-lg overflow-hidden z-10">
                                <button
                                  onClick={() => updateInfluencerStatus(influencer.id, 'active')}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs hover:bg-green-500/10 flex items-center space-x-1 sm:space-x-2 text-green-400"
                                >
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
                                  <span>Active</span>
                                </button>
                                <button
                                  onClick={() => updateInfluencerStatus(influencer.id, 'paused')}
                                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs hover:bg-primary/10 flex items-center space-x-1 sm:space-x-2 text-primary"
                                >
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
                                  <span>Paused</span>
                                </button>
                                <button
                                  onClick={() => updateInfluencerStatus(influencer.id, 'inactive')}
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
                            className="w-10 sm:w-16 px-1 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs font-bold rounded-lg bg-primary text-black hover:bg-primary/90 transition-colors flex items-center justify-center"
                          >
                            <span className="hidden sm:inline">VIEW</span>
                            <span className="sm:hidden">V</span>
                          </button>

                          {/* Manage Button */}
                          <button
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
        )}

        {/* Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border border-white/10 rounded-lg p-4 max-w-sm w-full mx-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Assign to Campaign</h3>

              <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                {campaigns.filter(c => c.status === 'active').length === 0 && (
                  <p className="text-sm text-white/60 italic">No active campaigns available</p>
                )}
                {campaigns.filter(c => c.status === 'active').map((campaign) => (
                  <label
                    key={campaign.id}
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer"
                    style={{
                      background: selectedCampaign === campaign.id ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedCampaign === campaign.id ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCampaign === campaign.id}
                      onChange={(e) => {
                        // Single selection behavior - uncheck others
                        const newValue = e.target.checked ? campaign.id : ''
                        setSelectedCampaign(newValue)
                      }}
                      className="w-4 h-4 text-yellow-400 bg-transparent border-white/30 rounded focus:ring-yellow-400 focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{campaign.name}</div>
                      <div className="text-sm text-white/60">
                        {campaign.startDate} - {campaign.endDate || 'Ongoing'}
                      </div>
                    </div>
                    {selectedCampaign === campaign.id && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    )}
                  </label>
                ))}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-3 py-2 text-xs bg-muted/20 hover:bg-muted/30 text-foreground rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAssignment}
                  disabled={!selectedCampaign}
                  className="flex-1 px-3 py-2 text-xs bg-primary hover:bg-primary/90 text-black disabled:opacity-50 rounded"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}

        {sortedInfluencers.length === 0 && !loading && (
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 mx-auto mb-6 text-primary">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {search ? 'No influencers match your search' : 'No influencers found'}
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto leading-relaxed">
              {search
                ? 'Try adjusting your search terms or clear the filter to see all influencers'
                : 'Add your first influencer to start managing partnerships and tracking performance.'
              }
            </p>
            {!search && (
              <button
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
                <span>Add Influencer</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}