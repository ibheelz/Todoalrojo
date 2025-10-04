'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  firstName?: string
  lastName?: string
  userId?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ firstName, lastName, userId, size = 'md', className }: AvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')

  // Generate initials fallback
  const getInitials = () => {
    const first = (firstName || '').charAt(0).toUpperCase()
    const last = (lastName || '').charAt(0).toUpperCase()
    return first + last || '?'
  }

  // Generate avatar using server-side proxy to avoid CORS issues
  useEffect(() => {
    if (!firstName && !lastName && !userId) return

    const seed = userId || `${firstName || ''}-${lastName || ''}`.toLowerCase().replace(/\s+/g, '-')
    const sizeMap = { sm: 32, md: 40, lg: 48 }
    const avatarSize = sizeMap[size]

    // Use our server-side avatar proxy instead of direct DiceBear calls
    const url = `/api/avatar?seed=${encodeURIComponent(seed)}&size=${avatarSize}`

    // Load avatar through our proxy
    const img = new Image()

    const timeout = setTimeout(() => {
      console.log('Avatar timeout for seed:', seed)
      setImageError(true)
    }, 10000) // 10 second timeout for server-side proxy

    img.onload = () => {
      console.log('Avatar loaded successfully for seed:', seed)
      clearTimeout(timeout)
      setImageUrl(url)
      setImageLoaded(true)
      setImageError(false)
    }

    img.onerror = (e) => {
      console.log('Avatar error for seed:', seed, e)
      clearTimeout(timeout)
      setImageError(true)
    }

    // Start loading immediately
    setImageError(false)
    setImageLoaded(false)
    img.src = url

    return () => {
      clearTimeout(timeout)
    }
  }, [firstName, lastName, userId, size])

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  // Generate consistent background color based on initials
  const getBackgroundColor = () => {
    const initials = getInitials()
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
    ]
    const colorIndex = initials.charCodeAt(0) % colors.length
    return colors[colorIndex]
  }

  // Show DiceBear image if loaded, otherwise show initials or loading
  if (imageLoaded && imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={`${firstName || ''} ${lastName || ''}`.trim() || 'User avatar'}
        className={cn(
          'rounded-full ring-2 ring-white/10 object-cover',
          sizeClasses[size],
          className
        )}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    )
  }

  // Show loading state briefly before falling back to initials
  const isLoading = !imageError && !imageLoaded && (firstName || lastName || userId)

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white/10',
        sizeClasses[size],
        isLoading ? 'bg-gray-600' : getBackgroundColor(),
        className
      )}
    >
      {isLoading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        getInitials()
      )}
    </div>
  )
}