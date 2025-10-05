'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, DollarSign, TrendingUp, Mail, Phone, Globe, Instagram, Youtube, Twitter, Target, Activity, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
  isActive: boolean;
  totalClicks: number;
  totalLeads: number;
  totalRegs: number;
  createdAt: string;
}

interface TopContent {
  landingPage: string;
  clicks: number;
  leads: number;
  conversionRate: number;
}

export default function InfluencerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const influencerId = params.id as string;

  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (influencerId) {
      fetchInfluencerData();
    }
  }, [influencerId]);

  const fetchInfluencerData = async () => {
    try {
      setLoading(true);

      // Fetch influencer details
      const influencerResponse = await fetch(`/api/influencers/${influencerId}`);
      const influencerData = await influencerResponse.json();

      if (influencerData.success) {
        setInfluencer({
          id: influencerData.influencer.id,
          name: influencerData.influencer.name,
          profileImage: influencerData.influencer.profileImage || null,
          email: influencerData.influencer.email,
          phone: influencerData.influencer.phone,
          socialHandle: influencerData.influencer.socialHandle,
          platform: influencerData.influencer.platform || 'Unknown',
          followers: influencerData.influencer.followers || 0,
          engagementRate: influencerData.influencer.engagementRate || 0,
          category: influencerData.influencer.category || 'Uncategorized',
          location: influencerData.influencer.location,
          status: influencerData.influencer.status,
          totalLeads: influencerData.influencer.totalLeads || 0,
          totalClicks: influencerData.influencer.totalClicks || 0,
          totalRegs: influencerData.influencer.totalRegs || 0,
          totalFtd: influencerData.influencer.totalFtd || 0,
          createdAt: influencerData.influencer.createdAt,
        });

        // Get campaigns associated with this influencer
        if (influencerData.influencer.campaigns) {
          setCampaigns(influencerData.influencer.campaigns);
        }

        // Calculate top performing content
        // This would come from analyzing clicks/leads by landing page
        // For now, using mock data structure
        setTopContent([]);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-400">Influencer not found</h3>
          <Link href="/dashboard/influencers" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/10">
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
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{influencer.totalClicks.toLocaleString()}</p>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Leads</p>
            <Users className="w-5 h-5 text-green-400" />
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
            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">{influencer.totalFtd.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {calculateConversionRate(influencer.totalFtd, influencer.totalRegs)}% of regs
          </p>
        </div>
      </div>

      {/* Contact & Social Info */}
      <div className="premium-card">
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
      <div className="premium-card">
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

      {/* Associated Campaigns */}
      <div className="premium-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Associated Campaigns ({campaigns.length})
          </h2>
          <Link
            href="/dashboard/campaigns"
            className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            View All Campaigns
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {campaigns.length === 0 ? (
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Campaign
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Clicks
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Leads
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Registrations
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-medium text-white">{campaign.name}</p>
                      <p className="text-sm text-gray-400">{campaign.slug}</p>
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
                        href={`/dashboard/campaigns?search=${campaign.slug}`}
                        className="text-sm text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Performing Content */}
      {topContent.length > 0 && (
        <div className="premium-card">
          <h2 className="text-xl font-semibold text-white mb-4">Top Performing Content</h2>
          <div className="space-y-3">
            {topContent.map((content, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium">{content.landingPage}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {content.clicks} clicks • {content.leads} leads • {content.conversionRate}% CR
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
