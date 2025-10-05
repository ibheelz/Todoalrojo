'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BackArrowIcon, UserIcon, CompanyIcon, EmailIcon, PhoneIcon, LocationIcon, ClicksIcon, EventsIcon, TargetIcon, RevenueIcon } from '@/components/ui/icons'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'

interface CustomerDetails {
  id: string
  masterEmail: string | null
  masterPhone: string | null
  firstName: string | null
  lastName: string | null
  company: string | null
  jobTitle: string | null
  source: string | null
  country: string | null
  region: string | null
  city: string | null
  profileImage: string | null
  assignedTeam: string[]
  totalClicks: number
  totalLeads: number
  totalEvents: number
  totalRevenue: number
  createdAt: string
  lastSeen: string
  firstSeen: string
  isActive: boolean
  isFraud: boolean
  identifiers: Array<{
    id: string
    type: string
    value: string
    isVerified: boolean
    isPrimary: boolean
    createdAt: string
    source: string | null
    campaign: string | null
  }>
  clicks: Array<{
    id: string
    clickId: string | null
    campaign: string | null
    source: string | null
    medium: string | null
    ip: string
    country: string | null
    city: string | null
    device: string | null
    browser: string | null
    os: string | null
    createdAt: string
  }>
  leads: Array<{
    id: string
    email: string | null
    phone: string | null
    firstName: string | null
    lastName: string | null
    campaign: string | null
    source: string | null
    medium: string | null
    ip: string | null
    country: string | null
    city: string | null
    landingPage: string | null
    formUrl: string | null
    userAgent: string | null
    customFields: any
    qualityScore: number | null
    isDuplicate: boolean
    value: number | null
    clickId: string | null
    createdAt: string
  }>
  events: Array<{
    id: string
    eventType: string
    eventName: string | null
    category: string | null
    value: number | null
    currency: string | null
    isRevenue: boolean
    isConverted: boolean
    campaign: string | null
    clickId: string | null
    createdAt: string
  }>
}

