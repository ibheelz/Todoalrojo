'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Database, Play, Trash2, CheckCircle, Users, Mail, MessageSquare,
  Building2, Target, TrendingUp, DollarSign, RefreshCw, Send, Zap,
  FileText, Activity, ExternalLink, Layers, Settings, Eye
} from 'lucide-react';

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSeedData = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/seed-mock-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessMessages = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/cron/process-messages', {
        method: 'POST'
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestPostback = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Get a random customer first
      const customersRes = await fetch('/api/customers?limit=1');
      const customersData = await customersRes.json();

      if (!customersData.customers || customersData.customers.length === 0) {
        setResult({ success: false, error: 'No customers found. Please seed data first.' });
        return;
      }

      const customer = customersData.customers[0];

      // Send test postback
      const response = await fetch('/api/postback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clickId: 'test_click_' + Date.now(),
          email: customer.masterEmail,
          phone: customer.masterPhone,
          operatorId: 'roobet',
          eventType: 'deposit',
          depositAmount: 100,
          currency: 'USD'
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    {
      title: 'Brands',
      description: 'Multi-operator management',
      href: '/dashboard/brands',
      icon: Building2,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      features: ['View all brands', 'Brand-specific customers', 'Journey isolation']
    },
    {
      title: 'Campaigns',
      description: 'Campaign performance tracking',
      href: '/dashboard/campaigns',
      icon: Target,
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      features: ['Click tracking', 'Lead conversion', 'Revenue attribution']
    },
    {
      title: 'Influencers',
      description: 'Influencer partnership management',
      href: '/dashboard/influencers',
      icon: Users,
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      features: ['Performance stats', 'Campaign assignments', 'Commission tracking']
    },
    {
      title: 'Customers',
      description: 'Customer profiles & journey',
      href: '/dashboard/customers',
      icon: Users,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      features: ['Identity graph', 'Journey timeline', 'Activity history']
    },
    {
      title: 'Journey Automation',
      description: 'Email & SMS campaigns',
      href: '/dashboard/journey-automation',
      icon: Zap,
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      features: ['Acquisition journeys', 'Retention campaigns', 'Message scheduling']
    },
    {
      title: 'Message Templates',
      description: 'Customize messages per brand',
      href: '/dashboard/message-templates',
      icon: FileText,
      color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      features: ['Edit content', 'Personalization', 'A/B testing']
    }
  ];

  const apiEndpoints = [
    {
      method: 'POST',
      path: '/api/seed-mock-data',
      description: 'Seed database with realistic mock data',
      action: handleSeedData
    },
    {
      method: 'POST',
      path: '/api/cron/process-messages',
      description: 'Process pending messages (mock sending)',
      action: handleProcessMessages
    },
    {
      method: 'POST',
      path: '/api/postback',
      description: 'Test operator postback webhook',
      action: handleTestPostback
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">🎮 CRM Demo & Testing</h1>
        <p className="text-gray-400">
          Comprehensive demonstration of all CRM features and functionality
        </p>
      </div>

      {/* Quick Actions */}
      <div className="premium-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-purple-500/10">
            <Play className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
            <p className="text-sm text-gray-400">Test all functionality with one click</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {apiEndpoints.map((endpoint, index) => (
            <button
              key={index}
              onClick={endpoint.action}
              disabled={loading}
              className="premium-card hover:scale-105 transition-transform text-left p-4 border-2 border-white/10 hover:border-purple-500/50"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {endpoint.method}
                </span>
                <Send className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm font-mono text-purple-400 mb-2">{endpoint.path}</p>
              <p className="text-xs text-gray-400">{endpoint.description}</p>
            </button>
          ))}
        </div>

        {/* Result Display */}
        {loading && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
              <p className="text-blue-400 font-medium">Processing request...</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className={`border rounded-lg p-4 ${
            result.success
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-start gap-3 mb-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <p className={`font-bold mb-2 ${
                  result.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.success ? 'Success!' : 'Error'}
                </p>
                <p className="text-sm text-gray-300 mb-2">{result.message || result.error}</p>
                {result.data && (
                  <div className="text-xs font-mono text-gray-400 mt-2">
                    {JSON.stringify(result.data, null, 2)}
                  </div>
                )}
                {result.results && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded p-2">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-lg font-bold text-white">{result.results.total}</p>
                    </div>
                    <div className="bg-green-500/10 rounded p-2">
                      <p className="text-xs text-gray-400">Sent</p>
                      <p className="text-lg font-bold text-green-400">{result.results.sent}</p>
                    </div>
                    <div className="bg-red-500/10 rounded p-2">
                      <p className="text-xs text-gray-400">Failed</p>
                      <p className="text-lg font-bold text-red-400">{result.results.failed}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Grid */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Layers className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Explore Features</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="premium-card hover:scale-105 transition-all group border-2 border-white/10 hover:border-purple-500/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${link.color}`}>
                  <link.icon className="w-6 h-6" />
                </div>
                <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{link.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{link.description}</p>

              <div className="space-y-1.5">
                {link.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <p className="text-xs text-gray-500">{feature}</p>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Architecture */}
      <div className="premium-card">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">System Architecture</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Data Flow</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-400">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Click Tracking</p>
                  <p className="text-xs text-gray-400">User clicks campaign link → Click recorded → Customer created/updated</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-green-400">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Lead Capture</p>
                  <p className="text-xs text-gray-400">User submits form → Lead created → Identity graph updated</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-purple-400">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Journey Automation</p>
                  <p className="text-xs text-gray-400">Journey state created → Messages scheduled → Templates applied</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-orange-400">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Postback Processing</p>
                  <p className="text-xs text-gray-400">Operator sends deposit → Journey state updated → Retention begins</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Key Features</h3>
            <div className="space-y-2">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm font-medium text-white mb-1">🔗 Identity Graph</p>
                <p className="text-xs text-gray-400">Unified customer profiles across email, phone, device, click IDs</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm font-medium text-white mb-1">🏢 Multi-Operator</p>
                <p className="text-xs text-gray-400">Isolated journeys per brand with automatic segmentation</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm font-medium text-white mb-1">📧 Message Templates</p>
                <p className="text-xs text-gray-400">Customizable content per brand, journey, stage, and channel</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm font-medium text-white mb-1">🎯 Attribution</p>
                <p className="text-xs text-gray-400">Full click-to-conversion tracking with influencer revenue sharing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testing Workflow */}
      <div className="premium-card">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Testing Workflow</h2>
        </div>

        <div className="bg-white/5 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white mb-1">Step 1: Seed Mock Data</h4>
                <p className="text-sm text-gray-400 mb-2">
                  Click "Seed database with realistic mock data" to populate:
                </p>
                <ul className="text-xs text-gray-500 space-y-1 ml-4">
                  <li>• 3 Operators (Roobet, Rushbet, Stake)</li>
                  <li>• 5 Influencers with realistic stats</li>
                  <li>• 5 Campaigns with conversion data</li>
                  <li>• 50 Customers with full activity history</li>
                  <li>• Journey states, messages, and templates</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">Step 2: Explore the Data</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Navigate through the pages to see how everything connects:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/dashboard/brands" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      View Brands
                    </Link>
                    <Link href="/dashboard/campaigns" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      View Campaigns
                    </Link>
                    <Link href="/dashboard/influencers" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      View Influencers
                    </Link>
                    <Link href="/dashboard/customers" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      View Customers
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">Step 3: Test Message Processing</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Click "Process pending messages" to simulate sending:
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1 ml-4">
                    <li>• Finds all PENDING messages scheduled for now</li>
                    <li>• Personalizes content with customer data</li>
                    <li>• Simulates email/SMS sending (95% success rate)</li>
                    <li>• Updates journey state counters</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">Step 4: Test Postback</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Click "Test operator postback webhook" to simulate:
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1 ml-4">
                    <li>• Deposit notification from operator</li>
                    <li>• Journey state advancement (stage 0 → 1)</li>
                    <li>• Automatic transition to retention journey</li>
                    <li>• Revenue tracking and event creation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
      <path strokeWidth="2" strokeLinecap="round" d="M15 9l-6 6M9 9l6 6"/>
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
    </svg>
  );
}
