'use client'

import React from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface JourneyStep {
  id: string
  type: 'CLICK' | 'LEAD' | 'EVENT'
  eventType?: string
  timestamp: string
  title: string
  description: string
  data: any
  metadata: {
    icon: string
    color: string
  }
}

interface JourneyTimelineProps {
  steps: JourneyStep[]
  className?: string
}

const getColorClasses = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    pink: 'bg-pink-100 text-pink-800 border-pink-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200'
  }
  return colorMap[color] || colorMap.gray
}

export function JourneyTimeline({ steps, className = '' }: JourneyTimelineProps) {
  if (!steps || steps.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No journey data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🗺️ Customer Journey Timeline
          <Badge variant="secondary">{steps.length} steps</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {steps.map((step, index) => (
            <div key={step.id} className="relative flex items-start mb-6 last:mb-0">
              {/* Timeline dot */}
              <div className={`
                relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 text-lg
                ${getColorClasses(step.metadata.color)}
              `}>
                {step.metadata.icon}
              </div>

              {/* Content */}
              <div className="ml-4 flex-1">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {step.type}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        {format(new Date(step.timestamp), 'MMM dd, HH:mm:ss')}
                      </p>
                    </div>
                  </div>

                  {/* Step details */}
                  <div className="mt-3 space-y-2">
                    {step.type === 'CLICK' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {step.data.campaign && (
                          <div><span className="font-medium">Campaign:</span> {step.data.campaign}</div>
                        )}
                        {step.data.source && (
                          <div><span className="font-medium">Source:</span> {step.data.source}</div>
                        )}
                        {step.data.medium && (
                          <div><span className="font-medium">Medium:</span> {step.data.medium}</div>
                        )}
                        {step.data.clickId && (
                          <div><span className="font-medium">Click ID:</span> {step.data.clickId}</div>
                        )}
                        {step.data.country && (
                          <div><span className="font-medium">Location:</span> {step.data.country}</div>
                        )}
                        {step.data.device && (
                          <div><span className="font-medium">Device:</span> {step.data.device}</div>
                        )}
                      </div>
                    )}

                    {step.type === 'LEAD' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {step.data.email && (
                          <div><span className="font-medium">Email:</span> {step.data.email}</div>
                        )}
                        {step.data.phone && (
                          <div><span className="font-medium">Phone:</span> {step.data.phone}</div>
                        )}
                        {step.data.campaign && (
                          <div><span className="font-medium">Campaign:</span> {step.data.campaign}</div>
                        )}
                        {step.data.source && (
                          <div><span className="font-medium">Source:</span> {step.data.source}</div>
                        )}
                        <div>
                          <span className="font-medium">Email Verified:</span>
                          {step.data.isEmailVerified ? ' ✅ Yes' : ' ❌ No'}
                        </div>
                        <div>
                          <span className="font-medium">Phone Verified:</span>
                          {step.data.isPhoneVerified ? ' ✅ Yes' : ' ❌ No'}
                        </div>
                      </div>
                    )}

                    {step.type === 'EVENT' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {step.data.value && (
                          <div>
                            <span className="font-medium">Value:</span>
                            {step.data.value} {step.data.currency || 'USD'}
                          </div>
                        )}
                        {step.data.campaign && (
                          <div><span className="font-medium">Campaign:</span> {step.data.campaign}</div>
                        )}
                        {step.data.source && (
                          <div><span className="font-medium">Source:</span> {step.data.source}</div>
                        )}
                        {step.data.conversionId && (
                          <div><span className="font-medium">Conversion ID:</span> {step.data.conversionId}</div>
                        )}
                        {step.data.isConverted && (
                          <div className="text-green-600 font-medium">💰 Conversion Event</div>
                        )}
                        {step.data.redtrackSent && (
                          <div className="text-blue-600 font-medium">📡 RedTrack Notified</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Additional properties */}
                  {step.data.properties && Object.keys(step.data.properties).length > 0 && (
                    <details className="mt-3">
                      <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                        Additional Details
                      </summary>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(step.data.properties, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}