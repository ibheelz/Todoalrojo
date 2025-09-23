'use client'

import React, { useState, useRef, useEffect } from 'react'

interface ConversionType {
  id: string
  name: string
  description: string
}

interface InfluencerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (influencerData: any) => void
  onDelete?: (influencerId: string) => void
  editMode?: any // Influencer data for editing
}

export default function InfluencerModal({ isOpen, onClose, onSubmit, onDelete, editMode }: InfluencerModalProps) {
  const [formData, setFormData] = useState({
    name: editMode?.name || '',
    email: editMode?.email || '',
    phone: editMode?.phone || '',
    socialHandle: editMode?.socialHandle || '',
    platform: editMode?.platform || 'instagram',
    followers: editMode?.followers || '',
    engagementRate: editMode?.engagementRate || '',
    category: editMode?.category || '',
    location: editMode?.location || '',
    commissionRate: editMode?.commissionRate || '',
    paymentMethod: editMode?.paymentMethod || 'bank_transfer',
    paymentDetails: editMode?.paymentDetails || {},
    notes: editMode?.notes || ''
  })

  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(editMode?.profileImage || null)
  const [nameValidationError, setNameValidationError] = useState<string | null>(null)
  const [existingInfluencers, setExistingInfluencers] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Campaign assignment
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; slug: string; isActive?: boolean }>>([])
  const [assignedCampaignIds, setAssignedCampaignIds] = useState<string[]>(editMode?.assignedCampaigns || [])

  // Conversion Types Management
  const [conversionTypes, setConversionTypes] = useState<ConversionType[]>([])
  const [newConversionType, setNewConversionType] = useState({
    name: '',
    description: ''
  })

  // For existing influencers, track which conversion types are enabled
  const [conversionConfig, setConversionConfig] = useState({
    leads: true,
    clicks: true,
    registrations: true,
    ftd: true
  })

  // Fetch existing influencers for validation
  React.useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        console.log('📊 [INFLUENCER MODAL] Fetching existing influencers...')

        const response = await fetch('/api/influencers')
        const result = await response.json()

        if (result.success) {
          const influencerNames = result.influencers.map((inf: any) => inf.name.toLowerCase())
          setExistingInfluencers(influencerNames)
          console.log('✅ [INFLUENCER MODAL] Loaded influencers:', influencerNames.length)
        }
      } catch (error) {
        console.error('❌ [INFLUENCER MODAL] Failed to fetch influencers:', error)
      }
    }
    if (isOpen) {
      fetchInfluencers()
      // Fetch active campaigns for dropdown
      ;(async () => {
        try {
          const res = await fetch('/api/campaigns')
          const data = await res.json()
          if (data?.success) {
            const active = data.campaigns.filter((c: any) => c.isActive)
            setCampaigns(active)
          }
        } catch (e) {
          console.error('[INFLUENCER MODAL] Failed to load campaigns', e)
        }
      })()
    }
  }, [isOpen])

  // Update form data when editMode changes
  React.useEffect(() => {
    if (editMode) {
      setFormData({
        name: editMode.name || '',
        email: editMode.email || '',
        phone: editMode.phone || '',
        socialHandle: editMode.socialHandle || '',
        platform: editMode.platform || 'instagram',
        followers: editMode.followers?.toString() || '',
        engagementRate: editMode.engagementRate?.toString() || '',
        category: editMode.category || '',
        location: editMode.location || '',
        commissionRate: editMode.commissionRate?.toString() || '',
        paymentMethod: editMode.paymentMethod || 'bank_transfer',
        paymentDetails: editMode.paymentDetails || {},
        notes: editMode.notes || ''
      })
      // If there's an existing profile image, set it as preview
      if (editMode.profileImage) {
        setImagePreview(editMode.profileImage)
      }

      // Initialize conversion types for existing influencer
      if (editMode.conversionTypes) {
        setConversionTypes(editMode.conversionTypes)
      }

      // Initialize conversion config for existing influencer
      if (editMode.conversionConfig) {
        setConversionConfig(editMode.conversionConfig)
      }

      // Initialize assigned campaigns
      if (Array.isArray(editMode.assignedCampaigns)) {
        setAssignedCampaignIds(editMode.assignedCampaigns)
      }
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        socialHandle: '',
        platform: 'instagram',
        followers: '',
        engagementRate: '',
        category: '',
        location: '',
        commissionRate: '',
        paymentMethod: 'bank_transfer',
        paymentDetails: {},
        notes: ''
      })
      // Reset image states for new influencer
      setProfileImage(null)
      setImagePreview(null)
      setNameValidationError(null)

      // Reset conversion types and config for new influencer
      setConversionTypes([])
      setConversionConfig({
        leads: true,
        clicks: true,
        registrations: true,
        ftd: true
      })
      setAssignedCampaignIds([])
    }
  }, [editMode])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Validate influencer name for duplicates
    if (field === 'name') {
      const normalizedName = value.toLowerCase().trim()
      const isDuplicate = existingInfluencers.includes(normalizedName) &&
        (!editMode || editMode.name.toLowerCase() !== normalizedName)

      if (isDuplicate) {
        setNameValidationError('Influencer name already exists. Please choose a different name.')
      } else {
        setNameValidationError(null)
      }
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        return
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return
      }

      setProfileImage(file)

      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server (if you have an upload endpoint)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.success) {
          // Update preview with server URL
          setImagePreview(result.url)
          console.log('Profile image uploaded successfully:', result.url)
        } else {
          console.error('Upload failed:', result.error)
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }
  }

  // Conversion Types Management Functions
  const addConversionType = () => {
    if (newConversionType.name.trim()) {
      const newType: ConversionType = {
        id: Date.now().toString(),
        name: newConversionType.name.trim(),
        description: newConversionType.description.trim()
      }
      setConversionTypes(prev => [...prev, newType])
      setNewConversionType({ name: '', description: '' })
    }
  }

  const removeConversionType = (id: string) => {
    setConversionTypes(prev => prev.filter(type => type.id !== id))
  }

  // Toggle conversion type configuration for existing influencers
  const toggleConversionType = (type: 'leads' | 'clicks' | 'registrations' | 'ftd') => {
    setConversionConfig(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate profile image first
    if (!profileImage && !imagePreview) {
      setNameValidationError('Profile image is required')
      return
    }

    // Validate required fields (only name is required)
    if (!formData.name.trim()) {
      setNameValidationError('Name is required')
      return
    }

    // Validate influencer name
    if (nameValidationError) {
      return
    }

    const influencerData = {
      ...formData,
      followers: formData.followers ? parseInt(formData.followers) : null,
      engagementRate: formData.engagementRate ? parseFloat(formData.engagementRate) : null,
      commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : null,
      profileImage: imagePreview,
      profileImageFile: profileImage,
      conversionTypes: conversionTypes,
      // For existing influencers, include conversion type configuration
      ...(editMode && {
        conversionConfig: conversionConfig
      }),
      assignedCampaignIds
    }

    console.log('📊 [INFLUENCER MODAL] Submitting influencer:', {
      name: influencerData.name,
      platform: influencerData.platform,
      socialHandle: influencerData.socialHandle,
      editMode: !!editMode
    })

    onSubmit(influencerData)
    onClose()
  }

  const handleDelete = () => {
    if (editMode && onDelete) {
      onDelete(editMode.id)
      onClose()
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

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Header - Fixed */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10" style={{
          background: '#0f0f0f',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile image"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-yellow-400/20 rounded-xl flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-yellow-400">{editMode ? 'Edit Influencer' : 'Add New Influencer'}</h2>
                <p className="text-sm text-white/60 mt-1">{editMode ? 'Update influencer details' : 'Add a new influencer to your network'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-yellow-400 hover:bg-yellow-300 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0"
              title="Close modal"
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

            {/* Profile Image Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
                </svg>
                <span>Profile Image</span>
                <span className="text-red-400 ml-1">*</span>
              </h3>

              <div
                className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all duration-300"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="max-h-24 max-w-full object-contain rounded-lg"
                        style={{
                          display: 'block',
                          margin: '0 auto'
                        }}
                      />
                    </div>
                    <p className="text-sm text-white/60">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/60">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/80 font-medium">Upload Profile Image</p>
                      <p className="text-sm text-white/60">JPEG, PNG, GIF • Max 5MB</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Full Name</span>
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 ${
                      nameValidationError ? 'focus:ring-red-500 border-red-500' : 'focus:ring-primary/50'
                    }`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: nameValidationError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="Enter influencer name"
                    required
                  />
                  {nameValidationError && (
                    <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      <span>{nameValidationError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>Phone</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Social Media</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                    <span>Platform</span>
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => handleInputChange('platform', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitch">Twitch</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                    </svg>
                    <span>Social Handle</span>
                  </label>
                  <input
                    type="text"
                    value={formData.socialHandle}
                    onChange={(e) => handleInputChange('socialHandle', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>Followers</span>
                  </label>
                  <input
                    type="number"
                    value={formData.followers}
                    onChange={(e) => handleInputChange('followers', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                    </svg>
                    <span>Engagement Rate (%)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.engagementRate}
                    onChange={(e) => handleInputChange('engagementRate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="5.25"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Additional Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M19 7.5v3a6 6 0 1 1-12 0v-3"/>
                      <path d="M12 1.5C8 1.5 8 5.5 8 7.5s0 6 4 6 4-4 4-6S16 1.5 12 1.5z"/>
                    </svg>
                    <span>Category</span>
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="e.g., Fashion, Tech, Lifestyle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <span>Commission Rate (%)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commissionRate}
                    onChange={(e) => handleInputChange('commissionRate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="10.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <rect x="1" y="3" width="15" height="13"/>
                      <path d="M16 8l2-2 2 2"/>
                      <path d="M18 6v12"/>
                    </svg>
                    <span>Payment Method</span>
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <span>Notes</span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="Additional notes about this influencer..."
                  />
                </div>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
                <span>Analytics Dashboard</span>
              </h3>

              {editMode ? (
                /* Existing Influencer - Show conversion type configuration */
                <div className="space-y-3">
                  <p className="text-sm text-white/60 mb-4">
                    Manage analytics data for this influencer. Disabled types will not appear in cards.
                  </p>

                  {/* Available conversion types to add */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white/80">Available Analytics Types</h4>
                    {[
                      { key: 'leads', label: 'Leads', description: 'Total number of leads generated' },
                      { key: 'clicks', label: 'Clicks', description: 'Total number of clicks tracked' },
                      { key: 'registrations', label: 'Registrations', description: 'User registrations from campaigns' },
                      { key: 'ftd', label: 'FTD', description: 'First Time Deposits' }
                    ].filter(({ key }) => !conversionConfig[key as keyof typeof conversionConfig]).map(({ key, label, description }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-white">{label}</div>
                          <div className="text-sm text-white/60">{description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleConversionType(key as 'leads' | 'clicks' | 'registrations' | 'ftd')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Active conversion types */}
                  {[
                    { key: 'leads', label: 'Leads', description: 'Total number of leads generated' },
                    { key: 'clicks', label: 'Clicks', description: 'Total number of clicks tracked' },
                    { key: 'registrations', label: 'Registrations', description: 'User registrations from campaigns' },
                    { key: 'ftd', label: 'FTD', description: 'First Time Deposits' }
                  ].filter(({ key }) => conversionConfig[key as keyof typeof conversionConfig]).length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h4 className="text-sm font-medium text-white/80">Active Analytics Types</h4>
                      {[
                        { key: 'leads', label: 'Leads', description: 'Total number of leads generated' },
                        { key: 'clicks', label: 'Clicks', description: 'Total number of clicks tracked' },
                        { key: 'registrations', label: 'Registrations', description: 'User registrations from campaigns' },
                        { key: 'ftd', label: 'FTD', description: 'First Time Deposits' }
                      ].filter(({ key }) => conversionConfig[key as keyof typeof conversionConfig]).map(({ key, label, description }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-4 rounded-xl"
                          style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-white flex items-center space-x-2">
                              <span>{label}</span>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="text-sm text-white/60">{description}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleConversionType(key as 'leads' | 'clicks' | 'registrations' | 'ftd')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* New Influencer - Show conversion type builder */
                <>
                  {/* Existing Custom Conversion Types */}
                  <div className="space-y-3">
                    {conversionTypes.map((type) => (
                      <div
                        key={type.id}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-white">{type.name}</div>
                          <div className="text-sm text-white/60">{type.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeConversionType(type.id)}
                          className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center text-white transition-all duration-300"
                          title="Delete conversion type"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add new custom conversion type */}
                  <div className="space-y-3 p-4 rounded-xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center space-x-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span>Add Custom Analytics Type</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newConversionType.name}
                        onChange={(e) => setNewConversionType(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3 py-2 rounded-lg text-white placeholder-white/50 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)'
                        }}
                        placeholder="Type name *"
                      />
                      <input
                        type="text"
                        value={newConversionType.description}
                        onChange={(e) => setNewConversionType(prev => ({ ...prev, description: e.target.value }))}
                        className="px-3 py-2 rounded-lg text-white placeholder-white/50 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)'
                        }}
                        placeholder="Description (optional)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addConversionType}
                      disabled={!newConversionType.name.trim()}
                      className="w-full px-4 py-2 rounded-lg bg-primary text-black font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Analytics Type
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="sticky bottom-0 z-10 px-6 py-4 border-t border-white/10" style={{
          background: '#0f0f0f',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            {editMode ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-300 text-sm flex items-center space-x-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                <span>Delete</span>
              </button>
            ) : (
              <div></div>
            )}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white transition-all duration-300 text-sm font-medium flex items-center space-x-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-all duration-300 text-sm shadow-lg flex items-center space-x-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>{editMode ? 'Update Influencer' : 'Add Influencer'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

export { InfluencerModal }
            {/* Campaign Assignment */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                  <path d="M3 7h18M3 12h18M3 17h18"/>
                </svg>
                Assign Campaigns
              </h3>
              <p className="text-sm text-white/60">Select active campaigns to link this influencer. Clicks, leads and FTDs from their links will roll up to these campaigns.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {campaigns.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-yellow-400"
                      checked={assignedCampaignIds.includes(c.id)}
                      onChange={(e) => {
                        setAssignedCampaignIds((prev) =>
                          e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                        )
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-medium">{c.name}</span>
                      <span className="text-white/50 text-xs">{c.slug}</span>
                    </div>
                  </label>
                ))}
                {campaigns.length === 0 && (
                  <div className="text-white/60 text-sm">No active campaigns found.</div>
                )}
              </div>
            </div>
