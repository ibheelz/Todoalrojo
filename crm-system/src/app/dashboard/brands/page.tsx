'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Target, ChevronRight, Building2, Mail } from 'lucide-react';
import Link from 'next/link';

interface Operator {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  logoUrl?: string;
  status: string;
  primaryColor?: string;
  totalLeads: number;
  totalRegistrations: number;
  totalFTD: number;
  totalRevenue: string;
  regRate?: string;
  ftdRate?: string;
}

interface BrandStats {
  totalCustomers: number;
  stageDistribution: {
    stage: number;
    count: number;
  }[];
}

export default function BrandSegmentationPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandStats, setBrandStats] = useState<Record<string, BrandStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await fetch('/api/operators');
      const data = await response.json();
      setOperators(data.operators || []);

      // Fetch stats for each operator
      if (data.operators) {
        for (const op of data.operators) {
          fetchBrandStats(op.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch operators:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandStats = async (operatorId: string) => {
    try {
      // Get journey states for this operator to count customers
      const response = await fetch(`/api/journey/state?action=stats`);
      const data = await response.json();

      // Filter stats by operator (simplified - you may want a dedicated endpoint)
      setBrandStats((prev) => ({
        ...prev,
        [operatorId]: {
          totalCustomers: 0,
          stageDistribution: data.stats?.stageDistribution || [],
        },
      }));
    } catch (error) {
      console.error('Failed to fetch brand stats:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'PAUSED':
        return 'bg-yellow-500';
      case 'INACTIVE':
        return 'bg-gray-500';
      case 'TESTING':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Brand Segmentation</h1>
          <p className="text-gray-400 mt-1">
            View customers segmented by brand/operator with isolated journeys
          </p>
        </div>
        <Link
          href="/dashboard/journey-automation"
          className="premium-button flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Journey Automation
        </Link>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operators.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No brands yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Brands are automatically created when you add campaigns with brandIds
            </p>
            <Link
              href="/dashboard/campaigns"
              className="premium-button inline-flex items-center gap-2"
            >
              Go to Campaigns
            </Link>
          </div>
        ) : (
          operators.map((operator) => (
            <Link
              key={operator.id}
              href={`/dashboard/brands/${operator.id}`}
              className="premium-card hover:scale-105 transition-all duration-300 cursor-pointer group"
              style={{
                borderColor: operator.primaryColor || '#8B5CF6',
                borderWidth: '2px',
              }}
            >
              {/* Brand Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {operator.logoUrl ? (
                    <img
                      src={operator.logoUrl}
                      alt={operator.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                      style={{
                        backgroundColor: operator.primaryColor || '#8B5CF6',
                      }}
                    >
                      {operator.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                      {operator.name}
                    </h3>
                    <p className="text-sm text-gray-400">{operator.brand || operator.slug}</p>
                  </div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(operator.status)}`}
                  title={operator.status}
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400">Leads</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {operator.totalLeads.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Reg %</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {operator.regRate
                      ? `${(parseFloat(operator.regRate) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-400">FTD %</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {operator.ftdRate
                      ? `${(parseFloat(operator.ftdRate) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Revenue</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    ${parseFloat(operator.totalRevenue || '0').toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Stage Distribution Preview */}
              {brandStats[operator.id] && (
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs text-gray-400 mb-2">Customer Stages</p>
                  <div className="flex gap-2 flex-wrap">
                    {brandStats[operator.id].stageDistribution.slice(0, 3).map((stage) => (
                      <span
                        key={stage.stage}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStageColor(
                          stage.stage
                        )}`}
                      >
                        {getStageLabel(stage.stage)}: {stage.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* View Details Arrow */}
              <div className="flex items-center justify-end mt-4 text-purple-400 group-hover:text-purple-300 transition-colors">
                <span className="text-sm font-medium">View Details</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Quick Stats Overview */}
      {operators.length > 0 && (
        <div className="premium-card">
          <h2 className="text-xl font-bold text-white mb-4">All Brands Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Total Brands</p>
              <p className="text-2xl font-bold text-white mt-1">{operators.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Leads</p>
              <p className="text-2xl font-bold text-white mt-1">
                {operators.reduce((sum, op) => sum + op.totalLeads, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total FTDs</p>
              <p className="text-2xl font-bold text-white mt-1">
                {operators.reduce((sum, op) => sum + op.totalFTD, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">
                $
                {operators
                  .reduce((sum, op) => sum + parseFloat(op.totalRevenue || '0'), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