interface CampaignActivity {
  campaign: string
  clicks: number
  leads: number
  events: number
  conversions: number
  totalValue: number
  firstSeen: string
  lastSeen: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [campaignActivity, setCampaignActivity] = useState<CampaignActivity[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [showLeadModal, setShowLeadModal] = useState(false)

  console.log('🚀 CustomerDetailPage mounted with ID:', customerId)
  console.log('📊 Current state - loading:', loading, 'error:', error, 'customer:', !!customer)

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails()
      fetchCampaignActivity()
    }
  }, [customerId])

  const fetchCustomerDetails = async () => {
    try {
      console.log('🔍 Fetching customer details for ID:', customerId)
      const response = await fetch(`/api/customers/${customerId}`)
      console.log('📡 Response status:', response.status)

      const data = await response.json()
      console.log('📄 Response data:', data)

      if (data.success) {
        console.log('✅ Customer data loaded successfully:', data.customer)
        setCustomer(data.customer)
      } else {
        console.log('❌ Failed to load customer:', data.error)
        setError(data.error || 'Failed to load customer details')
      }
    } catch (err) {
      console.error('🚨 Fetch error:', err)
      setError('Failed to fetch customer details')
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaignActivity = async () => {
    try {
      setLoadingCampaigns(true)
      console.log('🔍 Fetching campaign activity for customer:', customerId)
      const response = await fetch(`/api/customers/${customerId}/campaigns`)
      const data = await response.json()

      if (data.success) {
        console.log('✅ Campaign activity loaded:', data.campaigns)
        setCampaignActivity(data.campaigns)
      } else {
        console.log('❌ Failed to load campaigns:', data.error)
      }
    } catch (err) {
      console.error('🚨 Campaign fetch error:', err)
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const getDisplayName = () => {
    const firstName = customer?.firstName?.trim()
    const lastName = customer?.lastName?.trim()

    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    } else if (firstName) {
      return firstName
    } else if (lastName) {
      return lastName
    }
    return customer?.masterEmail || customer?.masterPhone || 'Unknown Customer'
  }

  const getJourneyTimeline = () => {
    if (!customer) return []

    const timeline = []

    // Add clicks
    customer.clicks.forEach(click => {
      timeline.push({
        type: 'click',
        date: new Date(click.createdAt),
        title: 'Click Event',
        description: `${click.campaign || 'Unknown Campaign'} | ${click.source || 'Unknown Source'}`,
        clickId: click.clickId,
        data: click
      })
    })

    // Add leads
    customer.leads.forEach(lead => {
      timeline.push({
        type: 'lead',
        date: new Date(lead.createdAt),
        title: 'Lead Submission',
        description: `Campaign: ${lead.campaign || 'Unknown'}`,
        clickId: lead.clickId,
        data: lead
      })
    })

    // Add conversions
    customer.events.forEach(event => {
      timeline.push({
        type: 'conversion',
        date: new Date(event.createdAt),
        title: event.eventName || event.eventType,
        description: `${event.eventType}${event.isRevenue ? ` | Revenue: $${event.value}` : ''}`,
        clickId: event.clickId,
        data: event
      })
    })

    return timeline.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const getTeamMembers = (teamIds: string[]) => {
    const teamMembers = [
      { id: 'team1', name: 'Alice Johnson', role: 'Account Manager', color: 'bg-pink-500' },
      { id: 'team2', name: 'Bob Smith', role: 'Sales Rep', color: 'bg-blue-500' },
      { id: 'team3', name: 'Carol Davis', role: 'Customer Success', color: 'bg-green-500' },
    ]

    return teamIds.map(teamId => {
      const member = teamMembers.find(m => m.id === teamId)
      return member || { id: teamId, name: 'Unknown', role: 'Team Member', color: 'bg-gray-500' }
    })
  }

  const handleViewLead = (leadData: any) => {
    setSelectedLead(leadData)
    setShowLeadModal(true)
  }

  const getCountryFlag = (country: string | null) => {
    if (!country) return ''

    const countryFlags: { [key: string]: string } = {
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'Denmark': '🇩🇰',
      'Finland': '🇫🇮',
      'Japan': '🇯🇵',
      'South Korea': '🇰🇷',
      'China': '🇨🇳',
      'India': '🇮🇳',
      'Brazil': '🇧🇷',
      'Mexico': '🇲🇽',
      'Argentina': '🇦🇷',
      'Chile': '🇨🇱',
      'Colombia': '🇨🇴',
      'Peru': '🇵🇪',
      'Venezuela': '🇻🇪',
      'Russia': '🇷🇺',
      'Poland': '🇵🇱',
      'Portugal': '🇵🇹',
      'Switzerland': '🇨🇭',
      'Austria': '🇦🇹',
      'Ireland': '🇮🇪',
      'New Zealand': '🇳🇿',
      'South Africa': '🇿🇦',
      'Turkey': '🇹🇷',
      'Greece': '🇬🇷',
      'Czech Republic': '🇨🇿',
      'Hungary': '🇭🇺',
      'Romania': '🇷🇴',
      'Bulgaria': '🇧🇬',
      'Croatia': '🇭🇷',
      'Slovenia': '🇸🇮',
      'Slovakia': '🇸🇰',
      'Estonia': '🇪🇪',
      'Latvia': '🇱🇻',
      'Lithuania': '🇱🇹',
      'Ukraine': '🇺🇦',
      'Belarus': '🇧🇾',
      'Israel': '🇮🇱',
      'Egypt': '🇪🇬',
      'Morocco': '🇲🇦',
      'Algeria': '🇩🇿',
      'Tunisia': '🇹🇳',
      'Nigeria': '🇳🇬',
      'Kenya': '🇰🇪',
      'Ghana': '🇬🇭',
      'Thailand': '🇹🇭',
      'Vietnam': '🇻🇳',
      'Philippines': '🇵🇭',
      'Malaysia': '🇲🇾',
      'Singapore': '🇸🇬',
      'Indonesia': '🇮🇩',
      'Pakistan': '🇵🇰',
      'Bangladesh': '🇧🇩',
      'Sri Lanka': '🇱🇰',
      // Common abbreviations
      'UK': '🇬🇧',
      'US': '🇺🇸',
      'USA': '🇺🇸'
    }

    // Try exact match first, then case-insensitive
    return countryFlags[country] || countryFlags[country?.toLowerCase()] || ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse p-6 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-muted/20 rounded-lg"></div>
            <div className="w-12 h-12 bg-muted/20 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted/20 rounded"></div>
              <div className="h-4 w-32 bg-muted/20 rounded"></div>
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 h-24"></div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-96"></div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-foreground mb-2">Customer Not Found</div>
          <div className="text-muted-foreground mb-4">{error || 'The requested customer could not be found.'}</div>
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(253, 198, 0, 0.3)',
              boxShadow: '0 8px 32px rgba(253, 198, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              color: '#0a0a0a'
            }}
          >
            <BackArrowIcon size={16} />
            <span>Back to Lead Tracking</span>
          </Link>
        </div>
      </div>
    )
  }

  const timeline = getJourneyTimeline()
  const teamMembers = getTeamMembers(customer.assignedTeam)

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header matching sidebar theme */}
      <div className="premium-card mx-6 mt-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-3 rounded-xl transition-all duration-200 hover:bg-white/10 border border-white/10"
            >
              <BackArrowIcon size={20} className="text-muted-foreground" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar
                  firstName={customer.firstName}
                  lastName={customer.lastName}
                  email={customer.masterEmail}
                  userId={customer.id}
                  size="lg"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{getDisplayName()}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-muted-foreground">Customer Tracking Profile</span>
                  {customer.identifiers?.find(id => id.type === 'CLICK_ID' && id.isPrimary)?.value && (
                    <span className="text-sm font-mono text-yellow-400 px-2 py-1 rounded inline-block" style={{
                      background: 'rgba(253, 198, 0, 0.1)',
                      border: '1px solid rgba(253, 198, 0, 0.3)'
                    }}>
                      {customer.identifiers?.find(id => id.type === 'CLICK_ID' && id.isPrimary)?.value}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {customer.isFraud && (
              <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                ⚠️ Fraud Flag
              </div>
            )}
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Last Seen</div>
              <div className="text-sm font-medium text-foreground">{new Date(customer.lastSeen).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-6 space-y-6">
        {/* Customer Overview - Minimalist 4-column grid */}
        <div className="premium-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <UserIcon size={24} className="text-primary" />
            Customer Overview
          </h2>

          <div className="grid grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Contact</h3>
              <div className="space-y-2">
                {customer.masterEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <EmailIcon size={16} className="text-muted-foreground" />
                    <span className="text-foreground">{customer.masterEmail}</span>
                  </div>
                )}
                {customer.masterPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <PhoneIcon size={16} className="text-muted-foreground" />
                    <span className="text-foreground">{customer.masterPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Location</h3>
              <div className="space-y-2">
                {customer.country && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{getCountryFlag(customer.country)}</span>
                    <span className="text-foreground">{customer.country}</span>
                  </div>
                )}
                {customer.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <LocationIcon size={16} className="text-muted-foreground" />
                    <span className="text-foreground">{customer.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Source & Attribution */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Attribution</h3>
              <div className="space-y-2">
                {customer.source && (
                  <div className="flex items-center gap-2 text-sm">
                    <TargetIcon size={16} className="text-muted-foreground" />
                    <span className="text-foreground">{customer.source}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Joined {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary - 3 columns (removed revenue) */}
        <div className="premium-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6"/>
              <path d="m21 12-6 0m-6 0-6 0"/>
            </svg>
            Activity Summary
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg bg-white/5 border border-white/10">
              <div className="text-3xl font-bold text-foreground">{customer.totalClicks}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide mt-2">Total Clicks</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-white/5 border border-white/10">
              <div className="text-3xl font-bold text-foreground">{customer.totalLeads}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide mt-2">Total Leads</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-white/5 border border-white/10">
              <div className="text-3xl font-bold text-foreground">{customer.totalEvents}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide mt-2">Conversions</div>
            </div>
          </div>
        </div>

        {/* Campaign Activity */}
        <div className="premium-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Campaign Activity
            <span className="text-sm text-muted-foreground ml-2">
              ({loadingCampaigns ? '...' : campaignActivity.length} {campaignActivity.length === 1 ? 'campaign' : 'campaigns'})
            </span>
          </h2>

          {loadingCampaigns ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-white/5 rounded-lg"></div>
                <div className="h-16 bg-white/5 rounded-lg"></div>
              </div>
            </div>
          ) : campaignActivity.length > 0 ? (
            <div className="space-y-4">
              {campaignActivity.map((campaign, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{campaign.campaign}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Clicks</div>
                          <div className="text-xl font-bold text-foreground mt-1">{campaign.clicks}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Leads</div>
                          <div className="text-xl font-bold text-foreground mt-1">{campaign.leads}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Events</div>
                          <div className="text-xl font-bold text-foreground mt-1">{campaign.events}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Conversions</div>
                          <div className="text-xl font-bold text-primary mt-1">{campaign.conversions}</div>
                        </div>
                      </div>
                      {campaign.totalValue > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Value</div>
                          <div className="text-lg font-bold text-green-400 mt-1">${campaign.totalValue.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xs text-muted-foreground">First Seen</div>
                      <div className="text-sm font-medium text-foreground">{new Date(campaign.firstSeen).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground mt-2">Last Seen</div>
                      <div className="text-sm font-medium text-foreground">{new Date(campaign.lastSeen).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Campaign Activity</h3>
              <p className="text-muted-foreground">This customer hasn't been associated with any campaigns yet.</p>
            </div>
          )}
        </div>

        {/* Journey Timeline with SVG icons and yellow circles */}
        <div className="premium-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            🗺️ Customer Journey
            <span className="text-sm text-muted-foreground ml-2">({timeline.filter(item => item.type === 'conversion').length} conversions)</span>
          </h2>

          {timeline.length > 0 ? (
            <div className="relative space-y-6">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10"></div>

              {timeline.map((item, index) => (
                <div key={index} className="relative flex items-start">
                  {/* Yellow circle with black SVG icon */}
                  <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400 border-2 border-yellow-400">
                    {item.type === 'click' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                        <path d="M9 9h6l-3-3z"/>
                        <path d="M15 15l-3 3-3-3"/>
                        <path d="M12 9v12"/>
                      </svg>
                    ) : item.type === 'lead' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    ) : item.type === 'conversion' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                        <circle cx="12" cy="12" r="2"/>
                        <circle cx="12" cy="1" r="1"/>
                        <circle cx="12" cy="23" r="1"/>
                        <circle cx="20" cy="12" r="1"/>
                        <circle cx="4" cy="12" r="1"/>
                      </svg>
                    )}
                  </div>

                  {/* Timeline content */}
                  <div className="ml-6 flex-1 bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        {item.clickId && (
                          <div className="mt-2">
                            <span className="text-sm font-mono text-yellow-400 px-2 py-1 rounded inline-block" style={{
                              background: 'rgba(253, 198, 0, 0.1)',
                              border: '1px solid rgba(253, 198, 0, 0.3)'
                            }}>
                              {item.clickId}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleTimeString()}
                          </div>
                        </div>
                        {item.type === 'lead' && (
                          <button
                            onClick={() => handleViewLead(item.data)}
                            className="px-3 py-1 text-xs font-medium bg-yellow-400 text-black rounded-lg transition-all duration-200 hover:bg-yellow-300 hover:shadow-lg border border-yellow-500"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Journey Data</h3>
              <p className="text-muted-foreground">This customer doesn't have any recorded journey conversions yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Lead Details Modal */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Lead Submission Details</h3>
                <button
                  onClick={() => setShowLeadModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLead.firstName && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">First Name</div>
                        <div className="text-sm font-medium text-foreground mt-1">{selectedLead.firstName}</div>
                      </div>
                    )}
                    {selectedLead.lastName && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Last Name</div>
                        <div className="text-sm font-medium text-foreground mt-1">{selectedLead.lastName}</div>
                      </div>
                    )}
                    {selectedLead.email && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Email</div>
                        <div className="text-sm font-medium text-foreground mt-1">{selectedLead.email}</div>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Phone</div>
                        <div className="text-sm font-medium text-foreground mt-1">{selectedLead.phone}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Campaign & Attribution */}
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Campaign & Attribution
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLead.campaign && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Campaign</div>
                        <div className="text-sm font-medium text-foreground mt-1">{selectedLead.campaign}</div>
                      </div>
                    )}
                    {selectedLead.source && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Source</div>
                        <div className="text-sm font-medium text-foreground mt-1">{selectedLead.source}</div>
                      </div>
                    )}
                    {selectedLead.medium && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Medium</div>
                        <div className="text-sm font-medium text-foreground mt-1">{selectedLead.medium}</div>
                      </div>
                    )}
                    {selectedLead.clickId && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Click ID</div>
                        <div className="text-sm font-mono text-yellow-400 mt-1 px-2 py-1 rounded inline-block" style={{
                          background: 'rgba(253, 198, 0, 0.1)',
                          border: '1px solid rgba(253, 198, 0, 0.3)'
                        }}>
                          {selectedLead.clickId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Information */}
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1H3c-.552 0-1 .448-1 1s.448 1 1 1h18z"/>
                    </svg>
                    Technical Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLead.ip && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">IP Address</div>
                        <div className="text-sm font-medium text-foreground mt-1">{selectedLead.ip}</div>
                      </div>
                    )}
                    {selectedLead.country && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Country</div>
                        <div className="text-sm font-medium text-foreground mt-1 flex items-center gap-2">
                          <span className="text-lg">{getCountryFlag(selectedLead.country)}</span>
                          {selectedLead.country}
                        </div>
                      </div>
                    )}
                    {selectedLead.city && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">City</div>
                        <div className="text-sm font-medium text-foreground mt-1">{selectedLead.city}</div>
                      </div>
                    )}
                    {selectedLead.landingPage && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Landing Page</div>
                        <div className="text-sm font-medium text-foreground mt-1 truncate">{selectedLead.landingPage}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Fields */}
                {selectedLead.customFields && Object.keys(selectedLead.customFields).length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                      Custom Form Fields
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(selectedLead.customFields).map(([key, value]) => (
                        <div key={key} className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div className="text-sm font-medium text-foreground mt-1">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission Details */}
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6"/>
                      <path d="m21 12-6 0m-6 0-6 0"/>
                    </svg>
                    Submission Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Submitted At</div>
                      <div className="text-sm font-medium text-foreground mt-1">
                        {new Date(selectedLead.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {selectedLead.value && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Lead Value</div>
                        <div className="text-sm font-medium text-foreground mt-1">${selectedLead.value}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowLeadModal(false)}
                  className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
                    color: '#0a0a0a',
                    border: '1px solid rgba(253, 198, 0, 0.3)'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
