'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  AnalyticsIcon,
  UsersIcon,
  ClicksIcon,
  EventsIcon,
  CampaignIcon,
  FraudIcon,
  SettingsIcon,
  SearchIcon,
  FlashIcon,
  UserIcon,
  TargetIcon,
  InfluencerIcon,
  LinksIcon
} from '@/components/ui/icons'
import { Mail, Building2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: AnalyticsIcon, description: 'Overview & Analytics' },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: CampaignIcon, description: 'Marketing Campaigns' },
  { name: 'Brands', href: '/dashboard/brands', icon: Building2, description: 'Brand Segmentation' },
  { name: 'Influencers', href: '/dashboard/influencers', icon: InfluencerIcon, description: 'Influencer Management' },
  { name: 'Customers', href: '/dashboard/customers', icon: UsersIcon, description: 'Customer Management' },
  { name: 'Lead Tracking', href: '/dashboard/leads', icon: TargetIcon, description: 'Lead Tracking' },
  { name: 'Journey Automation', href: '/dashboard/journey-automation', icon: Mail, description: 'Email & SMS Campaigns' },
  { name: 'Conversions', href: '/dashboard/events', icon: EventsIcon, description: 'Conversion Tracking' },
  { name: 'Links', href: '/dashboard/links', icon: LinksIcon, description: 'Link Management' },
  { name: 'Clicks', href: '/dashboard/clicks', icon: ClicksIcon, description: 'Click Tracking' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: AnalyticsIcon, description: 'Performance Insights' },
  { name: 'Fraud Monitor', href: '/dashboard/fraud', icon: FraudIcon, description: 'Security & Fraud' },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon, description: 'Configuration' },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [compactUserMenuOpen, setCompactUserMenuOpen] = useState(false)
  const compactUserMenuRef = useRef<HTMLDivElement>(null)

  // Preload all dashboard routes immediately for instant navigation
  useEffect(() => {
    navigation.forEach((item) => {
      router.prefetch(item.href)
    })
  }, [router])

  // Close compact user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (compactUserMenuRef.current && !compactUserMenuRef.current.contains(event.target as Node)) {
        setCompactUserMenuOpen(false)
      }
    }

    if (compactUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [compactUserMenuOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Sidebar - Always visible on all screens */}
      <div className={`fixed inset-y-0 left-0 z-30 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16 lg:w-20' : 'w-16 lg:w-80'
      }`}>
        <div className="flex h-full flex-col overflow-hidden bg-white/5 border-r border-white/10" style={{
          borderRadius: '0 24px 24px 0',
          position: 'relative'
        }}>
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-full" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/5 rounded-full delay-1000" />
          </div>

          {sidebarCollapsed ? (
            // No header when collapsed - minimal border
            <div className="border-b border-border/10 h-4"></div>
          ) : (
            // Logo & Brand when expanded (only on large screens)
            <div className="hidden lg:flex h-20 items-center justify-between border-b border-border/10 relative px-6">
              <div className="flex items-center flex-1">
                <div className="fade-in">
                  <h1 className="text-xl font-black text-foreground">Miela CRM</h1>
                  <p className="text-xs text-primary font-bold uppercase tracking-wider">Business System</p>
                </div>
              </div>
              {/* Hamburger button when expanded */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-xl hover:bg-muted/20 transition-all duration-300 text-primary hover:text-primary/80 flex-shrink-0"
                title="Collapse sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="transition-all duration-300">
                  <path d="M3 18h13v-2H3v2zm0-5h10v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className={`flex-1 px-4 space-y-3 relative overflow-y-auto custom-scrollbar py-4 lg:${sidebarCollapsed ? 'py-4' : 'py-6'}`}>
            {sidebarCollapsed && (
              // Hamburger at top of nav when collapsed on large screens
              <div className="mb-2 hidden lg:block">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="w-10 h-10 rounded-xl hover:bg-muted/20 transition-all duration-300 text-primary hover:text-primary/80 flex items-center justify-center"
                  title="Expand sidebar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="transition-all duration-300">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                  </svg>
                </button>
              </div>
            )}
            {navigation.map((item, index) => {
              // Special handling for dashboard root to avoid it matching all routes
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  className={`group relative flex items-center transition-all duration-300 rounded-xl mb-2 p-2 lg:p-3 justify-center border-transparent ${
                    isActive
                      ? (sidebarCollapsed ? '' : 'lg:bg-primary/20 lg:border-primary/30 lg:shadow-lg lg:justify-start')
                      : 'hover:bg-muted/20 hover:border-muted/30 border border-transparent lg:justify-start'
                  } ${
                    sidebarCollapsed ? 'lg:justify-center lg:border-transparent lg:bg-transparent' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  title={item.name}
                >
                  <div className={`rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-primary shadow-lg'
                      : 'bg-muted/20 hover:bg-muted/30'
                  } ${
                    sidebarCollapsed ? 'w-8 h-8 lg:w-10 lg:h-10 mr-0' : 'w-8 h-8 lg:w-10 lg:h-10 mr-0 lg:mr-4'
                  }`}>
                    <item.icon size={16} className={`lg:w-5 lg:h-5 ${isActive ? 'text-black' : 'text-yellow-400'}`} />
                  </div>
                  {/* Text only shown on large screens when not collapsed */}
                  <div className={`flex-1 min-w-0 ${
                    sidebarCollapsed ? 'hidden' : 'hidden lg:block'
                  }`}>
                    <p className={`font-bold text-sm truncate ${
                      isActive ? 'text-primary' : 'text-white'
                    }`}>{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-border/10 p-4 relative">
            {/* Always compact on small screens */}
            <div className="lg:hidden">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {/* Compact avatar for small screens - match large screen compact style */}
                  <button
                    onClick={() => setCompactUserMenuOpen(!compactUserMenuOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/30 hover:ring-primary/50 transition-all duration-300 shadow-lg"
                    title="User menu"
                  >
                    <Avatar
                      firstName="Abiola"
                      lastName="Admin"
                      size="md"
                      className="w-full h-full"
                    />
                  </button>
                  {/* Simple logout modal */}
                  {compactUserMenuOpen && (
                    <div className="absolute bottom-4 left-16 z-50">
                      <div
                        className="bg-background border border-primary/30 rounded-lg p-2 min-w-[120px]"
                        style={{
                          background: 'rgba(8, 7, 8, 0.95)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: '1px solid rgba(253, 198, 0, 0.3)',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                        }}
                      >
                        <button
                          onClick={() => {
                            setCompactUserMenuOpen(false)
                            signOut({ callbackUrl: '/auth/signin' })
                          }}
                          className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg hover:bg-primary/10 text-primary hover:text-primary/80 transition-all duration-300 text-sm font-medium"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9Z"/>
                          </svg>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Large screen user profile */}
            <div className="hidden lg:block">
              {sidebarCollapsed ? (
                <div className="flex flex-col items-center">
                  <div className="relative" ref={compactUserMenuRef}>
                    {/* Compact avatar using same API as expanded */}
                    <button
                      onClick={() => setCompactUserMenuOpen(!compactUserMenuOpen)}
                      className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/30 hover:ring-primary/50 transition-all duration-300 shadow-lg"
                      title="User menu"
                    >
                      <Avatar
                        firstName="Abiola"
                        lastName="Admin"
                        size="md"
                        className="w-full h-full"
                      />
                    </button>

                    {/* Simple logout modal */}
                    {compactUserMenuOpen && (
                      <div className="absolute bottom-4 left-16 z-50">
                        <div
                          className="bg-background border border-primary/30 rounded-lg p-2 min-w-[120px]"
                          style={{
                            background: 'rgba(8, 7, 8, 0.95)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(253, 198, 0, 0.3)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                          }}
                        >
                          <button
                            onClick={() => {
                              setCompactUserMenuOpen(false)
                              signOut({ callbackUrl: '/auth/signin' })
                            }}
                            className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg hover:bg-primary/10 text-primary hover:text-primary/80 transition-all duration-300 text-sm font-medium"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9Z"/>
                            </svg>
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="premium-card hover:shadow-lg transition-all duration-300" style={{ borderRadius: '24px' }}>
                  <div className="flex items-center space-x-3">
                    <Avatar
                      firstName="Abiola"
                      lastName="Admin"
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        Abiola
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Business Owner
                      </p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                      className="p-2 rounded-xl hover:bg-primary/10 text-primary hover:text-primary/80 transition-all duration-300"
                      title="Sign out"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9Z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16 lg:ml-20 lg:pl-4' : 'ml-16 lg:ml-80 lg:pl-4'
      }`}>
        {/* Page content without header spacing */}
        <main className="min-h-screen p-4 lg:p-6 relative">
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 bg-primary/5 rounded-full" />
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-secondary/5 rounded-full delay-1000" />
          </div>

          <div className="fade-in relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}