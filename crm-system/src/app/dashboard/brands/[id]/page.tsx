'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Mail, MessageSquare, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';

interface Operator {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  logoUrl?: string;
  status: string;
  primaryColor?: string;
  emailDomain?: string;
  smsProvider?: string;
}

interface Customer {
  id: string;
  masterEmail: string | null;
  masterPhone: string | null;
  firstName: string | null;
  lastName: string | null;
  journeyState?: {
    stage: number;
    depositCount: number;
    totalDepositValue: string;
    currentJourney: string | null;
    emailCount: number;
    smsCount: number;
    lastEmailAt: string | null;
    lastSmsAt: string | null;
  };
}

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const operatorId = params.id as string;

  const [operator, setOperator] = useState<Operator | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<number | 'all'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (operatorId) {
      fetchOperator();
      fetchCustomers();
    }
  }, [operatorId, stageFilter]);

  const fetchOperator = async () => {
    try {
      const response = await fetch(`/api/operators/${operatorId}`);
      const data = await response.json();
      setOperator(data.operator);
    } catch (error) {
      console.error('Failed to fetch operator:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const stageParam = stageFilter === 'all' ? 'all' : stageFilter.toString();
      const response = await fetch(`/api/operators/${operatorId}/customers?stage=${stageParam}`);
      const data = await response.json();

      if (data.success) {
        setCustomers(data.customers);
        console.log('✅ Loaded customers:', data.customers.length);
      } else {
        console.error('Failed to fetch customers:', data.error);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const getStageLabel = (stage: number) => {
    switch (stage) {
      case -1:
        return 'Not Registered';
      case 0:
        return 'Registered';
      case 1:
        return '1st Deposit';
      case 2:
        return '2nd Deposit';
      default:
        return 'High Value';
    }
  };

  const getStageColor = (stage: number) => {
    switch (stage) {
      case -1:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 0:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 1:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 2:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-400">Brand not found</h3>
          <Link href="/dashboard/brands" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
            ← Back to Brands
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
            onClick={() => router.push('/dashboard/brands')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex items-center gap-3">
            {operator.logoUrl ? (
              <img
                src={operator.logoUrl}
                alt={operator.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                style={{
                  backgroundColor: operator.primaryColor || '#8B5CF6',
                }}
              >
                {operator.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">{operator.name}</h1>
              <p className="text-gray-400 mt-1">{operator.brand || operator.slug}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/journey-automation"
            className="premium-button flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Journey Automation
          </Link>
          <button
            onClick={fetchCustomers}
            className="premium-button flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Brand Config */}
      <div className="premium-card">
        <h2 className="text-lg font-semibold text-white mb-4">Brand Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400">Email Domain</p>
            <p className="text-white font-medium mt-1">{operator.emailDomain || 'Not configured'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">SMS Provider</p>
            <p className="text-white font-medium mt-1 capitalize">
              {operator.smsProvider || 'laaffic'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mt-1 ${
                operator.status === 'ACTIVE'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : operator.status === 'PAUSED'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}
            >
              {operator.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stage Filter */}
      <div className="premium-card">
        <h2 className="text-lg font-semibold text-white mb-4">Filter by Stage</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStageFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              stageFilter === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {[-1, 0, 1, 2, 3].map((stage) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                stageFilter === stage
                  ? getStageColor(stage)
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border-white/10'
              }`}
            >
              {getStageLabel(stage)}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="premium-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Customers {stageFilter !== 'all' && `- ${getStageLabel(stageFilter as number)}`}
          </h2>
          <div className="text-sm text-gray-400">
            {customers.length} customer{customers.length !== 1 ? 's' : ''}
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No customers yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Customers will appear here when they interact with this brand's campaigns
            </p>
            <Link
              href="/dashboard/journey-automation"
              className="premium-button inline-flex items-center gap-2"
            >
              Set up Journeys
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Stage
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Journey
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Deposits
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Value
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Messages
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <Link href={`/dashboard/customers/${customer.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar
                          firstName={customer.firstName}
                          lastName={customer.lastName}
                          email={customer.masterEmail}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-white">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-sm text-gray-400">
                            {customer.masterEmail || customer.masterPhone}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      {customer.journeyState && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStageColor(
                            customer.journeyState.stage
                          )}`}
                        >
                          {getStageLabel(customer.journeyState.stage)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-300 capitalize">
                        {customer.journeyState?.currentJourney || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-white">
                        {customer.journeyState?.depositCount || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-white">
                        ${parseFloat(customer.journeyState?.totalDepositValue || '0').toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-white">
                            {customer.journeyState?.emailCount || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-white">
                            {customer.journeyState?.smsCount || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="premium-card max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1a2e] z-10">
              <div className="flex items-center gap-4">
                <Avatar
                  firstName={selectedCustomer.firstName}
                  lastName={selectedCustomer.lastName}
                  email={selectedCustomer.masterEmail}
                  size="lg"
                />
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {selectedCustomer.masterEmail || selectedCustomer.masterPhone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Journey Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Journey Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Current Stage</p>
                    {selectedCustomer.journeyState && (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStageColor(
                          selectedCustomer.journeyState.stage
                        )}`}
                      >
                        {getStageLabel(selectedCustomer.journeyState.stage)}
                      </span>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Active Journey</p>
                    <p className="text-white font-medium capitalize">
                      {selectedCustomer.journeyState?.currentJourney || 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deposit Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Deposit Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <p className="text-sm text-gray-400">Total Deposits</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {selectedCustomer.journeyState?.depositCount || 0}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <p className="text-sm text-gray-400">Total Value</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      ${parseFloat(selectedCustomer.journeyState?.totalDepositValue || '0').toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <p className="text-sm text-gray-400">Avg. Deposit</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      ${selectedCustomer.journeyState?.depositCount
                        ? (parseFloat(selectedCustomer.journeyState.totalDepositValue) / selectedCustomer.journeyState.depositCount).toFixed(2)
                        : '0.00'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Communication Stats */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Communication History</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-400" />
                        <p className="text-sm text-gray-400">Email Messages</p>
                      </div>
                      <span className="text-2xl font-bold text-white">
                        {selectedCustomer.journeyState?.emailCount || 0}
                      </span>
                    </div>
                    {selectedCustomer.journeyState?.lastEmailAt && (
                      <p className="text-xs text-gray-500">
                        Last sent: {new Date(selectedCustomer.journeyState.lastEmailAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-400" />
                        <p className="text-sm text-gray-400">SMS Messages</p>
                      </div>
                      <span className="text-2xl font-bold text-white">
                        {selectedCustomer.journeyState?.smsCount || 0}
                      </span>
                    </div>
                    {selectedCustomer.journeyState?.lastSmsAt && (
                      <p className="text-xs text-gray-500">
                        Last sent: {new Date(selectedCustomer.journeyState.lastSmsAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Customer Information</h3>
                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer ID</span>
                    <span className="text-white font-mono text-sm">{selectedCustomer.id}</span>
                  </div>
                  {selectedCustomer.masterEmail && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email</span>
                      <span className="text-white">{selectedCustomer.masterEmail}</span>
                    </div>
                  )}
                  {selectedCustomer.masterPhone && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone</span>
                      <span className="text-white">{selectedCustomer.masterPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Link
                  href={`/dashboard/customers/${selectedCustomer.id}`}
                  className="flex-1 premium-button text-center"
                >
                  View Full Profile
                </Link>
                <Link
                  href="/dashboard/journey-automation"
                  className="flex-1 premium-button text-center"
                >
                  Manage Journey
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
