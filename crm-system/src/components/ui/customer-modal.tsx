'use client'

import { useState, useEffect } from 'react'
import { X, Save, User, Mail, Phone, MapPin, Globe, Tag, MousePointer, BarChart3, Wifi, Monitor, CheckCircle, ExternalLink } from 'lucide-react'

interface CustomerFormData {
  firstName: string
  lastName: string
  masterEmail: string
  masterPhone: string
  source: string
  country: string
  region: string
  language: string
  clickId: string
  campaign: string
  ip: string
  userAgent: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  landingPage: string
}

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CustomerFormData) => Promise<void>
  customer?: Partial<CustomerFormData> & {
    firstName?: string
    lastName?: string
  }
  title: string
  isLoading?: boolean
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'RU', name: 'Russia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'AE', name: 'United Arab Emirates' },
]


const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Other'
]

export default function CustomerModal({
  isOpen,
  onClose,
  onSave,
  customer,
  title,
  isLoading = false
}: CustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    masterEmail: '',
    masterPhone: '',
    source: '',
    country: '',
    region: '',
    language: '',
    clickId: '',
    campaign: '',
    ip: '',
    userAgent: '',
    isEmailVerified: false,
    isPhoneVerified: false,
    landingPage: ''
  })

  const [errors, setErrors] = useState<Partial<CustomerFormData>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        masterEmail: customer.masterEmail || '',
        masterPhone: customer.masterPhone || '',
        source: customer.source || '',
        country: customer.country || '',
        region: customer.region || '',
        language: customer.language || '',
        clickId: customer.clickId || '',
        campaign: customer.campaign || '',
        ip: customer.ip || '',
        userAgent: customer.userAgent || '',
        isEmailVerified: customer.isEmailVerified || false,
        isPhoneVerified: customer.isPhoneVerified || false,
        landingPage: customer.landingPage || ''
      })
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        masterEmail: '',
        masterPhone: '',
        source: '',
        country: '',
        region: '',
        language: '',
        clickId: '',
        campaign: '',
        ip: '',
        userAgent: '',
        isEmailVerified: false,
        isPhoneVerified: false,
        landingPage: ''
      })
    }
    setErrors({})
  }, [customer, isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: Partial<CustomerFormData> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.masterEmail.trim()) {
      newErrors.masterEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.masterEmail)) {
      newErrors.masterEmail = 'Invalid email format'
    }
    if (formData.masterPhone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.masterPhone)) {
      newErrors.masterPhone = 'Invalid phone format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving customer:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof CustomerFormData, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Full Screen Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[24]"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="fixed top-0 bottom-0 right-0 z-[25] flex items-center justify-center p-4 left-16 lg:left-80"
      >
      {/* Mobile Modal (lg and below) */}
      <div className="lg:hidden w-full">
        <div
          className="w-full transform transition-transform duration-300 ease-out rounded-3xl flex flex-col max-h-[90vh]"
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Header - Fixed */}
          <div className="sticky top-0 z-10 flex-shrink-0 flex items-center justify-between p-1.5 xs:p-2 sm:p-3 border-b border-white/10" style={{
            background: '#0f0f0f',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div className="flex items-center gap-1.5 xs:gap-2 overflow-hidden">
              <div className="p-1 xs:p-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex-shrink-0">
                <User className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-yellow-400" />
              </div>
              <h2 className="text-xs xs:text-sm sm:text-base font-bold text-white truncate">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-yellow-400 hover:bg-yellow-300 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0"
              title="Close modal"
              disabled={saving}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Mobile Form - Scrollable */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
            <form id="mobile-customer-form" onSubmit={handleSubmit} className="p-6 space-y-6 pb-16">
            <div className="space-y-4 xs:space-y-5 sm:space-y-6">
              {/* Personal Information */}
              <div className="space-y-3 xs:space-y-4 pb-5 xs:pb-6 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400" />
                  <h3 className="text-base xs:text-lg font-semibold text-yellow-400">Personal Information</h3>
                </div>

                <div className="space-y-3 xs:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    <div>
                      <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                        <User className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        placeholder="Enter first name"
                        disabled={saving}
                      />
                      {errors.firstName && (
                        <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                        <User className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        placeholder="Enter last name"
                        disabled={saving}
                      />
                      {errors.lastName && (
                        <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                      <Mail className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.masterEmail}
                      onChange={(e) => handleInputChange('masterEmail', e.target.value)}
                      className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter email address"
                      disabled={saving}
                    />
                    {errors.masterEmail && (
                      <p className="text-red-400 text-xs mt-1">{errors.masterEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                      <Phone className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.masterPhone}
                      onChange={(e) => handleInputChange('masterPhone', e.target.value)}
                      className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="+1234567890"
                      disabled={saving}
                    />
                    {errors.masterPhone && (
                      <p className="text-red-400 text-xs mt-1">{errors.masterPhone}</p>
                    )}
                  </div>



                </div>
              </div>

              {/* Location & Details */}
              <div className="space-y-3 xs:space-y-4 pb-5 xs:pb-6 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400" />
                  <h3 className="text-base xs:text-lg font-semibold text-yellow-400">Location & Details</h3>
                </div>

                <div>
                  <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    disabled={saving}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code} style={{ background: '#1f2937' }}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    Region/State
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    placeholder="Enter region/state"
                    disabled={saving}
                  />
                </div>


                <div>
                  <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                    <Globe className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    disabled={saving}
                  >
                    <option value="">Select language</option>
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang} style={{ background: '#1f2937' }}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>


                <div>
                  <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                    <Tag className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    Traffic Source
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    placeholder="Enter traffic source"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Technical & Tracking */}
              <div className="space-y-3 xs:space-y-4 pb-5 xs:pb-6 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400" />
                  <h3 className="text-base xs:text-lg font-semibold text-yellow-400">Technical & Tracking</h3>
                </div>

                <div>
                  <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                    <MousePointer className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    Click ID
                  </label>
                  <input
                    type="text"
                    value={formData.clickId}
                    onChange={(e) => handleInputChange('clickId', e.target.value)}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    placeholder="Enter click ID"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                    <BarChart3 className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    Campaign
                  </label>
                  <input
                    type="text"
                    value={formData.campaign}
                    onChange={(e) => handleInputChange('campaign', e.target.value)}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    placeholder="Enter campaign name"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                    <Wifi className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={formData.ip}
                    onChange={(e) => handleInputChange('ip', e.target.value)}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    placeholder="Enter IP address"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                    <Monitor className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    User Agent
                  </label>
                  <textarea
                    value={formData.userAgent}
                    onChange={(e) => handleInputChange('userAgent', e.target.value)}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 resize-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    placeholder="Enter user agent string"
                    rows={2}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm xs:text-base font-medium text-gray-300 mb-2">
                    <ExternalLink className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    Landing Page
                  </label>
                  <input
                    type="text"
                    value={formData.landingPage}
                    onChange={(e) => handleInputChange('landingPage', e.target.value)}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    placeholder="Enter landing page URL"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Verifications */}
              <div className="space-y-3 xs:space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400" />
                  <h3 className="text-base xs:text-lg font-semibold text-yellow-400">Verifications</h3>
                </div>

                <div className="flex items-center justify-between p-3 xs:p-4 rounded-lg" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <label className="flex items-center text-sm xs:text-base font-medium text-gray-300">
                    <Mail className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    Email Verified
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.isEmailVerified}
                    onChange={(e) => handleInputChange('isEmailVerified', e.target.checked)}
                    className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400 bg-transparent border-gray-300 rounded focus:ring-yellow-400"
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between p-3 xs:p-4 rounded-lg" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <label className="flex items-center text-sm xs:text-base font-medium text-gray-300">
                    <Phone className="w-4 h-4 xs:w-5 xs:h-5 inline mr-2 text-yellow-400" />
                    Phone Verified
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.isPhoneVerified}
                    onChange={(e) => handleInputChange('isPhoneVerified', e.target.checked)}
                    className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400 bg-transparent border-gray-300 rounded focus:ring-yellow-400"
                    disabled={saving}
                  />
                </div>
              </div>

            </div>
            </form>
          </div>

          {/* Mobile Footer - Fixed */}
          <div
            className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10"
            style={{
              background: '#0f0f0f',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white transition-all duration-300 text-sm font-medium flex items-center space-x-2"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
              disabled={saving}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              form="mobile-customer-form"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-all duration-300 text-sm shadow-lg flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <span>Save Customer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Modal (lg and above) */}
      <div className="hidden lg:block w-full max-w-5xl">
        <div
          className="relative w-full max-h-[90vh] overflow-hidden rounded-3xl"
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Desktop Header */}
          <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10" style={{
            background: '#0f0f0f',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-yellow-400/20 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">{title}</h2>
                  <p className="text-sm text-white/60 mt-1">Manage customer information</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-yellow-400 hover:bg-yellow-300 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0"
                title="Close modal"
                disabled={saving}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
            <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 xl:gap-6">
                {/* Column 1: Personal Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-base font-semibold text-yellow-400">Personal Info</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <User className="w-3 h-3 inline mr-1 text-yellow-400" />
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter first name"
                      disabled={saving}
                    />
                    {errors.firstName && (
                      <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <User className="w-3 h-3 inline mr-1 text-yellow-400" />
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter last name"
                      disabled={saving}
                    />
                    {errors.lastName && (
                      <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <Mail className="w-3 h-3 inline mr-1 text-yellow-400" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.masterEmail}
                      onChange={(e) => handleInputChange('masterEmail', e.target.value)}
                      className="w-full px-3 py-2 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter email address"
                      disabled={saving}
                    />
                    {errors.masterEmail && (
                      <p className="text-red-400 text-xs mt-1">{errors.masterEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <Phone className="w-3 h-3 inline mr-1 text-yellow-400" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.masterPhone}
                      onChange={(e) => handleInputChange('masterPhone', e.target.value)}
                      className="w-full px-3 py-2 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="+1234567890"
                      disabled={saving}
                    />
                    {errors.masterPhone && (
                      <p className="text-red-400 text-xs mt-1">{errors.masterPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <Tag className="w-3 h-3 inline mr-1 text-yellow-400" />
                      Traffic Source
                    </label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      className="w-full px-3 py-2 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter traffic source"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Column 2: Location & Campaign */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-base font-semibold text-yellow-400">Location & Campaign</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <MapPin className="w-3 h-3 inline mr-1 text-yellow-400" />
                      Country
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 text-white rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      disabled={saving}
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map(country => (
                        <option key={country.code} value={country.code} style={{ background: '#1f2937' }}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <MapPin className="w-3 h-3 inline mr-1 text-yellow-400" />
                      Region/State
                    </label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      className="w-full px-3 py-2 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter region/state"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <Globe className="w-3 h-3 inline mr-1 text-yellow-400" />
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-3 py-2 text-white rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      disabled={saving}
                    >
                      <option value="">Select language</option>
                      {LANGUAGES.map(lang => (
                        <option key={lang} value={lang} style={{ background: '#1f2937' }}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <BarChart3 className="w-3 h-3 inline mr-1 text-yellow-400" />
                      Campaign
                    </label>
                    <input
                      type="text"
                      value={formData.campaign}
                      onChange={(e) => handleInputChange('campaign', e.target.value)}
                      className="w-full px-3 py-2 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter campaign name"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Column 3: Technical & Verifications */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Monitor className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-base font-semibold text-yellow-400">Technical Data</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <MousePointer className="w-3 h-3 inline mr-1 text-yellow-400" />
                      Click ID
                    </label>
                    <input
                      type="text"
                      value={formData.clickId}
                      onChange={(e) => handleInputChange('clickId', e.target.value)}
                      className="w-full px-3 py-2 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter click ID"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <Wifi className="w-3 h-3 inline mr-1 text-yellow-400" />
                      IP Address
                    </label>
                    <input
                      type="text"
                      value={formData.ip}
                      onChange={(e) => handleInputChange('ip', e.target.value)}
                      className="w-full px-3 py-2 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter IP address"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <ExternalLink className="w-3 h-3 inline mr-1 text-yellow-400" />
                      Landing Page
                    </label>
                    <input
                      type="text"
                      value={formData.landingPage}
                      onChange={(e) => handleInputChange('landingPage', e.target.value)}
                      className="w-full px-3 py-2 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter landing page URL"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <Monitor className="w-3 h-3 inline mr-1 text-yellow-400" />
                      User Agent
                    </label>
                    <textarea
                      value={formData.userAgent}
                      onChange={(e) => handleInputChange('userAgent', e.target.value)}
                      className="w-full px-3 py-1 text-white placeholder-gray-400 rounded-lg transition-all duration-300 focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      placeholder="Enter user agent string"
                      rows={2}
                      disabled={saving}
                    />
                  </div>

                  {/* Verifications */}
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-yellow-400" />
                      <h4 className="text-sm font-semibold text-yellow-400">Verifications</h4>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <label className="flex items-center text-xs font-medium text-gray-300">
                        <Mail className="w-3 h-3 inline mr-2 text-yellow-400" />
                        Email Verified
                      </label>
                      <input
                        type="checkbox"
                        checked={formData.isEmailVerified}
                        onChange={(e) => handleInputChange('isEmailVerified', e.target.checked)}
                        className="w-4 h-4 text-yellow-400 bg-transparent border-gray-300 rounded focus:ring-yellow-400"
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <label className="flex items-center text-xs font-medium text-gray-300">
                        <Phone className="w-3 h-3 inline mr-2 text-yellow-400" />
                        Phone Verified
                      </label>
                      <input
                        type="checkbox"
                        checked={formData.isPhoneVerified}
                        onChange={(e) => handleInputChange('isPhoneVerified', e.target.checked)}
                        className="w-4 h-4 text-yellow-400 bg-transparent border-gray-300 rounded focus:ring-yellow-400"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer - Fixed */}
          <div className="sticky bottom-0 z-10 px-6 py-4 border-t border-white/10" style={{
            background: '#0f0f0f',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white transition-all duration-300 text-sm font-medium flex items-center space-x-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
                disabled={saving}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-all duration-300 text-sm shadow-lg flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Save Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}