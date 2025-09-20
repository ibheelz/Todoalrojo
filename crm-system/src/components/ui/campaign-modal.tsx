'use client'

import React, { useState, useRef } from 'react'

interface ConversionType {
  id: string
  name: string
  description: string
}

interface CampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (campaignData: any) => void
  onDelete?: (campaignId: string) => void
  editMode?: any // Campaign data for editing
}

export default function CampaignModal({ isOpen, onClose, onSubmit, onDelete, editMode }: CampaignModalProps) {
  const [formData, setFormData] = useState({
    name: editMode?.name || '',
    slug: editMode?.slug || '',
    clientId: editMode?.clientId || '',
    brandId: editMode?.brandId || ''
  })

  const [conversionTypes, setConversionTypes] = useState<ConversionType[]>([
    { id: '1', name: 'Registration', description: 'User signs up' },
    { id: '2', name: 'Purchase', description: 'User makes a purchase' }
  ])

  const [newConversionType, setNewConversionType] = useState({
    name: '',
    description: ''
  })

  const [brandLogo, setBrandLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update form data when editMode changes
  React.useEffect(() => {
    if (editMode) {
      setFormData({
        name: editMode.name || '',
        slug: editMode.slug || '',
        clientId: editMode.clientId || '',
        brandId: editMode.brandId || ''
      })
      // If there's an existing logo URL in editMode, set it as preview
      if (editMode.logoUrl) {
        setLogoPreview(editMode.logoUrl)
      }
    } else {
      setFormData({
        name: '',
        slug: '',
        clientId: '',
        brandId: ''
      })
      // Reset logo states for new campaign
      setBrandLogo(null)
      setLogoPreview(null)
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

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      setFormData(prev => ({
        ...prev,
        slug
      }))
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setBrandLogo(file)

      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
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
          setLogoPreview(result.url)
          console.log('Logo uploaded successfully:', result.url)
        } else {
          console.error('Upload failed:', result.error)
          alert('Failed to upload logo: ' + result.error)
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload logo')
      }
    }
  }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const campaignData = {
      ...formData,
      conversionTypes,
      brandLogo,
      logoUrl: logoPreview // Include the current logo URL
    }

    onSubmit(campaignData)
    onClose()
  }

  const handleDelete = () => {
    if (editMode && onDelete) {
      if (window.confirm(`Are you sure you want to delete the campaign "${editMode.name}"? This action cannot be undone.`)) {
        onDelete(editMode.id)
        onClose()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed top-0 bottom-0 right-0 z-[25] flex items-center justify-center p-4"
      style={{
        left: window.innerWidth >= 1024 ? '320px' : '64px'
      }}
    >

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: -1
        }}
        onClick={onClose}
      />

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
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Brand logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-yellow-400/20 rounded-xl flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-yellow-400">{editMode ? 'Edit Campaign' : 'Create New Campaign'}</h2>
                <p className="text-sm text-white/60 mt-1">{editMode ? 'Update your campaign settings' : 'Set up your marketing campaign'}</p>
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

            {/* Campaign Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Campaign Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <span>Campaign Name</span>
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="Enter campaign name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <span>Campaign Slug</span>
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    placeholder="campaign-slug"
                    required
                  />
                </div>
              </div>


            </div>

            {/* Brand Logo Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
                </svg>
                <span>Brand Logo</span>
              </h3>

              <div
                className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all duration-300"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <div className="space-y-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="mx-auto max-h-24 rounded-lg"
                    />
                    <p className="text-sm text-white/60">Click to change logo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/60">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/80 font-medium">Upload Brand Logo</p>
                      <p className="text-sm text-white/60">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Conversion Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
                <span>Conversion Types</span>
              </h3>

              {/* Existing Conversion Types */}
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

              {/* Add New Conversion Type */}
              <div className="space-y-3 p-4 rounded-xl" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <h4 className="text-sm font-medium text-white/80 flex items-center space-x-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  <span>Add New Conversion Type</span>
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
                  Add Conversion Type
                </button>
              </div>
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
                <span>{editMode ? 'Update Campaign' : 'Create Campaign'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}