'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { BackArrowIcon, TargetIcon } from '@/components/ui/icons'
import { Avatar } from '@/components/ui/avatar'

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

interface Campaign {
  id: string
  name: string
  slug: string
  description: string | null
  clientId: string | null
  brandId: string | null
  logoUrl?: string | null
  influencerId?: string | null
  status: string
  registrations: number | null
  ftd: number | null
  approvedRegistrations: number | null
  qualifiedDeposits: number | null
  createdAt: string
  updatedAt: string
  stats: CampaignStats
}

interface Customer {
  id: string
  masterEmail: string | null
  masterPhone: string | null
  firstName: string | null
  lastName: string | null
  country: string | null
  city: string | null
  createdAt?: string
  _count?: {
    clicks: number
    leads: number
    events: number
  }
}

interface Click {
  id: string
  clickId: string | null
  ip: string
  country: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  source: string | null
  medium: string | null
  createdAt: string
  customer?: Customer
}

interface Lead {
  id: string
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  campaign: string | null
  source: string | null
  medium: string | null
  country: string | null
  city: string | null
  qualityScore: number | null
  isDuplicate: boolean
  value: number | null
  createdAt: string
  customer?: Customer
}

interface Event {
  id: string
  eventType: string
  eventName: string | null
  value: number | null
  currency: string | null
  isRevenue: boolean
  isConverted: boolean
  createdAt: string
  customer?: Customer
}

interface Influencer {
  id: string
  name: string
  email: string | null
  socialHandle: string | null
  platform: string | null
  profileImage: string | null
  clicks: number
  leads: number
  conversions: number
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'clicks' | 'leads' | 'conversions' | 'customers' | 'influencers'>('overview')

