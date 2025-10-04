import React from 'react'

interface FileIconProps {
  type: 'PNG' | 'JPG' | 'PDF' | 'DOC' | 'XLS' | 'CSV' | 'JSON' | 'ZIP'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-10',
  md: 'w-12 h-15',
  lg: 'w-16 h-20',
  xl: 'w-24 h-30'
}

const typeColors = {
  PNG: 'from-primary to-primary/80',
  JPG: 'from-primary to-primary/80',
  PDF: 'from-red-500 to-red-600',
  DOC: 'from-blue-500 to-blue-600',
  XLS: 'from-green-500 to-green-600',
  CSV: 'from-emerald-500 to-emerald-600',
  JSON: 'from-purple-500 to-purple-600',
  ZIP: 'from-orange-500 to-orange-600'
}

export const FileIcon = ({ type, size = 'md', className = '' }: FileIconProps) => {
  const sizeClass = sizeClasses[size]
  const colorClass = typeColors[type]

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      {/* Main document shape */}
      <div className="absolute inset-0 bg-gray-100 rounded-t-lg rounded-br-lg">
        {/* Folded corner */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-gray-300 transform rotate-45 origin-bottom-left translate-x-1.5 -translate-y-1.5 rounded-sm"></div>

        {/* Preview window with brand colors */}
        <div className="absolute top-2 left-2 right-2 h-6 rounded-md overflow-hidden">
          <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
            {/* Magnifying glass icon */}
            <div className="w-3 h-3 border border-black/40 rounded-full relative">
              <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-black/40 rounded-full transform rotate-45"></div>
            </div>
          </div>
        </div>

        {/* File type label */}
        <div className="absolute bottom-1 left-0 right-0 text-center">
          <span className="text-xs font-black text-gray-600 tracking-wide">
            {type}
          </span>
        </div>
      </div>
    </div>
  )
}

// Specific branded PNG icon component
export const PNGIcon = ({ size = 'lg', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) => {
  const sizeStyles = {
    sm: { width: '32px', height: '40px' },
    md: { width: '48px', height: '60px' },
    lg: { width: '64px', height: '80px' },
    xl: { width: '96px', height: '120px' }
  }

  const currentSize = sizeStyles[size]

  return (
    <div
      className={`relative ${className}`}
      style={currentSize}
    >
      {/* Main document */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 64 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Document body with subtle shadow */}
        <path
          d="M8 4C8 1.79086 9.79086 0 12 0H44L60 16V76C60 78.2091 58.2091 80 56 80H12C9.79086 80 8 78.2091 8 76V4Z"
          fill="#FFFFFF"
          stroke="#D1D5DB"
          strokeWidth="1"
        />

        {/* Folded corner with gradient */}
        <path
          d="M44 0L60 16H48C45.7909 16 44 14.2091 44 12V0Z"
          fill="#E5E7EB"
        />

        {/* Brand colored preview area with rounded corners */}
        <rect
          x="12"
          y="12"
          width="40"
          height="32"
          rx="6"
          fill="#FDC600"
        />

        {/* Ocean scene background */}
        <rect
          x="14"
          y="14"
          width="36"
          height="28"
          rx="4"
          fill="#4F90CD"
        />

        {/* Clouds */}
        <circle cx="20" cy="20" r="3" fill="white" opacity="0.8"/>
        <circle cx="25" cy="18" r="2.5" fill="white" opacity="0.8"/>
        <circle cx="30" cy="19" r="2" fill="white" opacity="0.8"/>

        {/* Water waves */}
        <path
          d="M14 35 Q20 32 26 35 T38 35 Q44 32 50 35 V42 H14 Z"
          fill="#2563EB"
          opacity="0.7"
        />

        {/* Rocks/islands */}
        <ellipse cx="22" cy="38" rx="3" ry="2" fill="#6B7280"/>
        <ellipse cx="35" cy="39" rx="2.5" ry="1.5" fill="#6B7280"/>

        {/* Magnifying glass with better positioning */}
        <g transform="translate(38, 28)">
          <circle
            cx="4"
            cy="4"
            r="3"
            stroke="#080708"
            strokeWidth="2"
            fill="rgba(255,255,255,0.9)"
          />
          <line
            x1="6.2"
            y1="6.2"
            x2="8"
            y2="8"
            stroke="#080708"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* PNG label with better styling */}
        <text
          x="34"
          y="68"
          textAnchor="middle"
          fill="#4B5563"
          fontSize="10"
          fontWeight="700"
          fontFamily="Oxanium"
        >
          PNG
        </text>
      </svg>
    </div>
  )
}

// Export icon component
export const ExportIcon = ({ size = 20, className = '' }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#000000" className={className}>
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
  </svg>
)