'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailIcon, PhoneIcon, LocationIcon } from '@/components/ui/icons'
import { Avatar } from '@/components/ui/avatar'

interface SearchResult {
  id: string
  masterEmail: string | null
  masterPhone: string | null
  firstName: string | null
  lastName: string | null
  country: string | null
  city: string | null
  createdAt: string
  identifiers: Array<{
    type: string
    value: string
    isVerified: boolean
    isPrimary: boolean
  }>
  _count: {
    clicks: number
    leads: number
    events: number
  }
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (err) {
      setError('Failed to perform search')
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = (customer: SearchResult) => {
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName} ${customer.lastName}`
    }
    return customer.masterEmail || customer.masterPhone || 'Unknown User'
  }

  const getLocation = (customer: SearchResult) => {
    if (customer.city && customer.country) {
      return `${customer.city}, ${customer.country}`
    }
    return customer.country || 'Unknown location'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Search Results</h1>
        {query && (
          <p className="text-gray-600">
            Search results for: <span className="font-medium">"{query}"</span>
          </p>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-lg">Searching...</div>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
          </div>

          {results.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  No users found matching your search criteria.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {results.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar
                          firstName={customer.firstName}
                          lastName={customer.lastName}
                          userId={customer.id}
                          size="md"
                        />
                        <div className="flex-1">
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="text-lg font-medium text-foreground hover:text-foreground"
                          >
                            {getDisplayName(customer)}
                          </Link>

                        <div className="mt-2 space-y-1">
                          {customer.masterEmail && (
                            <div className="text-sm text-gray-600">
                              <EmailIcon size={16} className="inline mr-1" />{customer.masterEmail}
                            </div>
                          )}
                          {customer.masterPhone && (
                            <div className="text-sm text-gray-600">
                              <PhoneIcon size={16} className="inline mr-1" />{customer.masterPhone}
                            </div>
                          )}
                          <div className="text-sm text-gray-600">
                            <LocationIcon size={16} className="inline mr-1" />{getLocation(customer)}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {customer.identifiers.slice(0, 3).map((identifier, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                identifier.isPrimary
                                  ? 'bg-blue-100 text-foreground'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {identifier.type}: {identifier.value}
                              {identifier.isVerified && ' ✓'}
                            </span>
                          ))}
                          {customer.identifiers.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{customer.identifiers.length - 3} more
                            </span>
                          )}
                        </div>
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <div className="text-sm text-gray-600">
                          Created: {new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-gray-500">
                          <div>{customer._count.clicks} clicks</div>
                          <div>{customer._count.leads} leads</div>
                          <div>{customer._count.events} events</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-32"><div className="text-lg">Loading search...</div></div>}>
      <SearchPageContent />
    </Suspense>
  )
}