  const [clicks, setClicks] = useState<Click[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails()
      fetchDetailedData()
    }
  }, [campaignId])

  const fetchCampaignDetails = async () => {
    try {
      console.log('🔍 Fetching campaign details for ID:', campaignId)
      const response = await fetch(`/api/campaigns/${campaignId}`)
      const data = await response.json()

      if (data.success) {
        console.log('✅ Campaign data loaded:', data.campaign)
        setCampaign(data.campaign)
      } else {
        console.log('❌ Failed to load campaign:', data.error)
        setError(data.error || 'Failed to load campaign details')
      }
    } catch (err) {
      console.error('🚨 Fetch error:', err)
      setError('Failed to fetch campaign details')
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailedData = async () => {
    try {
      setDetailsLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/details`)
      const data = await response.json()

      if (data.success) {
        setClicks(data.clicks)
        setLeads(data.leads)
        setEvents(data.events)
        setCustomers(data.customers)
        setInfluencers(data.influencers)
      }
    } catch (err) {
      console.error('Failed to fetch detailed data:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', class: 'bg-green-500/20 text-green-400 border-green-500/30' }
      case 'paused':
        return { label: 'Paused', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
      case 'inactive':
        return { label: 'Inactive', class: 'bg-red-500/20 text-red-400 border-red-500/30' }
      default:
        return { label: status, class: 'bg-white/20 text-white border-white/30' }
    }
  }

  const getCustomerName = (customer: Customer | undefined) => {
    if (!customer) return 'Unknown'
    const firstName = customer.firstName?.trim()
    const lastName = customer.lastName?.trim()
    if (firstName && lastName) return `${firstName} ${lastName}`
    if (firstName) return firstName
    if (lastName) return lastName
    return customer.masterEmail || customer.masterPhone || 'Unknown'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-muted/20 rounded-lg"></div>
            <div className="w-12 h-12 bg-muted/20 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted/20 rounded"></div>
              <div className="h-4 w-32 bg-muted/20 rounded"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 h-24"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-foreground mb-2">Campaign Not Found</div>
          <div className="text-muted-foreground mb-4">{error || 'The requested campaign could not be found.'}</div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 mx-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
              border: '1px solid rgba(253, 198, 0, 0.3)',
              color: '#0a0a0a'
            }}
          >
            <BackArrowIcon size={16} />
            <span>Back to Campaigns</span>
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(campaign.status)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center overflow-hidden">
                {campaign.logoUrl ? (
                  <img src={campaign.logoUrl} alt={campaign.name} className="w-full h-full object-cover" />
                ) : (
                  <TargetIcon size={32} className="text-black" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-muted-foreground font-mono">{campaign.slug}</span>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full border ${statusConfig.class}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-sm font-medium text-foreground">{new Date(campaign.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {campaign.description && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-muted-foreground">{campaign.description}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="mx-6 space-y-6">
        {/* Performance Stats */}
        <div className="premium-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Performance Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-foreground">{campaign.stats.totalClicks.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Clicks</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-foreground">{campaign.stats.totalLeads.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Leads</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-foreground">{campaign.stats.totalEvents.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Events</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-foreground">{customers.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Customers</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-foreground">{influencers.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Influencers</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="premium-card p-6">
          <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'clicks', label: `Clicks (${clicks.length})` },
              { id: 'leads', label: `Leads (${leads.length})` },
              { id: 'conversions', label: `Conversions (${events.length})` },
              { id: 'customers', label: `Customers (${customers.length})` },
              { id: 'influencers', label: `Influencers (${influencers.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {detailsLoading && activeTab !== 'overview' ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading data...</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Conversion Metrics */}
                  {(campaign.registrations !== null || campaign.ftd !== null || campaign.approvedRegistrations !== null || campaign.qualifiedDeposits !== null) && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Conversion Metrics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {campaign.registrations !== null && (
                          <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-2xl font-bold text-primary">{campaign.registrations.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Registrations</div>
                          </div>
                        )}
                        {campaign.approvedRegistrations !== null && (
                          <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-2xl font-bold text-green-400">{campaign.approvedRegistrations.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Approved Regs</div>
                          </div>
                        )}
                        {campaign.ftd !== null && (
                          <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-2xl font-bold text-blue-400">{campaign.ftd.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">FTD</div>
                          </div>
                        )}
                        {campaign.qualifiedDeposits !== null && (
                          <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-2xl font-bold text-purple-400">{campaign.qualifiedDeposits.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Qualified Deposits</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quality Metrics */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Quality & Revenue</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Conversion Rate</div>
                        <div className="text-xl font-bold text-foreground mt-2">{campaign.stats.conversionRate.toFixed(2)}%</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Quality Score</div>
                        <div className="text-xl font-bold text-foreground mt-2">{campaign.stats.avgQualityScore.toFixed(1)}</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Revenue</div>
                        <div className="text-xl font-bold text-green-400 mt-2">${campaign.stats.totalRevenue.toLocaleString()}</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Fraud Rate</div>
                        <div className="text-xl font-bold text-red-400 mt-2">{campaign.stats.fraudRate.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Clicks Tab */}
              {activeTab === 'clicks' && (
                <div className="space-y-4">
                  {clicks.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Click ID</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Location</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Device</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Source</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
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
                                {click.customer ? (
                                  <Link href={`/dashboard/customers/${click.customer.id}`} className="flex items-center gap-2 hover:text-primary">
                                    <Avatar firstName={click.customer.firstName} lastName={click.customer.lastName} email={click.customer.masterEmail} userId={click.customer.id} size="sm" />
                                    <span className="text-sm">{getCustomerName(click.customer)}</span>
                                  </Link>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Anonymous</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">{click.city ? `${click.city}, ${click.country}` : click.country || '-'}</td>
                              <td className="p-3 text-sm">{click.device || '-'}</td>
                              <td className="p-3 text-sm">{click.source || '-'}</td>
                              <td className="p-3 text-sm text-muted-foreground">{new Date(click.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No clicks recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Leads Tab */}
              {activeTab === 'leads' && (
                <div className="space-y-4">
                  {leads.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Contact</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Location</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Quality</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Value</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((lead) => (
                            <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="p-3">
                                {lead.customer ? (
                                  <Link href={`/dashboard/customers/${lead.customer.id}`} className="flex items-center gap-2 hover:text-primary">
                                    <Avatar firstName={lead.customer.firstName} lastName={lead.customer.lastName} email={lead.customer.masterEmail} userId={lead.customer.id} size="sm" />
                                    <span className="text-sm">{getCustomerName(lead.customer)}</span>
                                  </Link>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">{lead.email || lead.phone || '-'}</td>
                              <td className="p-3 text-sm">{lead.city ? `${lead.city}, ${lead.country}` : lead.country || '-'}</td>
                              <td className="p-3">
                                {lead.qualityScore !== null ? (
                                  <span className={`text-sm px-2 py-1 rounded ${lead.qualityScore >= 80 ? 'bg-green-500/20 text-green-400' : lead.qualityScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {lead.qualityScore}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="p-3 text-sm">{lead.value ? `$${lead.value}` : '-'}</td>
                              <td className="p-3 text-sm text-muted-foreground">{new Date(lead.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No leads recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Conversions Tab */}
              {activeTab === 'conversions' && (
                <div className="space-y-4">
                  {events.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Event Type</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Event Name</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Value</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((event) => (
                            <tr key={event.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="p-3">
                                {event.customer ? (
                                  <Link href={`/dashboard/customers/${event.customer.id}`} className="flex items-center gap-2 hover:text-primary">
                                    <Avatar firstName={event.customer.firstName} lastName={event.customer.lastName} email={event.customer.masterEmail} userId={event.customer.id} size="sm" />
                                    <span className="text-sm">{getCustomerName(event.customer)}</span>
                                  </Link>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`text-sm px-2 py-1 rounded ${event.isRevenue ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {event.eventType}
                                </span>
                              </td>
                              <td className="p-3 text-sm">{event.eventName || '-'}</td>
                              <td className="p-3 text-sm">{event.value ? `$${event.value}` : '-'}</td>
                              <td className="p-3 text-sm text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No conversions recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Customers Tab */}
              {activeTab === 'customers' && (
                <div className="space-y-4">
                  {customers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customers.map((customer) => (
                        <Link key={customer.id} href={`/dashboard/customers/${customer.id}`} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar firstName={customer.firstName} lastName={customer.lastName} email={customer.masterEmail} userId={customer.id} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">{getCustomerName(customer)}</div>
                              <div className="text-xs text-muted-foreground truncate">{customer.masterEmail || customer.masterPhone}</div>
                            </div>
                          </div>
                          {customer._count && (
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <div className="text-lg font-bold text-foreground">{customer._count.clicks}</div>
                                <div className="text-xs text-muted-foreground">Clicks</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-foreground">{customer._count.leads}</div>
                                <div className="text-xs text-muted-foreground">Leads</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-foreground">{customer._count.events}</div>
                                <div className="text-xs text-muted-foreground">Events</div>
                              </div>
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No customers found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Influencers Tab */}
              {activeTab === 'influencers' && (
                <div className="space-y-4">
                  {influencers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {influencers.map((influencer) => (
                        <div key={influencer.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar firstName={influencer.name} email={influencer.email} userId={influencer.id} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">{influencer.name}</div>
                              {influencer.socialHandle && (
                                <div className="text-xs text-muted-foreground truncate">@{influencer.socialHandle}</div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="text-lg font-bold text-foreground">{influencer.clicks}</div>
                              <div className="text-xs text-muted-foreground">Clicks</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-foreground">{influencer.leads}</div>
                              <div className="text-xs text-muted-foreground">Leads</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-primary">{influencer.conversions}</div>
                              <div className="text-xs text-muted-foreground">Conversions</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No influencers associated with this campaign</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
