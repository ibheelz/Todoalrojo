'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, SearchIcon, ExportIcon, UsersIcon } from '@/components/ui/icons'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setUsers([
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', country: 'USA', createdAt: new Date() },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', country: 'UK', createdAt: new Date() },
        { id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', country: 'Canada', createdAt: new Date() },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredUsers = users.filter((customer: any) =>
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
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

      {/* Users Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="premium-card p-6 shimmer">
              <div className="h-4 bg-muted/20 rounded mb-4"></div>
              <div className="h-3 bg-muted/20 rounded mb-2"></div>
              <div className="h-3 bg-muted/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((customer: any, index) => (
            <Link
              key={user.id}
              href={`/dashboard/users/${user.id}`}
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
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.country}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card p-6 text-center">
          <div className="text-3xl font-black text-primary mb-2">{users.length}</div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Users</div>
        </div>
        <div className="premium-card p-6 text-center">
          <div className="text-3xl font-black text-primary mb-2">98%</div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Active Rate</div>
        </div>
        <div className="premium-card p-6 text-center">
          <div className="text-3xl font-black text-foreground mb-2">24h</div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Avg Session</div>
        </div>
        <div className="premium-card p-6 text-center">
          <div className="text-3xl font-black text-foreground mb-2">85%</div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Retention</div>
        </div>
      </div>
    </div>
  )
}