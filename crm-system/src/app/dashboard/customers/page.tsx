'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Edit, Trash2, Grid3X3, List, Plus, X } from 'lucide-react'
import { ExportIcon, ImportIcon, PlusIcon, SearchIcon } from '@/components/ui/icons'
import CustomerModal from '@/components/ui/customer-modal'
import { Avatar } from '@/components/ui/avatar'

// Hook to detect screen size
const useScreenSize = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024) // Less than lg breakpoint
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return isSmallScreen
}

// SVG Icons for verification status
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SortIcon = ({ field, sortField, sortDirection }: { field: string, sortField: string, sortDirection: 'asc' | 'desc' }) => {
  if (sortField !== field) {
    return (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }

  return sortDirection === 'asc' ? (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

interface Customer {
  id: string
  firstName?: string
  lastName?: string
  masterEmail?: string
  masterPhone?: string
  company?: string
  lastSeen?: Date
  source?: string
  country?: string
  region?: string
  city?: string
  createdAt: Date
  isRealData?: boolean // Flag to identify real vs sample data
  // Additional fields for comprehensive data
  clicks?: { id: string; campaign: string; source: string; medium: string; ip: string; createdAt: string }[]
  leads?: { id: string; campaign: string; source: string; medium: string; value: number; createdAt: string }[]
  events?: { id: string; eventType: string; campaign: string; value: number; createdAt: string }[]
  identifiers?: { type: string; value: string; isVerified: boolean; isPrimary: boolean }[]
  _count?: {
    clicks: number
    leads: number
    events: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [customersPerPage] = useState(20)
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const isSmallScreen = useScreenSize()
  const router = useRouter()

  // Force cards view on small screens
  const effectiveViewMode = isSmallScreen ? 'cards' : viewMode

  // Navigation function to customer tracking profile
  const navigateToCustomer = (customerId: string) => {
    router.push(`/dashboard/customers/${customerId}`)
  }

  // Using custom Avatar component instead of external API

  // Add verbose debugging state
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true)

  // Function to add debug information
  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const debugMessage = `[${timestamp}] ${message}`
    console.log('🔍 [CUSTOMERS DEBUG]', debugMessage)
    setDebugInfo(prev => [debugMessage, ...prev.slice(0, 19)]) // Keep last 20 messages
  }

  // Function to fetch real customer data
  const fetchCustomerData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
        addDebugInfo('🔄 Starting customer data fetch...')
      } else {
        addDebugInfo('🔄 Refreshing customer data (background)...')
      }

      // Fetch customers with related data
      const response = await fetch('/api/customers?limit=50&includeRelated=true')
      const data = await response.json()

      console.log('👥 Customer data received:', {
        success: data.success,
        totalCustomers: data.customers?.length || 0,
        includesRelatedData: true,
        timestamp: new Date().toISOString()
      })

      if (data.success) {
        addDebugInfo(`✅ Fetched ${data.customers.length} real customers from API with related data`)

        // Process real customers with related data
        const realCustomers = data.customers.map((customer: any) => {
          const processedCustomer = {
            ...customer,
            isRealData: true, // Flag to identify real data
            lastSeen: customer.lastSeen ? new Date(customer.lastSeen) : null,
            createdAt: new Date(customer.createdAt)
          }

          // Log related data counts for debugging
          if (customer._count) {
            console.log(`📊 Customer ${customer.masterEmail || customer.id} related data:`, {
              clicks: customer._count.clicks,
              leads: customer._count.leads,
              events: customer._count.events,
              recentClicks: customer.clicks?.length || 0,
              recentLeads: customer.leads?.length || 0,
              recentEvents: customer.events?.length || 0
            })
          }

          return processedCustomer
        })

        // Add sample data as backup/demo data
        const sampleCustomers = getSampleCustomers()

        // Combine real customers first, then sample customers
        const combinedCustomers = [...realCustomers, ...sampleCustomers]

        setCustomers(combinedCustomers)
        setLastRefresh(new Date())
        addDebugInfo(`📊 Total customers displayed: ${combinedCustomers.length} (${realCustomers.length} real + ${sampleCustomers.length} sample)`)

        // Additional debugging for related data
        const totalClicks = realCustomers.reduce((sum, c) => sum + (c._count?.clicks || 0), 0)
        const totalLeads = realCustomers.reduce((sum, c) => sum + (c._count?.leads || 0), 0)
        const totalEvents = realCustomers.reduce((sum, c) => sum + (c._count?.events || 0), 0)
        addDebugInfo(`📋 Related data totals - Clicks: ${totalClicks}, Leads: ${totalLeads}, Events: ${totalEvents}`)
      } else {
        console.error('❌ Failed to fetch customers:', data.error)
        addDebugInfo('❌ Failed to fetch real customers, using sample data only')
        setCustomers(getSampleCustomers())
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
      addDebugInfo(`❌ Error fetching customers: ${error}`)
      // Fallback to sample data
      setCustomers(getSampleCustomers())
    } finally {
      setLoading(false)
    }
  }

  // Function to get sample data
  const getSampleCustomers = (): Customer[] => {
        // Generate diverse last seen times
        const generateLastSeen = (index: number) => {
          const timeRanges = [
            5 * 60 * 1000, // 5 minutes ago
            30 * 60 * 1000, // 30 minutes ago
            2 * 60 * 60 * 1000, // 2 hours ago
            6 * 60 * 60 * 1000, // 6 hours ago
            24 * 60 * 60 * 1000, // 1 day ago
            3 * 24 * 60 * 60 * 1000, // 3 days ago
            7 * 24 * 60 * 60 * 1000, // 1 week ago
            14 * 24 * 60 * 60 * 1000, // 2 weeks ago
          ]
          return new Date(Date.now() - timeRanges[index % timeRanges.length])
        }

        return [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            masterEmail: 'john.doe@example.com',
            masterPhone: '+1234567890',
            company: 'TechCorp Inc',
            lastSeen: generateLastSeen(0),
            source: 'LinkedIn',
            country: 'US',
            city: 'San Francisco',
            createdAt: new Date('2024-01-15'),
            clicks: [{ clickId: 'click_001', campaign: 'summer-2024', ip: '192.168.1.100', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', landingPage: 'https://example.com/landing' }],
            leads: [{ campaign: 'summer-2024', ip: '192.168.1.100', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', landingPage: 'https://example.com/landing', ageVerified: true, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '2',
            firstName: 'Sarah',
            lastName: 'Johnson',
            masterEmail: 'sarah.j@innovate.com',
            masterPhone: '+1234567891',
            company: 'InnovateMedia',
            lastSeen: generateLastSeen(1),
            source: 'Referral',
            country: 'CA',
            city: 'Toronto',
            createdAt: new Date('2024-01-20'),
            clicks: [{ clickId: 'click_002', campaign: 'black-friday-2024', ip: '192.168.1.101', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', landingPage: 'https://example.com/promo' }],
            leads: [{ campaign: 'black-friday-2024', ip: '192.168.1.101', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', landingPage: 'https://example.com/promo', ageVerified: false, promotionalConsent: false }],
            identifiers: [{ type: 'EMAIL', isVerified: false }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '3',
            firstName: 'Mike',
            lastName: 'Chen',
            masterEmail: 'mike.chen@startup.io',
            masterPhone: '+1234567892',
            company: 'StartupX',
            lastSeen: generateLastSeen(2),
            source: 'Google Ads',
            country: 'US',
            city: 'New York',
            createdAt: new Date('2024-01-25'),
            clicks: [{ clickId: 'click_003', campaign: 'winter-sale', ip: '192.168.1.102', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', landingPage: 'https://example.com/sale' }],
            leads: [{ campaign: 'winter-sale', ip: '192.168.1.102', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', landingPage: 'https://example.com/sale', ageVerified: true, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: false }]
          },
          {
            id: '4',
            firstName: 'Emma',
            lastName: 'Wilson',
            masterEmail: 'emma.wilson@design.co',
            masterPhone: '+44207123456',
            company: 'DesignStudio',
            lastSeen: generateLastSeen(3),
            source: 'Facebook',
            country: 'GB',
            city: 'London',
            createdAt: new Date('2024-02-01'),
            clicks: [{ clickId: 'click_004', campaign: 'design-promo', ip: '10.0.0.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101', landingPage: 'https://example.com/design' }],
            leads: [{ campaign: 'design-promo', ip: '10.0.0.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101', landingPage: 'https://example.com/design', ageVerified: true, promotionalConsent: false }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '5',
            firstName: 'Alex',
            lastName: 'Rodriguez',
            masterEmail: 'alex.r@consulting.com',
            masterPhone: '+34912345678',
            company: 'Rodriguez Consulting',
            lastSeen: generateLastSeen(4),
            source: 'Direct',
            country: 'ES',
            city: 'Madrid',
            createdAt: new Date('2024-02-05'),
            clicks: [{ clickId: 'click_005', campaign: 'spring-launch', ip: '172.16.0.1', userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)', landingPage: 'https://example.com/launch' }],
            leads: [{ campaign: 'spring-launch', ip: '172.16.0.1', userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)', landingPage: 'https://example.com/launch', ageVerified: false, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: false }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '6',
            firstName: 'Lisa',
            lastName: 'Zhang',
            masterEmail: 'lisa.zhang@techsolutions.com',
            masterPhone: '+8613888888888',
            company: 'TechSolutions',
            lastSeen: generateLastSeen(5),
            source: 'LinkedIn',
            country: 'CN',
            city: 'Shanghai',
            createdAt: new Date('2024-02-10'),
            clicks: [{ clickId: 'click_006', campaign: 'asia-expansion', ip: '192.168.2.100', userAgent: 'Mozilla/5.0 (Android 12; Mobile; rv:107.0)', landingPage: 'https://example.com/asia' }],
            leads: [{ campaign: 'asia-expansion', ip: '192.168.2.100', userAgent: 'Mozilla/5.0 (Android 12; Mobile; rv:107.0)', landingPage: 'https://example.com/asia', ageVerified: true, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '7',
            firstName: 'David',
            lastName: 'Brown',
            masterEmail: 'david.brown@marketing.au',
            masterPhone: '+61298765432',
            company: 'Marketing Pro',
            lastSeen: generateLastSeen(6),
            source: 'Google Ads',
            country: 'AU',
            city: 'Sydney',
            createdAt: new Date('2024-02-15'),
            clicks: [{ clickId: 'click_007', campaign: 'aussie-deals', ip: '203.0.113.1', userAgent: 'Mozilla/5.0 (Windows NT 11.0; Win64; x64)', landingPage: 'https://example.com/australia' }],
            leads: [{ campaign: 'aussie-deals', ip: '203.0.113.1', userAgent: 'Mozilla/5.0 (Windows NT 11.0; Win64; x64)', landingPage: 'https://example.com/australia', ageVerified: true, promotionalConsent: false }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: false }]
          },
          {
            id: '8',
            firstName: 'Sophie',
            lastName: 'Martin',
            masterEmail: 'sophie.martin@creativeagency.fr',
            masterPhone: '+33142345678',
            company: 'Creative Agency',
            lastSeen: generateLastSeen(7),
            source: 'Instagram',
            country: 'FR',
            city: 'Paris',
            createdAt: new Date('2024-02-20'),
            clicks: [{ clickId: 'click_008', campaign: 'french-style', ip: '198.51.100.1', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', landingPage: 'https://example.com/france' }],
            leads: [{ campaign: 'french-style', ip: '198.51.100.1', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', landingPage: 'https://example.com/france', ageVerified: false, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: false }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '9',
            firstName: 'James',
            lastName: 'Taylor',
            masterEmail: 'james.taylor@fintech.com',
            masterPhone: '+1555123456',
            company: 'FinTech Solutions',
            lastSeen: generateLastSeen(8),
            source: 'Twitter',
            country: 'US',
            city: 'Austin',
            createdAt: new Date('2024-02-25'),
            clicks: [{ clickId: 'click_009', campaign: 'fintech-revolution', ip: '192.168.3.100', userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', landingPage: 'https://example.com/fintech' }],
            leads: [{ campaign: 'fintech-revolution', ip: '192.168.3.100', userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', landingPage: 'https://example.com/fintech', ageVerified: true, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '10',
            firstName: 'Maria',
            lastName: 'Garcia',
            masterEmail: 'maria.garcia@ecommerce.mx',
            masterPhone: '+525512345678',
            company: 'E-Commerce Plus',
            lastSeen: generateLastSeen(9),
            source: 'YouTube',
            country: 'MX',
            city: 'Mexico City',
            createdAt: new Date('2024-03-01'),
            clicks: [{ clickId: 'click_010', campaign: 'mexico-market', ip: '10.1.1.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0)', landingPage: 'https://example.com/mexico' }],
            leads: [{ campaign: 'mexico-market', ip: '10.1.1.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0)', landingPage: 'https://example.com/mexico', ageVerified: false, promotionalConsent: false }],
            identifiers: [{ type: 'EMAIL', isVerified: false }, { type: 'PHONE', isVerified: false }]
          },
          {
            id: '11',
            firstName: 'Robert',
            lastName: 'Kim',
            masterEmail: 'robert.kim@tech.kr',
            masterPhone: '+821012345678',
            company: 'Korean Tech',
            lastSeen: generateLastSeen(10),
            source: 'LinkedIn',
            country: 'KR',
            city: 'Seoul',
            createdAt: new Date('2024-03-05'),
            clicks: [{ clickId: 'click_011', campaign: 'korea-tech', ip: '192.168.4.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', landingPage: 'https://example.com/korea' }],
            leads: [{ campaign: 'korea-tech', ip: '192.168.4.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', landingPage: 'https://example.com/korea', ageVerified: true, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '12',
            firstName: 'Anna',
            lastName: 'Petrov',
            masterEmail: 'anna.petrov@digital.ru',
            masterPhone: '+79161234567',
            company: 'Digital Russia',
            lastSeen: generateLastSeen(11),
            source: 'Referral',
            country: 'RU',
            city: 'Moscow',
            createdAt: new Date('2024-03-10'),
            clicks: [{ clickId: 'click_012', campaign: 'russia-digital', ip: '172.17.0.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0)', landingPage: 'https://example.com/russia' }],
            leads: [{ campaign: 'russia-digital', ip: '172.17.0.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0)', landingPage: 'https://example.com/russia', ageVerified: true, promotionalConsent: false }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: false }]
          },
          {
            id: '13',
            firstName: 'Carlos',
            lastName: 'Silva',
            masterEmail: 'carlos.silva@startup.br',
            masterPhone: '+5511987654321',
            company: 'Brazil Startup',
            lastSeen: generateLastSeen(12),
            source: 'Facebook',
            country: 'BR',
            city: 'São Paulo',
            createdAt: new Date('2024-03-15'),
            clicks: [{ clickId: 'click_013', campaign: 'brazil-growth', ip: '198.51.100.50', userAgent: 'Mozilla/5.0 (Android 13; SM-G998B)', landingPage: 'https://example.com/brazil' }],
            leads: [{ campaign: 'brazil-growth', ip: '198.51.100.50', userAgent: 'Mozilla/5.0 (Android 13; SM-G998B)', landingPage: 'https://example.com/brazil', ageVerified: false, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: false }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '14',
            firstName: 'Jennifer',
            lastName: 'White',
            masterEmail: 'jennifer.white@healthcare.com',
            masterPhone: '+1416555789',
            company: 'Healthcare Innovation',
            lastSeen: generateLastSeen(13),
            source: 'Google Ads',
            country: 'CA',
            city: 'Vancouver',
            createdAt: new Date('2024-03-20'),
            clicks: [{ clickId: 'click_014', campaign: 'health-tech', ip: '10.2.2.2', userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_6 like Mac OS X)', landingPage: 'https://example.com/health' }],
            leads: [{ campaign: 'health-tech', ip: '10.2.2.2', userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_6 like Mac OS X)', landingPage: 'https://example.com/health', ageVerified: true, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '15',
            firstName: 'Ahmed',
            lastName: 'Hassan',
            masterEmail: 'ahmed.hassan@middle-east.ae',
            masterPhone: '+971501234567',
            company: 'Middle East Tech',
            lastSeen: generateLastSeen(14),
            source: 'LinkedIn',
            country: 'AE',
            city: 'Dubai',
            createdAt: new Date('2024-03-25'),
            clicks: [{ clickId: 'click_015', campaign: 'mena-expansion', ip: '192.168.5.100', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', landingPage: 'https://example.com/mena' }],
            leads: [{ campaign: 'mena-expansion', ip: '192.168.5.100', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', landingPage: 'https://example.com/mena', ageVerified: true, promotionalConsent: false }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '16',
            firstName: 'Linda',
            lastName: 'Anderson',
            masterEmail: 'linda.anderson@retail.com',
            masterPhone: '+1702555123',
            company: 'Retail Solutions',
            lastSeen: generateLastSeen(15),
            source: 'Instagram',
            country: 'US',
            city: 'Las Vegas',
            createdAt: new Date('2024-03-30'),
            clicks: [{ clickId: 'click_016', campaign: 'retail-revolution', ip: '203.0.113.50', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/91.0.864.59', landingPage: 'https://example.com/retail' }],
            leads: [{ campaign: 'retail-revolution', ip: '203.0.113.50', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/91.0.864.59', landingPage: 'https://example.com/retail', ageVerified: false, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: false }, { type: 'PHONE', isVerified: false }]
          },
          {
            id: '17',
            firstName: 'Thomas',
            lastName: 'Mueller',
            masterEmail: 'thomas.mueller@automotive.de',
            masterPhone: '+4930123456789',
            company: 'Automotive Tech',
            lastSeen: generateLastSeen(16),
            source: 'Direct',
            country: 'DE',
            city: 'Berlin',
            createdAt: new Date('2024-04-01'),
            clicks: [{ clickId: 'click_017', campaign: 'german-engineering', ip: '10.3.3.3', userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0)', landingPage: 'https://example.com/germany' }],
            leads: [{ campaign: 'german-engineering', ip: '10.3.3.3', userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0)', landingPage: 'https://example.com/germany', ageVerified: true, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '18',
            firstName: 'Priya',
            lastName: 'Sharma',
            masterEmail: 'priya.sharma@software.in',
            masterPhone: '+919876543210',
            company: 'India Software',
            lastSeen: generateLastSeen(17),
            source: 'YouTube',
            country: 'IN',
            city: 'Bangalore',
            createdAt: new Date('2024-04-05'),
            clicks: [{ clickId: 'click_018', campaign: 'india-innovation', ip: '192.168.6.100', userAgent: 'Mozilla/5.0 (Android 11; Mobile; LG-M255)', landingPage: 'https://example.com/india' }],
            leads: [{ campaign: 'india-innovation', ip: '192.168.6.100', userAgent: 'Mozilla/5.0 (Android 11; Mobile; LG-M255)', landingPage: 'https://example.com/india', ageVerified: false, promotionalConsent: false }],
            identifiers: [{ type: 'EMAIL', isVerified: false }, { type: 'PHONE', isVerified: true }]
          },
          {
            id: '19',
            firstName: 'Marco',
            lastName: 'Rossi',
            masterEmail: 'marco.rossi@fashion.it',
            masterPhone: '+390612345678',
            company: 'Italian Fashion',
            lastSeen: generateLastSeen(18),
            source: 'Pinterest',
            country: 'IT',
            city: 'Milan',
            createdAt: new Date('2024-04-10'),
            clicks: [{ clickId: 'click_019', campaign: 'italian-style', ip: '172.18.0.1', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6)', landingPage: 'https://example.com/italy' }],
            leads: [{ campaign: 'italian-style', ip: '172.18.0.1', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6)', landingPage: 'https://example.com/italy', ageVerified: true, promotionalConsent: true }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: false }]
          },
          {
            id: '20',
            firstName: 'Yuki',
            lastName: 'Tanaka',
            masterEmail: 'yuki.tanaka@gaming.jp',
            masterPhone: '+81312345678',
            company: 'Gaming Studio',
            lastSeen: generateLastSeen(19),
            source: 'TikTok',
            country: 'JP',
            city: 'Tokyo',
            createdAt: new Date('2024-04-15'),
            clicks: [{ clickId: 'click_020', campaign: 'japan-gaming', ip: '198.51.100.100', userAgent: 'Mozilla/5.0 (Nintendo Switch; WebApplet)', landingPage: 'https://example.com/japan' }],
            leads: [{ campaign: 'japan-gaming', ip: '198.51.100.100', userAgent: 'Mozilla/5.0 (Nintendo Switch; WebApplet)', landingPage: 'https://example.com/japan', ageVerified: true, promotionalConsent: false }],
            identifiers: [{ type: 'EMAIL', isVerified: true }, { type: 'PHONE', isVerified: true }]
          }
        ]
  }

  // Delete functions
  const deleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from local state
        setCustomers(prev => prev.filter(customer => customer.id !== customerId))
        setSelectedCustomers(prev => {
          const newSelected = new Set(prev)
          newSelected.delete(customerId)
          return newSelected
        })
        addDebugInfo(`✅ Deleted customer ${customerId}`)
      } else {
        addDebugInfo(`❌ Failed to delete customer ${customerId}`)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      addDebugInfo(`❌ Error deleting customer: ${error}`)
    }
  }

  const deleteSelectedCustomers = async () => {
    const customerIds = Array.from(selectedCustomers)

    // Filter out sample customers (those without isRealData flag)
    const realCustomerIds = customerIds.filter(id => {
      const customer = customers.find(c => c.id === id)
      return customer?.isRealData
    })

    if (realCustomerIds.length === 0) {
      addDebugInfo('⚠️ Cannot delete sample customers')
      return
    }

    if (!confirm(`Are you sure you want to delete ${realCustomerIds.length} customer(s)?`)) {
      return
    }

    try {
      for (const customerId of realCustomerIds) {
        await deleteCustomer(customerId)
      }

      setSelectedCustomers(new Set())
      addDebugInfo(`✅ Deleted ${realCustomerIds.length} customer(s)`)
    } catch (error) {
      console.error('Error deleting customers:', error)
      addDebugInfo(`❌ Error deleting customers: ${error}`)
    }
  }

  // Initial data load
  useEffect(() => {
    addDebugInfo('🚀 Initializing customer data...')
    fetchCustomerData()
  }, [])

  // Live updates polling
  useEffect(() => {
    if (!liveUpdatesEnabled) {
      addDebugInfo('⏸️ Live updates disabled')
      return
    }

    addDebugInfo('⚡ Setting up live updates (every 10 seconds)...')
    const interval = setInterval(() => {
      addDebugInfo('🔄 Live update triggered')
      fetchCustomerData(false) // Background refresh without loading spinner
    }, 10000) // Poll every 10 seconds

    return () => {
      clearInterval(interval)
      addDebugInfo('⏹️ Live updates stopped')
    }
  }, [liveUpdatesEnabled])

  // Add manual refresh function
  const handleManualRefresh = () => {
    addDebugInfo('🔄 Manual refresh triggered')
    fetchCustomerData()
  }

  // Filter and sort customers based on search query and sort criteria
  const filteredCustomers = customers
    .filter(customer =>
      searchQuery === '' ||
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.masterEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0

      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          // Sort by last seen for name column
          aValue = a.lastSeen ? new Date(a.lastSeen).getTime() : 0
          bValue = b.lastSeen ? new Date(b.lastSeen).getTime() : 0
          break
        case 'email':
          // Sort by verification status first, then alphabetically
          const aEmailSortVerified = a.identifiers?.find(id => id.type === 'EMAIL')?.isVerified || false
          const bEmailSortVerified = b.identifiers?.find(id => id.type === 'EMAIL')?.isVerified || false
          if (aEmailSortVerified !== bEmailSortVerified) {
            // Verified emails come first
            aValue = aEmailSortVerified ? 0 : 1
            bValue = bEmailSortVerified ? 0 : 1
          } else {
            // Same verification status, sort alphabetically
            aValue = a.masterEmail?.toLowerCase() || ''
            bValue = b.masterEmail?.toLowerCase() || ''
          }
          break
        case 'phone':
          // Sort by verification status first, then alphabetically
          const aPhoneSortVerified = a.identifiers?.find(id => id.type === 'PHONE')?.isVerified || false
          const bPhoneSortVerified = b.identifiers?.find(id => id.type === 'PHONE')?.isVerified || false
          if (aPhoneSortVerified !== bPhoneSortVerified) {
            // Verified phones come first
            aValue = aPhoneSortVerified ? 0 : 1
            bValue = bPhoneSortVerified ? 0 : 1
          } else {
            // Same verification status, sort alphabetically
            aValue = a.masterPhone || ''
            bValue = b.masterPhone || ''
          }
          break
        case 'source':
          aValue = (a.leads?.[0]?.source || a.clicks?.[0]?.source || a.source || '').toLowerCase()
          bValue = (b.leads?.[0]?.source || b.clicks?.[0]?.source || b.source || '').toLowerCase()
          break
        case 'campaign':
          aValue = (a.leads?.[0]?.campaign || a.clicks?.[0]?.campaign || '').toLowerCase()
          bValue = (b.leads?.[0]?.campaign || b.clicks?.[0]?.campaign || '').toLowerCase()
          break
        case 'timestamp':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'ip':
          aValue = (a.leads?.[0]?.ip || a.clicks?.[0]?.ip || '').toLowerCase()
          bValue = (b.leads?.[0]?.ip || b.clicks?.[0]?.ip || '').toLowerCase()
          break
        case 'location':
          aValue = `${a.city || ''} ${a.country || ''}`.toLowerCase().trim()
          bValue = `${b.city || ''} ${b.country || ''}`.toLowerCase().trim()
          break
        case 'language':
          aValue = a.language || ''
          bValue = b.language || ''
          break
        case 'verification':
          const aEmailVerified = a.identifiers?.find(id => id.type === 'EMAIL')?.isVerified || false
          const aPhoneVerified = a.identifiers?.find(id => id.type === 'PHONE')?.isVerified || false
          const bEmailVerified = b.identifiers?.find(id => id.type === 'EMAIL')?.isVerified || false
          const bPhoneVerified = b.identifiers?.find(id => id.type === 'PHONE')?.isVerified || false
          aValue = (aEmailVerified ? 1 : 0) + (aPhoneVerified ? 1 : 0)
          bValue = (bEmailVerified ? 1 : 0) + (bPhoneVerified ? 1 : 0)
          break
        case 'landing':
          aValue = (a.leads?.[0]?.landingPage || a.clicks?.[0]?.landingPage || '').toLowerCase()
          bValue = (b.leads?.[0]?.landingPage || b.clicks?.[0]?.landingPage || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  // Pagination
  const indexOfLastCustomer = currentPage * customersPerPage
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer)
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage)

  // Helper function to get country flag emoji from country name or code
  const getCountryFlag = (country?: string) => {
    if (!country) return '🌍'

    const countryUpper = country.toUpperCase()

    // Map full country names to flags
    const countryFlags: { [key: string]: string } = {
      // Full country names
      'UNITED STATES': '🇺🇸', 'USA': '🇺🇸', 'AMERICA': '🇺🇸',
      'UNITED KINGDOM': '🇬🇧', 'UK': '🇬🇧', 'BRITAIN': '🇬🇧', 'ENGLAND': '🇬🇧',
      'CANADA': '🇨🇦',
      'SPAIN': '🇪🇸',
      'CHINA': '🇨🇳',
      'AUSTRALIA': '🇦🇺',
      'FRANCE': '🇫🇷',
      'MEXICO': '🇲🇽',
      'SOUTH KOREA': '🇰🇷', 'KOREA': '🇰🇷',
      'RUSSIA': '🇷🇺', 'RUSSIAN FEDERATION': '🇷🇺',
      'BRAZIL': '🇧🇷',
      'UNITED ARAB EMIRATES': '🇦🇪', 'UAE': '🇦🇪',
      'GERMANY': '🇩🇪',
      'INDIA': '🇮🇳',
      'ITALY': '🇮🇹',
      'JAPAN': '🇯🇵',
      'NIGERIA': '🇳🇬',
      'SOUTH AFRICA': '🇿🇦',
      'NETHERLANDS': '🇳🇱', 'HOLLAND': '🇳🇱',
      'SWITZERLAND': '🇨🇭',
      'SWEDEN': '🇸🇪',
      'NORWAY': '🇳🇴',
      'DENMARK': '🇩🇰',
      'FINLAND': '🇫🇮',
      'POLAND': '🇵🇱',
      'PORTUGAL': '🇵🇹',
      'GREECE': '🇬🇷',
      'TURKEY': '🇹🇷',
      'ISRAEL': '🇮🇱',
      'EGYPT': '🇪🇬',
      'SAUDI ARABIA': '🇸🇦',
      'THAILAND': '🇹🇭',
      'SINGAPORE': '🇸🇬',
      'MALAYSIA': '🇲🇾',
      'INDONESIA': '🇮🇩',
      'PHILIPPINES': '🇵🇭',
      'VIETNAM': '🇻🇳',
      'ARGENTINA': '🇦🇷',
      'CHILE': '🇨🇱',
      'COLOMBIA': '🇨🇴',
      'PERU': '🇵🇪',
      'VENEZUELA': '🇻🇪',
      'UKRAINE': '🇺🇦',
      'ROMANIA': '🇷🇴',
      'CZECH REPUBLIC': '🇨🇿', 'CZECHIA': '🇨🇿',
      'HUNGARY': '🇭🇺',
      'AUSTRIA': '🇦🇹',
      'BELGIUM': '🇧🇪',
      'IRELAND': '🇮🇪',
      'NEW ZEALAND': '🇳🇿',
      'KENYA': '🇰🇪',
      'GHANA': '🇬🇭',
      'MOROCCO': '🇲🇦',
      'LEBANON': '🇱🇧',
      'JORDAN': '🇯🇴',
      'KUWAIT': '🇰🇼',
      'QATAR': '🇶🇦',
      'BAHRAIN': '🇧🇭',
      'OMAN': '🇴🇲',

      // Country codes (for backwards compatibility)
      'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'ES': '🇪🇸', 'CN': '🇨🇳',
      'AU': '🇦🇺', 'FR': '🇫🇷', 'MX': '🇲🇽', 'KR': '🇰🇷', 'RU': '🇷🇺',
      'BR': '🇧🇷', 'AE': '🇦🇪', 'DE': '🇩🇪', 'IN': '🇮🇳', 'IT': '🇮🇹',
      'JP': '🇯🇵', 'NG': '🇳🇬', 'ZA': '🇿🇦', 'NL': '🇳🇱', 'CH': '🇨🇭',
      'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'PL': '🇵🇱',
      'PT': '🇵🇹', 'GR': '🇬🇷', 'TR': '🇹🇷', 'IL': '🇮🇱', 'EG': '🇪🇬',
      'SA': '🇸🇦', 'TH': '🇹🇭', 'SG': '🇸🇬', 'MY': '🇲🇾', 'ID': '🇮🇩',
      'PH': '🇵🇭', 'VN': '🇻🇳', 'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴',
      'PE': '🇵🇪', 'VE': '🇻🇪', 'UA': '🇺🇦', 'RO': '🇷🇴', 'CZ': '🇨🇿',
      'HU': '🇭🇺', 'AT': '🇦🇹', 'BE': '🇧🇪', 'IE': '🇮🇪', 'NZ': '🇳🇿',
      'KE': '🇰🇪', 'GH': '🇬🇭', 'MA': '🇲🇦', 'LB': '🇱🇧', 'JO': '🇯🇴',
      'KW': '🇰🇼', 'QA': '🇶🇦', 'BH': '🇧🇭', 'OM': '🇴🇲'
    }

    return countryFlags[countryUpper] || '🌍'
  }

  // Helper function to get language from country
  const getLanguage = (country?: string) => {
    switch (country) {
      case 'US': case 'CA': return 'EN'
      case 'ES': return 'ES'
      case 'FR': return 'FR'
      case 'DE': return 'DE'
      default: return 'EN'
    }
  }

  // Sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Modal handlers
  const handleAddCustomer = async (customerData: any) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) {
        throw new Error('Failed to create customer')
      }

      const result = await response.json()

      if (result.success) {
        await fetchCustomerData() // Refresh the customers list
        setIsAddModalOpen(false)
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      throw error
    }
  }

  const handleEditCustomer = async (customerData: any) => {
    if (!editingCustomer) return

    try {
      const response = await fetch(`/api/customers?id=${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) {
        throw new Error('Failed to update customer')
      }

      const result = await response.json()

      if (result.success) {
        await fetchCustomerData() // Refresh the customers list
        setIsEditModalOpen(false)
        setEditingCustomer(null)
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsEditModalOpen(true)
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete customer')
      }

      const result = await response.json()

      if (result.success) {
        await fetchCustomerData() // Refresh the customers list
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Failed to delete customer. Please try again.')
    }
  }

  // Helper function to format "last seen" time
  const formatLastSeen = (lastSeen?: Date) => {
    if (!lastSeen) return 'Never'

    const now = new Date()
    const diff = now.getTime() - lastSeen.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return 'Now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`

    // Always show days for anything older than 24 hours
    return `${days}d`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted/20 rounded"></div>
          <div className="h-12 bg-muted/20 rounded"></div>
          <div className="bg-muted/10 rounded-2xl p-6" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-6 bg-muted/20 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 xxs:space-y-1 xs:space-y-3 sm:space-y-6 p-1 xxs:p-1 xs:p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
            Customer Management
          </h1>
          <p className="text-white/60 text-sm sm:text-base mt-1">Manage your customer database</p>
        </div>

        {/* Mobile Controls - Shows on mobile only */}
        <div className="lg:hidden space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Total Customers Count */}
            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white min-w-0 flex-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black flex-shrink-0">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              <span className="text-black text-sm font-bold whitespace-nowrap">
                {filteredCustomers.length} Customer{filteredCustomers.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Import/Export/Add Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 flex-1" style={{
              background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(253, 198, 0, 0.3)',
              color: '#080708',
              boxShadow: '0 4px 16px rgba(253, 198, 0, 0.3)'
            }}>
              <ImportIcon size={16} className="h-4 w-4 flex-shrink-0" />
              <span>Import</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 flex-1" style={{
              background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(253, 198, 0, 0.3)',
              color: '#080708',
              boxShadow: '0 4px 16px rgba(253, 198, 0, 0.3)'
            }}>
              <ExportIcon size={16} className="h-4 w-4 flex-shrink-0" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 flex-1" style={{
              background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(253, 198, 0, 0.3)',
              color: '#080708',
              boxShadow: '0 4px 16px rgba(253, 198, 0, 0.3)'
            }}>
              <PlusIcon size={16} className="h-4 w-4 flex-shrink-0" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Updates & Debug Panel */}
      <div className="mb-4 space-y-3" style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${liveUpdatesEnabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-sm font-medium text-foreground">
                Live Updates: {liveUpdatesEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiveUpdatesEnabled(!liveUpdatesEnabled)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300"
              style={{
                background: liveUpdatesEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                border: `1px solid ${liveUpdatesEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
                color: liveUpdatesEnabled ? '#22c55e' : '#6b7280'
              }}
            >
              {liveUpdatesEnabled ? 'Disable' : 'Enable'} Live Updates
            </button>

            <button
              onClick={handleManualRefresh}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300"
              style={{
                background: 'rgba(253, 198, 0, 0.2)',
                border: '1px solid rgba(253, 198, 0, 0.3)',
                color: '#fdc700'
              }}
            >
              🔄 Refresh Now
            </button>
          </div>
        </div>

        {/* Debug Information */}
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            🔍 Debug Information ({debugInfo.length} messages)
          </summary>
          <div className="mt-2 max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg" style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {debugInfo.map((info, index) => (
              <div key={index} className="text-xs font-mono text-muted-foreground">
                {info}
              </div>
            ))}
            {debugInfo.length === 0 && (
              <div className="text-xs text-muted-foreground italic">No debug information yet...</div>
            )}
          </div>
        </details>
      </div>

      {/* Search Bar and Desktop Controls */}
      <div className="space-y-4 lg:space-y-0">
        {/* Desktop Layout - All on one row */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center space-x-3 flex-1 max-w-md">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base"
            />
          </div>

          {/* Right-aligned Controls */}
          <div className="flex items-center gap-4">
            {/* Total Customers Count */}
            <div className="flex items-center justify-center gap-2 px-4 rounded-xl bg-white h-[52px] min-w-[140px] flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black flex-shrink-0">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              <span className="text-black text-sm font-bold whitespace-nowrap">
                {filteredCustomers.length} Customer{filteredCustomers.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 backdrop-blur-sm">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  viewMode === 'cards' ? 'text-black' : 'text-white/60 hover:text-white/80'
                }`}
                style={{
                  background: viewMode === 'cards'
                    ? 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))'
                    : 'transparent'
                }}
                title="Cards view"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 18h17v-6H4v6zM4 5v6h17V5H4z"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  viewMode === 'table' ? 'text-black' : 'text-white/60 hover:text-white/80'
                }`}
                style={{
                  background: viewMode === 'table'
                    ? 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))'
                    : 'transparent'
                }}
                title="Table view"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h18c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm0 2v3h18V5H3zm0 5v3h8v-3H3zm10 0v3h8v-3h-8zm-10 5v3h8v-3H3zm10 0v3h8v-3h-8z"/>
                </svg>
              </button>
            </div>

            {/* Add Customer Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 h-[52px]"
              style={{
                background: 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(253, 198, 0, 0.3)',
                boxShadow: '0 8px 32px rgba(253, 198, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                color: '#0a0a0a'
              }}
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden bg-white/10 border border-white/20 rounded-xl p-4 flex items-center space-x-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base"
          />
        </div>

        {/* Selected Customers Actions - Mobile Only */}
        {selectedCustomers.size > 0 && (
          <div className="lg:hidden flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground text-center xs:text-left">
              {selectedCustomers.size} selected
            </span>
            <button
              onClick={deleteSelectedCustomers}
              className="px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2" style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--foreground)'
            }}>
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Delete Selected</span>
              <span className="xs:hidden">Delete</span>
            </button>
          </div>
        )}
      </div>

      {effectiveViewMode === 'table' ? (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar mobile-table">
            <table className="w-full min-w-max touch-manipulation">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.size === currentCustomers.length && currentCustomers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCustomers(new Set(currentCustomers.map(c => c.id)))
                      } else {
                        setSelectedCustomers(new Set())
                      }
                    }}
                    className="w-4 h-4 rounded border-2 accent-primary"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-12">#</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[200px]">Click ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    FULL NAME
                    <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[200px]">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    EMAIL
                    <SortIcon field="email" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[140px]">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('phone')}
                  >
                    PHONE
                    <SortIcon field="phone" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[140px]">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('source')}
                  >
                    TRAFFIC SOURCE
                    <SortIcon field="source" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[150px]">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('campaign')}
                  >
                    CAMPAIGN
                    <SortIcon field="campaign" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[120px]">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('ip')}
                  >
                    IP ADDRESS
                    <SortIcon field="ip" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[160px]">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('location')}
                  >
                    LOCATION
                    <SortIcon field="location" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[80px]">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('language')}
                  >
                    LANGUAGE
                    <SortIcon field="language" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[250px]">USER AGENT</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[130px]">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('timestamp')}
                  >
                    TIMESTAMP
                    <SortIcon field="timestamp" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[120px]">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('verification')}
                  >
                    VERIFICATIONS
                    <SortIcon field="verification" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[200px]">
                  <button
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    onClick={() => handleSort('landing')}
                  >
                    LANDING PAGE
                    <SortIcon field="landing" sortField={sortField} sortDirection={sortDirection} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[100px]">ACTIONS</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'transparent' }}>
              {currentCustomers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                  onClick={() => navigateToCustomer(customer.id)}
                >
                  <td className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        const newSelected = new Set(selectedCustomers)
                        if (e.target.checked) {
                          newSelected.add(customer.id)
                        } else {
                          newSelected.delete(customer.id)
                        }
                        setSelectedCustomers(newSelected)
                      }}
                      className="w-4 h-4 rounded border-2 accent-primary"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      }}
                    />
                  </td>
                  <td className="px-6 py-3 text-sm text-muted-foreground font-medium w-12">
                    {(currentPage - 1) * customersPerPage + index + 1}
                  </td>
                  <td className="px-6 py-3 w-[200px]">
                    <span className="text-sm font-mono text-yellow-400 px-2 py-1 rounded inline-block" style={{
                      background: 'rgba(253, 198, 0, 0.1)',
                      border: '1px solid rgba(253, 198, 0, 0.3)'
                    }} title={customer.identifiers?.find(id => id.type === 'CLICK_ID' && id.isPrimary)?.value ||
                             customer.identifiers?.find(id => id.type === 'CLICK_ID')?.value || 'N/A'}>
                      {customer.identifiers?.find(id => id.type === 'CLICK_ID' && id.isPrimary)?.value ||
                       customer.identifiers?.find(id => id.type === 'CLICK_ID')?.value || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        firstName={customer.firstName}
                        lastName={customer.lastName}
                        userId={customer.id}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const fullName = `${customer.firstName} ${customer.lastName}`
                            const shouldTruncate = fullName.length > 40
                            return shouldTruncate ? (
                              <span className="text-sm font-semibold text-foreground truncate max-w-[120px] inline-block whitespace-nowrap" title={fullName}>{fullName}</span>
                            ) : (
                              <span className="text-sm font-semibold text-foreground whitespace-nowrap">{fullName}</span>
                            )
                          })()}
                          <span className="text-sm text-muted-foreground whitespace-nowrap">({formatLastSeen(customer.lastSeen)})</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground whitespace-nowrap">{customer.masterEmail}</span>
                      {customer.identifiers?.some(i => i.type === 'EMAIL' && i.isVerified) ? (
                        <CheckIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <XIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 w-[140px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground whitespace-nowrap">{customer.masterPhone || 'N/A'}</span>
                      {customer.identifiers?.some(i => i.type === 'PHONE' && i.isVerified) ? (
                        <CheckIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <XIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 w-[140px]">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-primary whitespace-nowrap"
                      style={{
                        background: 'rgba(253, 198, 0, 0.1)',
                        border: '1px solid rgba(253, 198, 0, 0.2)'
                      }}
                    >
                      {customer.leads?.[0]?.source || customer.clicks?.[0]?.source || customer.source || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-3 w-[150px]">
                    <span className="text-sm text-foreground truncate max-w-[110px] inline-block" title={customer.leads?.[0]?.campaign || customer.clicks?.[0]?.campaign || 'N/A'}>
                      {customer.leads?.[0]?.campaign || customer.clicks?.[0]?.campaign || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-3 w-[120px]">
                    <span className="text-sm font-mono text-green-400 px-2 py-1 rounded whitespace-nowrap" style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)'
                    }}>
                      {customer.leads?.[0]?.ip || customer.clicks?.[0]?.ip || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-3 w-[160px]">
                    <div className="text-sm text-foreground flex items-center gap-2">
                      <span className="text-lg flex-shrink-0">{getCountryFlag(customer.country)}</span>
                      <span className="truncate max-w-[110px] inline-block" title={`${customer.city}, ${customer.country}`}>{customer.city}, {customer.country}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 w-[80px]">
                    <span className="text-sm text-foreground truncate max-w-[60px] inline-block" title={getLanguage(customer.country)}>
                      {getLanguage(customer.country)}
                    </span>
                  </td>
                  <td className="px-6 py-3 w-[250px]">
                    <div className="text-xs text-muted-foreground truncate max-w-[210px] inline-block" title={customer.leads?.[0]?.userAgent || customer.clicks?.[0]?.userAgent}>
                      {customer.leads?.[0]?.userAgent || customer.clicks?.[0]?.userAgent || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-3 w-[130px]">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(customer.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-3 w-[120px]">
                    <div className="space-y-1 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Age:</span>
                        {(customer.leads?.[0]?.customFields as any)?.ageVerification ? (
                          <CheckIcon className="w-3 h-3 text-green-400 flex-shrink-0" />
                        ) : (
                          <XIcon className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Promo:</span>
                        {(customer.leads?.[0]?.customFields as any)?.promoConsent ? (
                          <CheckIcon className="w-3 h-3 text-green-400 flex-shrink-0" />
                        ) : (
                          <XIcon className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 w-[200px]">
                    <div className="text-xs text-muted-foreground truncate max-w-[160px] inline-block" title={customer.leads?.[0]?.landingPage || customer.clicks?.[0]?.landingPage}>
                      {customer.leads?.[0]?.landingPage || customer.clicks?.[0]?.landingPage || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-3 w-[100px]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(customer)
                        }}
                        className="p-2 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          customer.isRealData && handleDeleteCustomer(customer.id)
                        }}
                        disabled={!customer.isRealData}
                        className="p-2 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        /* Cards View */
        <div className="grid gap-2 xxs:gap-1 xs:gap-2 sm:gap-4 lg:gap-6 touch-manipulation safe-area-inset" style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))'
        }}>
          {currentCustomers.map((customer, index) =>
            isSmallScreen ? (
              /* Compact Card for Small Screens */
              <div
                key={customer.id}
                className="rounded-xl p-4 transition-all duration-300 cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
                onClick={() => navigateToCustomer(customer.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Compact Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar
                      firstName={customer.firstName}
                      lastName={customer.lastName}
                      userId={customer.id}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate" style={{ color: 'white !important' }}>
                        {customer.firstName} {customer.lastName}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {customer.masterEmail}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedCustomers.has(customer.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedCustomers)
                      if (e.target.checked) {
                        newSelected.add(customer.id)
                      } else {
                        newSelected.delete(customer.id)
                      }
                      setSelectedCustomers(newSelected)
                    }}
                    className="w-4 h-4 rounded border-2 accent-primary flex-shrink-0"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  />
                </div>

                {/* Compact Info */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Location</span>
                    <div className="flex items-center gap-1.5 max-w-[120px]">
                      <span className="text-sm">{getCountryFlag(customer.country)}</span>
                      <span className="truncate" style={{ color: 'white !important' }}>
                        {customer.city}, {customer.country}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Source</span>
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-primary truncate max-w-[100px]"
                      style={{
                        background: 'rgba(253, 198, 0, 0.1)',
                        border: '1px solid rgba(253, 198, 0, 0.2)'
                      }}
                      title={customer.leads?.[0]?.source || customer.clicks?.[0]?.source || customer.source || 'N/A'}
                    >
                      {customer.leads?.[0]?.source || customer.clicks?.[0]?.source || customer.source || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last seen</span>
                    <span className="text-foreground truncate max-w-[120px]">
                      {formatLastSeen(customer.lastSeen)}
                    </span>
                  </div>
                </div>

                {/* Compact Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-muted-foreground">
                    #{(currentPage - 1) * customersPerPage + index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(customer)
                      }}
                      className="p-1.5 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        customer.isRealData && handleDeleteCustomer(customer.id)
                      }}
                      disabled={!customer.isRealData}
                      className="p-1.5 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Card for Large Screens */
            <div
              key={customer.id}
              className="rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 transition-all duration-300 cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
              onClick={() => navigateToCustomer(customer.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Card Header with Avatar and Name */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      firstName={customer.firstName}
                      lastName={customer.lastName}
                      userId={customer.id}
                      size="md"
                      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate" style={{ color: 'white !important' }}>
                      {customer.firstName} {customer.lastName}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate font-mono">
                      {customer.identifiers?.find(id => id.type === 'CLICK_ID' && id.isPrimary)?.value ||
                       customer.identifiers?.find(id => id.type === 'CLICK_ID')?.value || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.has(customer.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedCustomers)
                      if (e.target.checked) {
                        newSelected.add(customer.id)
                      } else {
                        newSelected.delete(customer.id)
                      }
                      setSelectedCustomers(newSelected)
                    }}
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 accent-primary"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider flex-shrink-0">Email</span>
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 justify-end">
                    <span className="text-xs sm:text-sm text-foreground truncate max-w-[100px] sm:max-w-[120px] lg:max-w-[150px]" title={customer.masterEmail}>
                      {customer.masterEmail}
                    </span>
                    {customer.identifiers?.some(i => i.type === 'EMAIL' && i.isVerified) ? (
                      <CheckIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400 flex-shrink-0" />
                    ) : (
                      <XIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 flex-shrink-0" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider flex-shrink-0">Phone</span>
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 justify-end">
                    <span className="text-xs sm:text-sm text-foreground truncate max-w-[100px] sm:max-w-[120px]">
                      {customer.masterPhone || 'N/A'}
                    </span>
                    {customer.identifiers?.some(i => i.type === 'PHONE' && i.isVerified) ? (
                      <CheckIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400 flex-shrink-0" />
                    ) : (
                      <XIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 flex-shrink-0" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider flex-shrink-0">Location</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{getCountryFlag(customer.country)}</span>
                    <span className="text-xs sm:text-sm truncate text-right" style={{ color: 'white !important' }}>
                      {customer.city}, {customer.country}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider flex-shrink-0">Source</span>
                  <span
                    className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium text-primary truncate max-w-[80px] sm:max-w-[100px]"
                    style={{
                      background: 'rgba(253, 198, 0, 0.1)',
                      border: '1px solid rgba(253, 198, 0, 0.2)'
                    }}
                    title={customer.leads?.[0]?.source || customer.clicks?.[0]?.source || customer.source || 'N/A'}
                  >
                    {customer.leads?.[0]?.source || customer.clicks?.[0]?.source || customer.source || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Campaign and Traffic Info */}
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground flex-shrink-0">Campaign</span>
                  <span className="text-xs text-foreground font-medium truncate text-right max-w-[100px] sm:max-w-[120px]" title={customer.leads?.[0]?.campaign || customer.clicks?.[0]?.campaign}>
                    {customer.leads?.[0]?.campaign || customer.clicks?.[0]?.campaign || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground flex-shrink-0">IP Address</span>
                  <span className="text-xs font-mono text-green-400 truncate">
                    {customer.leads?.[0]?.ip || customer.clicks?.[0]?.ip || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground flex-shrink-0">Language</span>
                  <span className="text-xs text-foreground">
                    {getLanguage(customer.country)}
                  </span>
                </div>
              </div>

              {/* Verification Status */}
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground flex-shrink-0">Age Verified</span>
                  {(customer.leads?.[0]?.customFields as any)?.ageVerification ? (
                    <div className="flex items-center gap-1">
                      <CheckIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400 flex-shrink-0" />
                      <span className="text-xs text-green-400">Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <XIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 flex-shrink-0" />
                      <span className="text-xs text-red-400">No</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground flex-shrink-0">Promo Consent</span>
                  {(customer.leads?.[0]?.customFields as any)?.promoConsent ? (
                    <div className="flex items-center gap-1">
                      <CheckIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400 flex-shrink-0" />
                      <span className="text-xs text-green-400">Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <XIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 flex-shrink-0" />
                      <span className="text-xs text-red-400">No</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Seen */}
              <div className="mb-3 sm:mb-4 p-2 rounded-lg text-center" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span className="text-xs text-muted-foreground block">Last seen</span>
                <span className="text-xs sm:text-sm text-foreground font-medium break-all">
                  {formatLastSeen(customer.lastSeen)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-white/10 gap-2">
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  #{(currentPage - 1) * customersPerPage + index + 1}
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(customer)
                    }}
                    className="p-1 sm:p-1.5 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      customer.isRealData && handleDeleteCustomer(customer.id)
                    }}
                    disabled={!customer.isRealData}
                    className="p-1 sm:p-1.5 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                </div>
              </div>
            </div>
            )
          )}
        </div>
      )}

      {/* Pagination (shared between both views) */}
      <div className="mt-6 sm:mt-8">
        <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6" style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left order-2 sm:order-1">
              Showing {Math.min(customersPerPage, currentCustomers.length)} of {filteredCustomers.length} customers
            </p>

            <div className="flex items-center flex-wrap justify-center gap-1 sm:gap-2 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <span className="hidden xs:inline">Previous</span>
                <span className="xs:hidden">Prev</span>
              </button>

              {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (currentPage <= 3) {
                  pageNumber = index + 1;
                } else if (currentPage > totalPages - 3) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = currentPage - 2 + index;
                }

                const isActive = currentPage === pageNumber;

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-200 font-medium ${
                      isActive ? 'text-black' : 'text-foreground'
                    }`}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(253, 198, 0, 0.9), rgba(253, 198, 0, 0.7))'
                        : 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: `1px solid ${isActive ? 'rgba(253, 198, 0, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
                      boxShadow: isActive ? '0 4px 16px rgba(253, 198, 0, 0.3)' : 'none'
                    }}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      <CustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddCustomer}
        title="Add New Customer"
      />

      {/* Edit Customer Modal */}
      <CustomerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingCustomer(null)
        }}
        onSave={handleEditCustomer}
        customer={editingCustomer}
        title="Edit Customer"
      />
    </div>
  )
}