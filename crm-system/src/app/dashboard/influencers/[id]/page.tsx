'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, DollarSign, TrendingUp, Mail, Phone, Globe, Instagram, Youtube, Twitter, Target, Activity, ExternalLink, MousePointerClick, UserPlus, Zap } from 'lucide-react';
import Link from 'next/link';
import { getAvatarUrl, getInitials } from '@/lib/avatar';

interface Influencer {
  id: string;
  name: string;
  profileImage?: string | null;
  email: string | null;
  phone: string | null;
  socialHandle: string | null;
  platform: string;
  followers: number;
  engagementRate: number;
  category: string;
  location: string | null;
  status: 'active' | 'paused' | 'inactive';
  totalLeads: number;
  totalClicks: number;
  totalRegs: number;
  totalFtd: number;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  totalClicks: number;
  totalLeads: number;
  totalRegs: number;
  createdAt: string;
}

interface Customer {
  id: string;
  masterEmail: string | null;
  masterPhone: string | null;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
  _count: {
    clicks: number;
    leads: number;
    events: number;
  };
}

interface Click {
  id: string;
  clickId: string | null;
  campaign: string;
  source: string | null;
  medium: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
  customer: Customer | null;
}

interface Lead {
  id: string;
  campaign: string;
  source: string | null;
  value: number | null;
  qualityScore: number | null;
  createdAt: string;
  customer: Customer | null;
}

interface Event {
  id: string;
  eventType: string;
  eventName: string | null;
  campaign: string;
  value: number | null;
  createdAt: string;
  customer: Customer | null;
}

