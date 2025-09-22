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
    createdAt: string
  }>
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  console.log('🚀 CustomerDetailPage mounted with ID:', customerId)
  console.log('📊 Current state - loading:', loading, 'error:', error, 'customer:', !!customer)

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails()
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

  const getDisplayName = () => {
    if (customer?.firstName && customer?.lastName) {
      return `${customer.firstName} ${customer.lastName}`
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
        description: `Campaign: ${lead.campaign || 'Unknown'} | Quality: ${lead.qualityScore || 0}%`,
        data: lead
      })
    })

    // Add events
    customer.events.forEach(event => {
      timeline.push({
        type: 'event',
        date: new Date(event.createdAt),
        title: event.eventName || event.eventType,
        description: `${event.eventType} | ${event.isRevenue ? `Revenue: $${event.value}` : 'No revenue'}`,
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
      'UK': '🇬🇧',
      'US': '🇺🇸',
      'USA': '🇺🇸'
    }

    return countryFlags[country] || '🌍'
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
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b-2 border-primary/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted/50 rounded-xl transition-colors"
            >
              <BackArrowIcon size={20} className="text-muted-foreground" />
            </button>
            <div className="flex items-center space-x-3">
              <Avatar
                firstName={customer.firstName}
                lastName={customer.lastName}
                userId={customer.id}
                size="md"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{getDisplayName()}</h1>
                <p className="text-sm text-muted-foreground">Customer Tracking Profile</p>
              </div>
            </div>
          </div>

          {customer.isFraud && (
            <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground">
              Fraud Flag
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="premium-card text-center p-6">
            <div className="text-primary text-2xl mb-2">
              <ClicksIcon size={24} className="mx-auto" />
            </div>
            <div className="text-2xl font-bold text-foreground">{customer.totalClicks}</div>
            <div className="text-sm text-muted-foreground">Total Clicks</div>
          </div>

          <div className="premium-card text-center p-6">
            <div className="text-primary text-2xl mb-2">
              <TargetIcon size={24} className="mx-auto" />
            </div>
            <div className="text-2xl font-bold text-foreground">{customer.totalLeads}</div>
            <div className="text-sm text-muted-foreground">Total Leads</div>
          </div>

          <div className="premium-card text-center p-6">
            <div className="text-primary text-2xl mb-2">
              <EventsIcon size={24} className="mx-auto" />
            </div>
            <div className="text-2xl font-bold text-foreground">{customer.totalEvents}</div>
            <div className="text-sm text-muted-foreground">Events</div>
          </div>

          <div className="premium-card text-center p-6">
            <div className="text-primary text-2xl mb-2">
              <RevenueIcon size={24} className="mx-auto" />
            </div>
            <div className="text-2xl font-bold text-foreground">${Number(customer.totalRevenue).toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-border/20">
          {[
            { id: 'overview', label: 'Overview', icon: UserIcon },
            { id: 'identifiers', label: 'Identifiers', icon: CompanyIcon },
            { id: 'journey', label: 'Journey', icon: TargetIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/20 border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="premium-card p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Customer Overview</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-medium text-foreground mb-3">Personal Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <UserIcon size={16} className="text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Name</div>
                        <div className="text-foreground">{getDisplayName()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <EmailIcon size={16} className="text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="text-foreground">{customer.masterEmail || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PhoneIcon size={16} className="text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="text-foreground">{customer.masterPhone || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <LocationIcon size={16} className="text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Location</div>
                        <div className="text-foreground">
                          {getCountryFlag(customer.country)} {customer.city || 'Unknown'}, {customer.country || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="9"/>
                      </svg>
                      <div>
                        <div className="text-sm text-muted-foreground">Primary Click ID</div>
                        <div className="text-foreground font-mono text-sm">
                          {customer.identifiers?.find(id => id.type === 'CLICK_ID')?.value || 'Not available'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                <div>
                  <h4 className="text-md font-medium text-foreground mb-3">Verification Status</h4>
                  <div className="space-y-3">
                    {(() => {
                      // Get verification data from the latest lead's customFields
                      const latestLead = customer.leads?.[0];
                      const customFields = latestLead?.customFields as any || {};

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Email Verified</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customFields.emailVerified
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {customFields.emailVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">SMS Verified</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customFields.smsVerified
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {customFields.smsVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Age Verification</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customFields.ageVerification
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {customFields.ageVerification ? 'Confirmed' : 'Not Confirmed'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Promo Consent</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customFields.promoConsent
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {customFields.promoConsent ? 'Opted In' : 'Opted Out'}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div>
                <h4 className="text-md font-medium text-foreground mb-3">Technical Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const latestLead = customer.leads?.[0] || customer.clicks?.[0];
                    return (
                      <>
                        <div>
                          <div className="text-sm text-muted-foreground">IP Address</div>
                          <div className="text-foreground font-mono text-sm">{latestLead?.ip || 'Unknown'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Landing Page</div>
                          <div className="text-foreground text-sm truncate">{latestLead?.landingPage || 'Unknown'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">First Seen</div>
                          <div className="text-foreground text-sm">{new Date(customer.firstSeen).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Last Seen</div>
                          <div className="text-foreground text-sm">{new Date(customer.lastSeen).toLocaleDateString()}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'identifiers' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Customer Identifiers</h3>

              {customer.identifiers.length > 0 ? (
                <div className="space-y-3">
                  {customer.identifiers.map((identifier) => (
                    <div key={identifier.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          identifier.type === 'EMAIL' ? 'bg-blue-500/20 text-blue-400' :
                          identifier.type === 'PHONE' ? 'bg-green-500/20 text-green-400' :
                          identifier.type === 'CLICK_ID' ? 'bg-primary/20 text-primary' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {identifier.type === 'EMAIL' ? '📧' :
                           identifier.type === 'PHONE' ? '📱' :
                           identifier.type === 'CLICK_ID' ? '🔗' : '🆔'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{identifier.type}</div>
                          <div className="text-sm text-muted-foreground font-mono">{identifier.value}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {identifier.isPrimary && (
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">Primary</span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          identifier.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {identifier.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No identifiers found for this customer.
                </div>
              )}
            </div>
          )}

          {activeTab === 'journey' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Customer Journey Timeline</h3>

              {timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                           style={{
                             background: item.type === 'click' ? '#3b82f6' :
                                       item.type === 'lead' ? '#10b981' :
                                       '#8b5cf6'
                           }}>
                        {item.type === 'click' ? '👆' : item.type === 'lead' ? '📝' : '⚡'}
                      </div>
                      <div className="flex-1 min-w-0 p-4 bg-muted/20 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {item.date.toLocaleDateString()} {item.date.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        {item.clickId && (
                          <div className="mt-2 text-xs text-primary font-mono">Click ID: {item.clickId}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No journey events found for this customer.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}