'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Users, Target, Settings } from 'lucide-react';

interface Operator {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  emailDomain?: string;
  emailFromAddress?: string;
  status: string;
  totalLeads: number;
  totalRegistrations: number;
  totalFTD: number;
  totalRevenue: string;
  regRate?: string;
  ftdRate?: string;
  createdAt: string;
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await fetch('/api/operators');
      const data = await response.json();
      setOperators(data.operators || []);
    } catch (error) {
      console.error('Failed to fetch operators:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter operators based on search query
  const filteredOperators = operators.filter((operator) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      operator.name.toLowerCase().includes(query) ||
      operator.slug.toLowerCase().includes(query) ||
      operator.brand?.toLowerCase().includes(query) ||
      operator.emailDomain?.toLowerCase().includes(query) ||
      operator.status.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PAUSED':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'INACTIVE':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'TESTING':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Operator Management</h1>
          <p className="text-gray-400 mt-1">
            Manage multi-operator segmentation and recycling
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="premium-button flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Operator
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center space-x-3 flex-1 max-w-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="Search operators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Operators</p>
              <p className="text-2xl font-bold text-white mt-1">{operators.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Operators</p>
              <p className="text-2xl font-bold text-white mt-1">
                {operators.filter((op) => op.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Leads</p>
              <p className="text-2xl font-bold text-white mt-1">
                {operators.reduce((sum, op) => sum + op.totalLeads, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

      </div>

      {/* Operators Table */}
      <div className="premium-card">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">All Operators</h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage operator configurations and view performance metrics
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : operators.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No operators yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first operator to start managing campaigns
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="premium-button inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Operator
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Operator
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Email Domain
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Leads
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Reg %
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    FTD %
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredOperators.map((operator) => (
                  <tr
                    key={operator.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-white">{operator.name}</p>
                        <p className="text-sm text-gray-400">{operator.brand || operator.slug}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          operator.status
                        )}`}
                      >
                        {operator.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-300">
                        {operator.emailDomain || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-white">
                        {operator.totalLeads.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-white">
                        {operator.regRate ? `${(parseFloat(operator.regRate) * 100).toFixed(1)}%` : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-white">
                        {operator.ftdRate ? `${(parseFloat(operator.ftdRate) * 100).toFixed(1)}%` : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => (window.location.href = `/dashboard/operators/${operator.id}`)}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Operator Modal */}
      {showCreateModal && (
        <CreateOperatorModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOperators();
          }}
        />
      )}
    </div>
  );
}

function CreateOperatorModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    clientId: 'default-client', // In production, select from dropdown
    name: '',
    slug: '',
    brand: '',
    emailDomain: '',
    emailFromName: '',
    emailFromAddress: '',
    smsProvider: 'laaffic',
    smsSender: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('Operator created successfully!');
        onSuccess();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to create operator:', error);
      alert('Failed to create operator');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="premium-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Create New Operator</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Operator Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="Roobet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="roobet"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Brand Name</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Roobet Casino"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Domain
              </label>
              <input
                type="text"
                value={formData.emailDomain}
                onChange={(e) => setFormData({ ...formData, emailDomain: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="roobet.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                From Address
              </label>
              <input
                type="email"
                value={formData.emailFromAddress}
                onChange={(e) =>
                  setFormData({ ...formData, emailFromAddress: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="noreply@roobet.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">From Name</label>
            <input
              type="text"
              value={formData.emailFromName}
              onChange={(e) => setFormData({ ...formData, emailFromName: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Roobet Casino"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                SMS Provider
              </label>
              <select
                value={formData.smsProvider}
                onChange={(e) => setFormData({ ...formData, smsProvider: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="laaffic">Laaffic (iGaming)</option>
                <option value="twilio">Twilio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                SMS Sender
              </label>
              <input
                type="text"
                value={formData.smsSender}
                onChange={(e) => setFormData({ ...formData, smsSender: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="ROOBET"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 premium-button disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Operator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
