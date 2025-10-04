'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ClientStats {
  totalLeads: number
  totalRevenue: number
  conversionRate: number
  avgQualityScore: number
  recentLeads: any[]
}

export default function ClientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user as any)?.userType !== 'client') {
      router.push('/auth/signin')
      return
    }

    fetchClientStats()
  }, [session, status, router])

  const fetchClientStats = async () => {
    try {
      // Mock client stats for demo
      setStats({
        totalLeads: 1250,
        totalRevenue: 125000,
        conversionRate: 3.5,
        avgQualityScore: 87,
        recentLeads: [
          {
            id: '1',
            email: 'john@example.com',
            name: 'John Doe',
            campaign: 'Summer Promo',
            qualityScore: 95,
            value: 150,
            createdAt: new Date()
          },
          {
            id: '2',
            email: 'jane@example.com',
            name: 'Jane Smith',
            campaign: 'Black Friday',
            qualityScore: 88,
            value: 75,
            createdAt: new Date()
          }
        ]
      })
    } catch (error) {
      console.error('Failed to fetch client stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Client Portal</h1>
              <p className="text-sm text-gray-600">Welcome, {session?.user?.name}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Your lead generation performance overview</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stats-number">{stats?.totalLeads.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stats-number">${stats?.totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stats-number text-primary">{stats?.conversionRate}%</div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stats-number text-foreground">{stats?.avgQualityScore}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Leads</CardTitle>
                <Button variant="outline" size="sm">
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recentLeads && stats.recentLeads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Lead</th>
                        <th>Campaign</th>
                        <th>Quality Score</th>
                        <th>Value</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td>
                            <div>
                              <div className="font-medium">{lead.name}</div>
                              <div className="text-sm text-gray-500">{lead.email}</div>
                            </div>
                          </td>
                          <td>{lead.campaign}</td>
                          <td>
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              lead.qualityScore >= 80 ? 'bg-green-100 text-primary' :
                              lead.qualityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {lead.qualityScore}%
                            </span>
                          </td>
                          <td>${lead.value}</td>
                          <td>{lead.createdAt.toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No recent leads found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-medium mb-2">Download Report</h3>
                <p className="text-sm text-gray-600 mb-4">Get your monthly performance report</p>
                <Button variant="outline" size="sm">
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl mb-2">📈</div>
                <h3 className="font-medium mb-2">View Analytics</h3>
                <p className="text-sm text-gray-600 mb-4">Detailed performance analytics</p>
                <Button variant="outline" size="sm">
                  View Charts
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-medium mb-2">Contact Support</h3>
                <p className="text-sm text-gray-600 mb-4">Get help with your account</p>
                <Button variant="outline" size="sm">
                  Get Help
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}