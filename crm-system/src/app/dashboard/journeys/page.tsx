'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Users, TrendingUp, Clock, DollarSign } from 'lucide-react'

export default function JourneysPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/journey/search?query=${encodeURIComponent(searchQuery)}&includeJourney=true`)
      const result = await response.json()

      if (result.success) {
        setSearchResults(result.data.results)
      } else {
        console.error('Search failed:', result.error)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewJourney = async (customerId: string) => {
    try {
      const response = await fetch(`/api/journey/${customerId}`)
      const result = await response.json()

      if (result.success) {
        setSelectedCustomer(result.data)
      }
    } catch (error) {
      console.error('Failed to load journey:', error)
    }
  }

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (selectedCustomer) {
    return <JourneyDetailView customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Journeys</h1>
          <p className="text-muted-foreground">
            Track complete user journeys from first click to conversion
          </p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Customer Journeys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by email, phone, click ID, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((customer) => (
                <div
                  key={customer.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewJourney(customer.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold">
                        {customer.firstName} {customer.lastName}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        {customer.masterEmail && (
                          <span>📧 {customer.masterEmail}</span>
                        )}
                        {customer.masterPhone && (
                          <span>📱 {customer.masterPhone}</span>
                        )}
                        {customer.country && (
                          <span>🌍 {customer.country}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {customer.source || 'Unknown Source'}
                        </Badge>
                        {customer.isFraud && (
                          <Badge variant="destructive">Fraud</Badge>
                        )}
                        {!customer.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm font-medium">
                        {formatCurrency(parseFloat(customer.totalRevenue.toString()))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.counts.clicks} clicks, {customer.counts.leads} leads, {customer.counts.events} events
                      </div>
                      {customer.journey && (
                        <div className="text-xs text-blue-600">
                          {customer.journey.totalSteps} journey steps
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,429</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Journeys</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,832</div>
            <p className="text-xs text-muted-foreground">+8% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Journey Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2h</div>
            <p className="text-xs text-muted-foreground">From click to conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.3%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Help Text */}
      {searchResults.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">🗺️</div>
              <h3 className="text-lg font-semibold">Search for Customer Journeys</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Use the search box above to find customers by email, phone number, click ID, or name.
                You'll see their complete journey from first click to conversion.
              </p>
              <div className="text-sm text-gray-500">
                <p><strong>Example searches:</strong></p>
                <ul className="mt-2 space-y-1">
                  <li>• john@example.com</li>
                  <li>• +56912345678</li>
                  <li>• click_abc123</li>
                  <li>• John Doe</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Journey Detail Component
function JourneyDetailView({ customer, onBack }: { customer: any; onBack: () => void }) {
  const { customer: customerInfo, journey, stats, identifiers } = customer

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← Back to Search
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {customerInfo.firstName} {customerInfo.lastName}
          </h1>
          <p className="text-muted-foreground">
            Customer Journey • {stats.totalSteps} steps • {stats.journeyDuration ? Math.round(stats.journeyDuration / (1000 * 60 * 60)) : 0} hours
          </p>
        </div>
      </div>

      {/* Customer Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${parseFloat(stats.totalRevenue.toString()).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Journey Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSteps}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClicks} clicks, {stats.totalLeads} leads, {stats.totalEvents} events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenueEvents} revenue events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{customerInfo.source || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground">
              {customerInfo.country} {customerInfo.city && `• ${customerInfo.city}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Identifiers */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Identifiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {identifiers.map((identifier: any) => (
              <div key={identifier.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{identifier.type}:</span>
                  <span className="ml-2">{identifier.value}</span>
                </div>
                <div className="flex gap-1">
                  {identifier.isVerified && <Badge variant="outline" className="text-xs">✓ Verified</Badge>}
                  {identifier.isPrimary && <Badge variant="outline" className="text-xs">Primary</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journey Timeline */}
      <JourneyTimelineCard journey={journey} />
    </div>
  )
}

// Journey Timeline Card Component
function JourneyTimelineCard({ journey }: { journey: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🗺️ Journey Timeline
          <Badge variant="secondary">{journey.length} steps</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {journey.map((step, index) => (
            <div key={step.id} className="relative flex items-start mb-6 last:mb-0">
              {/* Timeline dot */}
              <div className={`
                relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 text-lg
                ${getStepColorClasses(step.metadata.color)}
              `}>
                {step.metadata.icon}
              </div>

              {/* Content */}
              <div className="ml-4 flex-1">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {step.type}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        {new Date(step.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Step details */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {step.data.campaign && (
                      <div><span className="font-medium">Campaign:</span> {step.data.campaign}</div>
                    )}
                    {step.data.source && (
                      <div><span className="font-medium">Source:</span> {step.data.source}</div>
                    )}
                    {step.data.value && (
                      <div><span className="font-medium">Value:</span> ${step.data.value} {step.data.currency || 'USD'}</div>
                    )}
                    {step.data.clickId && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Click ID:</span>
                        <span className="text-sm font-mono text-yellow-400 px-2 py-1 rounded inline-block" style={{
                          background: 'rgba(253, 198, 0, 0.1)',
                          border: '1px solid rgba(253, 198, 0, 0.3)'
                        }}>
                          {step.data.clickId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function getStepColorClasses(color: string) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    pink: 'bg-pink-100 text-pink-800 border-pink-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200'
  }
  return colorMap[color] || colorMap.gray
}