export default function InfluencerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const influencerId = params.id as string;

  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clicks' | 'leads' | 'conversions' | 'customers' | 'campaigns'>('overview');

  useEffect(() => {
    if (influencerId) {
      fetchInfluencerData();
    }
  }, [influencerId]);

  const fetchInfluencerData = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/influencers/${influencerId}`);
      const data = await response.json();

      if (data.success) {
        setInfluencer(data.influencer);
        setCampaigns(data.influencer.campaigns || []);
        setClicks(data.clicks || []);
        setLeads(data.leads || []);
        setEvents(data.events || []);
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch influencer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('instagram')) return <Instagram className="w-5 h-5" />;
    if (platformLower.includes('youtube')) return <Youtube className="w-5 h-5" />;
    if (platformLower.includes('twitter') || platformLower.includes('x')) return <Twitter className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculateConversionRate = (conversions: number, total: number) => {
    if (total === 0) return 0;
    return ((conversions / total) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-400">Influencer not found</h3>
          <Link href="/dashboard/influencers" className="text-primary hover:text-primary/80 mt-4 inline-block">
            ← Back to Influencers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/influencers')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex items-center gap-4">
            {influencer.profileImage ? (
              <img
                src={influencer.profileImage}
                alt={influencer.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-white/10"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/10">
                {influencer.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white">{influencer.name}</h1>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(influencer.status)}`} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                {getPlatformIcon(influencer.platform)}
                <p className="text-gray-400">{influencer.socialHandle || 'No handle'}</p>
                <span className="text-gray-600">•</span>
                <p className="text-gray-400 capitalize">{influencer.category}</p>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/influencers"
          className="premium-button flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          All Influencers
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Clicks</p>
            <MousePointerClick className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{influencer.totalClicks.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {clicks.length} in last 100
          </p>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Leads</p>
            <UserPlus className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{influencer.totalLeads.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {calculateConversionRate(influencer.totalLeads, influencer.totalClicks)}% conversion
          </p>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Registrations</p>
            <TrendingUp className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">{influencer.totalRegs.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {calculateConversionRate(influencer.totalRegs, influencer.totalLeads)}% of leads
          </p>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">FTDs</p>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-white">{influencer.totalFtd.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {calculateConversionRate(influencer.totalFtd, influencer.totalRegs)}% of regs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card">
        <div className="border-b border-white/10 mb-6">
          <div className="flex gap-4 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'clicks', label: `Clicks (${clicks.length})`, icon: MousePointerClick },
              { id: 'leads', label: `Leads (${leads.length})`, icon: UserPlus },
              { id: 'conversions', label: `Conversions (${events.length})`, icon: Zap },
              { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
              { id: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: Target }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Contact & Social Info */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <p className="text-white font-medium">{influencer.email || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <p className="text-white font-medium">{influencer.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Location</p>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <p className="text-white font-medium">{influencer.location || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Stats */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Social Media Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Platform</p>
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(influencer.platform)}
                    <p className="text-white font-medium capitalize">{influencer.platform}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Followers</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <p className="text-white font-medium">{influencer.followers.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Engagement Rate</p>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <p className="text-white font-medium">{influencer.engagementRate}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clicks Tab */}
        {activeTab === 'clicks' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Click ID</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Campaign</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Location</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Device</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Source</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clicks.map((click) => (
                  <tr key={click.id} className="hover:bg-white/5">
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
                        {click.customer?.id ? (
                          <img
                            src={getAvatarUrl(click.customer.id)}
                            alt={click.customer.firstName || 'User'}
                            className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/80 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            ?
                          </div>
                        )}
                        <div className="text-sm">
                          <div className="text-white font-medium">
                            {click.customer ? `${click.customer.firstName || ''} ${click.customer.lastName || ''}`.trim() || 'Anonymous' : 'Anonymous'}
                          </div>
                          <div className="text-xs text-gray-400">{click.customer?.masterEmail || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-white">{click.campaign}</td>
                    <td className="p-3 text-sm text-gray-400">{click.city ? `${click.city}, ${click.country}` : click.country || '-'}</td>
                    <td className="p-3 text-sm text-gray-400">{click.device || '-'} / {click.os || '-'}</td>
                    <td className="p-3 text-sm text-gray-400">{click.source || '-'} / {click.medium || '-'}</td>
                    <td className="p-3 text-sm text-gray-400">{new Date(click.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      {click.customer?.id && (
                        <Link
                          href={`/dashboard/customers/${click.customer.id}`}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-primary text-black hover:bg-primary/90 transition-colors inline-block"
                        >
                          VIEW
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clicks.length === 0 && (
              <div className="text-center py-12 text-gray-400">No clicks found</div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Campaign</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Source</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Value</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Quality</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/5">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {lead.customer?.id ? (
                          <img
                            src={getAvatarUrl(lead.customer.id)}
                            alt={lead.customer.firstName || 'User'}
                            className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/80 to-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            ?
                          </div>
                        )}
                        <div className="text-sm">
                          <div className="text-white font-medium">
                            {lead.customer ? `${lead.customer.firstName || ''} ${lead.customer.lastName || ''}`.trim() || 'Anonymous' : 'Anonymous'}
                          </div>
                          <div className="text-xs text-gray-400">{lead.customer?.masterEmail || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-white">{lead.campaign}</td>
                    <td className="p-3 text-sm text-gray-400">{lead.source || '-'}</td>
                    <td className="p-3 text-sm text-white">${lead.value ? Number(lead.value).toFixed(2) : '0.00'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        (lead.qualityScore || 0) >= 80 ? 'bg-green-500/20 text-green-400' :
                        (lead.qualityScore || 0) >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {lead.qualityScore || 0}/100
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      {lead.customer?.id && (
                        <Link
                          href={`/dashboard/customers/${lead.customer.id}`}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-primary text-black hover:bg-primary/90 transition-colors inline-block"
                        >
                          VIEW
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && (
              <div className="text-center py-12 text-gray-400">No leads found</div>
            )}
          </div>
        )}

        {/* Conversions Tab */}
        {activeTab === 'conversions' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Event Type</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Event Name</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Campaign</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Value</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-white/5">
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                        {event.eventType}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-white">{event.eventName || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {event.customer?.id ? (
                          <img
                            src={getAvatarUrl(event.customer.id)}
                            alt={event.customer.firstName || 'User'}
                            className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/80 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            ?
                          </div>
                        )}
                        <div className="text-sm">
                          <div className="text-white font-medium">
                            {event.customer ? `${event.customer.firstName || ''} ${event.customer.lastName || ''}`.trim() || 'Anonymous' : 'Anonymous'}
                          </div>
                          <div className="text-xs text-gray-400">{event.customer?.masterEmail || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-white">{event.campaign}</td>
                    <td className="p-3 text-sm text-white">${event.value ? Number(event.value).toFixed(2) : '0.00'}</td>
                    <td className="p-3 text-sm text-gray-400">{new Date(event.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      {event.customer?.id && (
                        <Link
                          href={`/dashboard/customers/${event.customer.id}`}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-primary text-black hover:bg-primary/90 transition-colors inline-block"
                        >
                          VIEW
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="text-center py-12 text-gray-400">No conversions found</div>
            )}
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/dashboard/customers/${customer.id}`}
                className="group relative"
              >
                {/* Card with glassmorphism effect */}
                <div
                  className="relative overflow-hidden rounded-2xl transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div className="relative p-5">
                    {/* Header with avatar and name */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div className="relative">
                        <img
                          src={getAvatarUrl(customer.id)}
                          alt={customer.firstName || 'User'}
                          className="w-14 h-14 rounded-full ring-2 ring-white/10 transition-all duration-300"
                        />
                      </div>

                      {/* Name and contact */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white truncate group-hover:text-primary transition-colors duration-300">
                          {`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-gray-400 truncate mt-0.5">
                          {customer.masterEmail || customer.masterPhone || 'No contact'}
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors duration-300 flex-shrink-0 mt-1" />
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                        style={{
                          background: 'rgba(253, 198, 0, 0.08)',
                          border: '1px solid rgba(253, 198, 0, 0.15)',
                        }}
                      >
                        <MousePointerClick className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-primary">{customer._count.clicks}</span>
                      </div>

                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                        style={{
                          background: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.15)',
                        }}
                      >
                        <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-blue-400">{customer._count.leads}</span>
                      </div>

                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                        style={{
                          background: 'rgba(168, 85, 247, 0.08)',
                          border: '1px solid rgba(168, 85, 247, 0.15)',
                        }}
                      >
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-medium text-purple-400">{customer._count.events}</span>
                      </div>
                    </div>

                    {/* Location */}
                    {(customer.city || customer.country) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Globe className="w-3.5 h-3.5" />
                        <span>
                          {customer.city && customer.country
                            ? `${customer.city}, ${customer.country}`
                            : customer.country || customer.city || 'Location unknown'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {customers.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">No customers found</div>
            )}
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Clicks</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Leads</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Registrations</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {campaign.logoUrl ? (
                            <img
                              src={campaign.logoUrl}
                              alt={`${campaign.name} logo`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Target className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{campaign.name}</p>
                          <p className="text-sm text-gray-400">{campaign.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          campaign.isActive
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}
                      >
                        {campaign.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-white">
                        {campaign.totalClicks?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-white">
                        {campaign.totalLeads?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-white">
                        {campaign.totalRegs?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}`}
                        className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No campaigns yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  This influencer hasn't been assigned to any campaigns
                </p>
                <Link
                  href="/dashboard/campaigns"
                  className="premium-button inline-flex items-center gap-2"
                >
                  Go to Campaigns
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
