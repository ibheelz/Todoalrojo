'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, SearchIcon, ExportIcon, UsersIcon } from '@/components/ui/icons'

interface Customer {
  id: string
  firstName: string | null
  lastName: string | null
  masterEmail: string | null
  masterPhone: string | null
  country: string | null
  createdAt: string
  totalClicks: number
  totalLeads: number
  totalEvents: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/customers?limit=50')
      const data = await response.json()

      if (data.success) {
        setUsers(data.customers)
      } else {
        setError(data.error || 'Failed to fetch customers')
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user: Customer) =>
    (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.masterEmail && user.masterEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-primary">
            User Management
          </h1>
          <p className="text-lg text-muted-foreground font-medium mt-2">
            Manage your identity graph and user profiles
          </p>
        </div>
        <button className="premium-button-primary">
          <PlusIcon size={16} className="mr-2" />
          Add User
        </button>
      </div>

      {/* Search & Filters */}
      <div className="premium-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="search"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="premium-input"
            />
          </div>
          <div className="flex gap-3">
            <button className="premium-button-secondary">
              <SearchIcon size={16} className="mr-2" />
              Filter
            </button>
            <button className="premium-button-secondary">
              <ExportIcon size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-400 text-xl mb-4">⚠️ Error Loading Customers</div>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={fetchCustomers}
            className="premium-button-primary"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Users Grid */}
      {!error && (loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="premium-card p-6 shimmer">
              <div className="h-4 bg-muted/20 rounded mb-4"></div>
              <div className="h-3 bg-muted/20 rounded mb-2"></div>
              <div className="h-3 bg-muted/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-white/40 text-lg mb-2">No customers found</div>
          <p className="text-white/60">
            {searchQuery
              ? 'Try adjusting your search query to see more results.'
              : 'No customers have been added to the system yet.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user: Customer, index) => (
            <Link
              key={user.id}
              href={`/dashboard/customers/${user.id}`}
              className="premium-card p-6 transition-all duration-300 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                  <UsersIcon size={24} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-primary-foreground font-bold">
                    →
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.masterEmail
                  }
                </h3>
                <p className="text-sm text-muted-foreground font-medium">{user.masterEmail}</p>
                <p className="text-xs text-muted-foreground">{user.country || 'Unknown Location'}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  {user.totalClicks} clicks • {user.totalLeads} leads • {user.totalEvents} events
                </div>
              </div>
            </Link>
          ))}
        </div>
      ))}

      {/* Real Stats - Only show if we have users */}
      {!loading && !error && users.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-black text-primary mb-2">{users.length}</div>
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Customers</div>
          </div>
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-black text-blue-400 mb-2">
              {users.reduce((sum, user) => sum + (user.totalClicks || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Clicks</div>
          </div>
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-black text-green-400 mb-2">
              {users.reduce((sum, user) => sum + (user.totalLeads || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Leads</div>
          </div>
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-black text-purple-400 mb-2">
              {users.reduce((sum, user) => sum + (user.totalEvents || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Events</div>
          </div>
        </div>
      )}
    </div>
  )
}