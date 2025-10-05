'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail, MessageSquare, Users, TrendingUp, Clock,
  Play, Pause, RefreshCw, Search, Calendar, CheckCircle,
  XCircle, AlertCircle, Send, Zap, Target, Gift, Sparkles,
  ArrowRight, Activity, Eye, Trash2, Database, TestTube, FileText,
  ExternalLink, Building2
} from 'lucide-react'

interface JourneyStat {
  totalJourneys: number
  activeJourneys: number
  stageDistribution: { stage: number; count: number }[]
  messageStats: { status: string; channel: string; count: number }[]
}

interface JourneyMessage {
  id: string
  messageType: string
  channel: string
  journeyType: string
  dayNumber: number
  stepNumber: number
  subject?: string
  content: string
  scheduledFor: string
  sentAt?: string
  status: string
  failedReason?: string
  journeyState: {
    customerId: string
    operatorId: string
    customer: {
      id: string
      masterEmail: string
      masterPhone: string
      firstName: string
      lastName: string
      createdAt?: string
      firstSeen?: string
      source?: string
      country?: string
      city?: string
    }
  }
  customerDetails?: {
    registrationDate: string
    firstSeen: string
    source?: string
    medium?: string
    campaign?: string
    clickId?: string
    landingPage?: string
    country?: string
    city?: string
    influencer?: {
      id: string
      name: string
      platform?: string
    }
    operator?: {
      name: string
      brand?: string
      slug: string
    }
  }
}

export default function JourneyAutomationPage() {
  const [stats, setStats] = useState<JourneyStat | null>(null)
  const [messageStatus, setMessageStatus] = useState<any>(null)
  const [messages, setMessages] = useState<JourneyMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<JourneyMessage | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [messageFilter, setMessageFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all')
  const [showMessageModal, setShowMessageModal] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    await Promise.all([
      loadStats(),
      loadMessageStatus(),
      loadMessages()
    ])
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/journey/state?action=stats', {
        method: 'PUT'
      })
      const data = await response.json()
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessageStatus = async () => {
    try {
      const response = await fetch('/api/journey/process-messages')
      const data = await response.json()
      setMessageStatus(data)
    } catch (error) {
      console.error('Failed to load message status:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/journey/messages')
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleProcessMessages = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/journey/process-messages', {
        method: 'POST'
      })
      const data = await response.json()

      const message = `✅ Message Processing Complete\n\n` +
        `📤 Sent: ${data.sent} messages\n` +
        `❌ Failed: ${data.failed} messages\n` +
        `⏭️ Skipped: ${data.skipped} messages`

      alert(message)
      await loadAll()
    } catch (error) {
      console.error('Failed to process messages:', error)
      alert('❌ Failed to process messages')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateTestData = async (type: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/journey/test-data?action=${type}`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        alert(`✅ Test Data Generated!\n\n${data.results.customers.length} customers created with journeys`)
        await loadAll()
      } else {
        alert(`❌ Failed: ${data.error}`)
      }
    } catch (error: any) {
      console.error('Failed to generate test data:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCleanTestData = async () => {
    if (!confirm('⚠️ This will delete ALL test data. Continue?')) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/journey/test-data?action=clean', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        const msg = `✅ Test Data Cleaned!\n\n` +
          `🗑️ Deleted:\n` +
          `- ${data.deleted.customers} customers\n` +
          `- ${data.deleted.states} journey states\n` +
          `- ${data.deleted.messages} messages\n` +
          `- ${data.deleted.identifiers} identifiers`
        alert(msg)
        await loadAll()
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    window.location.href = `/dashboard/customers?search=${encodeURIComponent(searchQuery)}`
  }

  const viewMessage = (message: JourneyMessage) => {
    setSelectedMessage(message)
    setShowMessageModal(true)
  }

  const getStageLabel = (stage: number) => {
    switch (stage) {
      case -1: return 'Not Registered'
      case 0: return 'Registered, No Deposit'
      case 1: return '1 Deposit'
      case 2: return '2 Deposits'
      default: return `${stage}+ Deposits (High Value)`
    }
  }

  const getStageColor = (stage: number) => {
    switch (stage) {
      case -1: return 'bg-slate-100 text-slate-700 border-slate-200'
      case 0: return 'bg-blue-100 text-blue-700 border-blue-200'
      case 1: return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 2: return 'bg-violet-100 text-violet-700 border-violet-200'
      default: return 'bg-amber-100 text-amber-700 border-amber-200'
    }
  }

  const getStageIcon = (stage: number) => {
    switch (stage) {
      case -1: return <Users className="h-4 w-4" />
      case 0: return <Target className="h-4 w-4" />
      case 1: return <Gift className="h-4 w-4" />
      case 2: return <Sparkles className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const filteredMessages = messages.filter(msg => {
    if (messageFilter === 'all') return true
    if (messageFilter === 'pending') return msg.status === 'PENDING' || msg.status === 'SCHEDULED'
    if (messageFilter === 'sent') return msg.status === 'SENT'
    if (messageFilter === 'failed') return msg.status === 'FAILED'
    return true
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-foreground mb-2">
            Journey Automation
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Automated email & SMS campaigns driving acquisition and retention
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/message-templates">
            <Button
              variant="outline"
              className="border-white/20 hover:bg-white/10"
            >
              <FileText className="h-4 w-4 mr-2" />
              Message Templates
            </Button>
          </Link>
          <Button
            onClick={handleProcessMessages}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90 text-black font-bold shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Processing...' : 'Process Messages'}
          </Button>
        </div>
      </div>

      {/* Test Data Controls */}
      <div className="premium-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-violet-500/10">
            <TestTube className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">Test Data Generator</h3>
            <p className="text-xs text-muted-foreground">Generate sample customers and journeys for testing</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Button
            onClick={() => handleGenerateTestData('full')}
            disabled={isGenerating}
            variant="outline"
            className="justify-start font-bold hover:bg-violet-500/10 hover:text-violet-500 hover:border-violet-500/30"
          >
            <Database className="h-4 w-4 mr-2" />
            Full Test Set
          </Button>
          <Button
            onClick={() => handleGenerateTestData('acquisition')}
            disabled={isGenerating}
            variant="outline"
            className="justify-start font-bold hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30"
          >
            <Target className="h-4 w-4 mr-2" />
            Acquisition Only
          </Button>
          <Button
            onClick={() => handleGenerateTestData('retention')}
            disabled={isGenerating}
            variant="outline"
            className="justify-start font-bold hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Retention Only
          </Button>
          <Button
            onClick={handleCleanTestData}
            disabled={isGenerating}
            variant="outline"
            className="justify-start font-bold hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clean Test Data
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Journeys */}
        <div className="premium-card group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <Activity className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Journeys
            </p>
            <p className="text-3xl font-black text-foreground">
              {isLoading ? '...' : stats?.totalJourneys || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Loading...' : `${stats?.activeJourneys || 0} active journeys`}
            </p>
          </div>
        </div>

        {/* Pending Messages */}
        <div className="premium-card group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Send className="h-6 w-6" />
            </div>
            <Clock className="h-5 w-5 text-muted-foreground/30 group-hover:text-blue-500/50 transition-colors" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pending Messages
            </p>
            <p className="text-3xl font-black text-foreground">
              {messageStatus?.pending || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Ready to send
            </p>
          </div>
        </div>

        {/* Sent Messages */}
        <div className="premium-card group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground/30 group-hover:text-emerald-500/50 transition-colors" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Sent Messages
            </p>
            <p className="text-3xl font-black text-emerald-500">
              {messageStatus?.sent || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </div>
        </div>

        {/* Failed Messages */}
        <div className="premium-card group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
              <XCircle className="h-6 w-6" />
            </div>
            <AlertCircle className="h-5 w-5 text-muted-foreground/30 group-hover:text-red-500/50 transition-colors" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Failed Messages
            </p>
            <p className="text-3xl font-black text-red-500">
              {messageStatus?.failed || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Delivery errors
            </p>
          </div>
        </div>
      </div>

      {/* Message History Table */}
      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-foreground">Message Queue & History</h3>
            <p className="text-xs text-muted-foreground mt-1">All scheduled and sent messages</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={messageFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMessageFilter('all')}
              className={messageFilter === 'all' ? 'bg-primary text-black' : ''}
            >
              All
            </Button>
            <Button
              variant={messageFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMessageFilter('pending')}
              className={messageFilter === 'pending' ? 'bg-blue-500 text-white' : ''}
            >
              Pending
            </Button>
            <Button
              variant={messageFilter === 'sent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMessageFilter('sent')}
              className={messageFilter === 'sent' ? 'bg-emerald-500 text-white' : ''}
            >
              Sent
            </Button>
            <Button
              variant={messageFilter === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMessageFilter('failed')}
              className={messageFilter === 'failed' ? 'bg-red-500 text-white' : ''}
            >
              Failed
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Channel</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Journey</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Day</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Scheduled</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No messages found. Generate test data to see messages.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr key={msg.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {msg.journeyState.customer.firstName} {msg.journeyState.customer.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {msg.channel === 'EMAIL' ? msg.journeyState.customer.masterEmail : msg.journeyState.customer.masterPhone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {msg.messageType.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {msg.channel === 'EMAIL' ? (
                          <Mail className="h-4 w-4 text-blue-500" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm font-medium">{msg.channel}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={msg.journeyType === 'ACQUISITION' ? 'border-blue-200 text-blue-700' : 'border-emerald-200 text-emerald-700'}>
                        {msg.journeyType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">Day {msg.dayNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-muted-foreground">{formatDate(msg.scheduledFor)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={
                          msg.status === 'SENT' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                          msg.status === 'FAILED' ? 'border-red-200 bg-red-50 text-red-700' :
                          'border-blue-200 bg-blue-50 text-blue-700'
                        }
                      >
                        {msg.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewMessage(msg)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Journey Types - Premium Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Acquisition Journey */}
        <div className="premium-card hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Acquisition Journey</h3>
                  <p className="text-xs text-muted-foreground">Convert leads to depositors</p>
                </div>
              </div>
              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                3 Emails + 2 SMS
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <p className="text-xs font-bold text-muted-foreground uppercase">Target Stages</p>
                </div>
                <p className="text-sm text-foreground font-medium">
                  Stage -1 (Not Registered) & Stage 0 (Registered, No Deposit)
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  7-Day Campaign Flow
                </p>
                <div className="space-y-2">
                  {[
                    { day: 'D+0', channel: 'EMAIL', label: 'Welcome & Offer Push', icon: Mail },
                    { day: 'D+1', channel: 'SMS', label: 'Urgent Bonus Reminder', icon: MessageSquare },
                    { day: 'D+3', channel: 'EMAIL', label: 'Social Proof & Benefits', icon: Mail },
                    { day: 'D+5', channel: 'SMS', label: 'Last Chance FTD', icon: MessageSquare },
                    { day: 'D+7', channel: 'EMAIL', label: 'Final Nudge', icon: Mail },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-1.5 rounded-lg ${step.channel === 'EMAIL' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        <step.icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">{step.label}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {step.day}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Retention Journey */}
        <div className="premium-card hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Retention Journey</h3>
                  <p className="text-xs text-muted-foreground">Drive repeat deposits</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                2 Emails + 1 SMS
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <p className="text-xs font-bold text-muted-foreground uppercase">Target Stages</p>
                </div>
                <p className="text-sm text-foreground font-medium">
                  Stage 1 (First Deposit) & Stage 2 (Second Deposit)
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  5-Day Campaign Flow
                </p>
                <div className="space-y-2">
                  {[
                    { day: 'D+1', channel: 'EMAIL', label: 'Reload Bonus Offer', icon: Mail },
                    { day: 'D+2', channel: 'SMS', label: 'Urgency Push', icon: MessageSquare },
                    { day: 'D+5', channel: 'EMAIL', label: 'VIP Exclusive Offer', icon: Mail },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-1.5 rounded-lg ${step.channel === 'EMAIL' ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'}`}>
                        <step.icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">{step.label}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {step.day}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Distribution */}
      {stats && stats.stageDistribution.length > 0 && (
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-foreground">User Lifecycle Stages</h3>
              <p className="text-xs text-muted-foreground mt-1">Distribution across journey stages</p>
            </div>
            <div className="p-2 rounded-xl bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            {stats.stageDistribution.map((item) => (
              <div key={item.stage} className="group hover:bg-muted/30 p-4 rounded-xl transition-all duration-300 border border-transparent hover:border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-muted/50">
                      {getStageIcon(item.stage)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`${getStageColor(item.stage)} border`}>
                          Stage {item.stage}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {getStageLabel(item.stage)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                          style={{
                            width: `${stats.totalJourneys > 0 ? (item.count / stats.totalJourneys * 100) : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 ml-4">
                    <span className="text-3xl font-black text-foreground">{item.count}</span>
                    <span className="text-sm text-muted-foreground font-medium">users</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Statistics */}
      {stats && stats.messageStats.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Mail className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Email Messages</h3>
                <p className="text-xs text-muted-foreground">Email campaign performance</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats.messageStats
                .filter((m) => m.channel === 'EMAIL')
                .map((msg) => (
                  <div key={msg.status + msg.channel} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        msg.status === 'SENT' ? 'bg-emerald-500' :
                        msg.status === 'FAILED' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`} />
                      <span className="text-sm font-medium text-foreground capitalize">
                        {msg.status.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-lg font-black text-foreground">{msg.count}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-green-500/10">
                <MessageSquare className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">SMS Messages</h3>
                <p className="text-xs text-muted-foreground">SMS campaign performance</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats.messageStats
                .filter((m) => m.channel === 'SMS')
                .map((msg) => (
                  <div key={msg.status + msg.channel} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        msg.status === 'SENT' ? 'bg-emerald-500' :
                        msg.status === 'FAILED' ? 'bg-red-500' :
                        'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium text-foreground capitalize">
                        {msg.status.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-lg font-black text-foreground">{msg.count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="premium-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">Search and navigate</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search by email, phone, or customer ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-background"
            />
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-black font-bold">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/customers'}
              className="justify-start font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            >
              <Users className="h-4 w-4 mr-2" />
              View All Customers
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/campaigns'}
              className="justify-start font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Campaigns
            </Button>
            <Button
              variant="outline"
              onClick={loadAll}
              className="justify-start font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {stats?.totalJourneys === 0 && (
        <div className="premium-card text-center py-12">
          <div className="inline-block p-6 rounded-full bg-primary/10 mb-6">
            <Mail className="h-16 w-16 text-primary" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-3">No Active Journeys Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Use the Test Data Generator above to create sample customers and journeys for testing.
          </p>

          <div className="inline-flex flex-col items-start gap-3 text-sm text-left bg-muted/30 p-6 rounded-xl max-w-md mx-auto mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span className="text-foreground">New leads captured via landing pages</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span className="text-foreground">Operator postbacks received (registration/deposits)</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span className="text-foreground">Manual journey start via API</span>
            </div>
          </div>

          <Button
            onClick={() => handleGenerateTestData('full')}
            className="bg-primary hover:bg-primary/90 text-black font-bold"
            size="lg"
          >
            Generate Test Data
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Message Preview Modal */}
      {showMessageModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMessageModal(false)}>
          <div className="premium-card max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {selectedMessage.channel === 'EMAIL' ? (
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Mail className="h-6 w-6 text-blue-500" />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <MessageSquare className="h-6 w-6 text-green-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-foreground">Message Preview</h3>
                  <p className="text-xs text-muted-foreground">{selectedMessage.channel} - {selectedMessage.messageType}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setShowMessageModal(false)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Customer Details Section */}
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4 rounded-lg border border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    Customer Details
                  </h4>
                  <Link
                    href={`/dashboard/customers/${selectedMessage.journeyState.customer.id}`}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                  >
                    View Profile
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Name</p>
                    <Link
                      href={`/dashboard/customers/${selectedMessage.journeyState.customer.id}`}
                      className="text-sm font-medium text-foreground hover:text-purple-400 transition-colors"
                    >
                      {selectedMessage.journeyState.customer.firstName} {selectedMessage.journeyState.customer.lastName}
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Contact</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMessage.channel === 'EMAIL'
                        ? selectedMessage.journeyState.customer.masterEmail
                        : selectedMessage.journeyState.customer.masterPhone}
                    </p>
                  </div>
                  {selectedMessage.customerDetails && (
                    <>
                      {selectedMessage.customerDetails.registrationDate && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Registered</p>
                          <p className="text-xs text-foreground">{formatDate(selectedMessage.customerDetails.registrationDate)}</p>
                        </div>
                      )}
                      {selectedMessage.customerDetails.country && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Location</p>
                          <p className="text-xs text-foreground">
                            {selectedMessage.customerDetails.city ? `${selectedMessage.customerDetails.city}, ` : ''}
                            {selectedMessage.customerDetails.country}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Campaign & Brand Details */}
              {selectedMessage.customerDetails && (selectedMessage.customerDetails.campaign || selectedMessage.customerDetails.operator) && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-400" />
                      Campaign & Brand
                    </h4>
                    {selectedMessage.customerDetails.operator && (
                      <Link
                        href={`/dashboard/brands/${selectedMessage.journeyState.operatorId}`}
                        className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors"
                      >
                        View Brand
                        <Building2 className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedMessage.customerDetails.campaign && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Campaign</p>
                        <Link
                          href={`/dashboard/campaigns?search=${selectedMessage.customerDetails.campaign}`}
                          className="text-sm font-medium text-foreground hover:text-green-400 transition-colors"
                        >
                          {selectedMessage.customerDetails.campaign}
                        </Link>
                      </div>
                    )}
                    {selectedMessage.customerDetails.operator && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Brand</p>
                        <Link
                          href={`/dashboard/brands/${selectedMessage.journeyState.operatorId}`}
                          className="text-sm font-medium text-foreground hover:text-green-400 transition-colors"
                        >
                          {selectedMessage.customerDetails.operator.brand || selectedMessage.customerDetails.operator.name}
                        </Link>
                      </div>
                    )}
                    {selectedMessage.customerDetails.source && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Source</p>
                        <p className="text-xs text-foreground">
                          {selectedMessage.customerDetails.source}
                          {selectedMessage.customerDetails.medium && ` / ${selectedMessage.customerDetails.medium}`}
                        </p>
                      </div>
                    )}
                    {selectedMessage.customerDetails.clickId && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Click ID</p>
                        <p className="text-xs text-foreground font-mono">{selectedMessage.customerDetails.clickId}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Influencer Details */}
              {selectedMessage.customerDetails?.influencer && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-400" />
                      Influencer Attribution
                    </h4>
                    <Link
                      href={`/dashboard/influencers/${selectedMessage.customerDetails.influencer.id}`}
                      className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition-colors"
                    >
                      View Influencer
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Influencer</p>
                      <Link
                        href={`/dashboard/influencers/${selectedMessage.customerDetails.influencer.id}`}
                        className="text-sm font-medium text-foreground hover:text-yellow-400 transition-colors"
                      >
                        {selectedMessage.customerDetails.influencer.name}
                      </Link>
                    </div>
                    {selectedMessage.customerDetails.influencer.platform && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Platform</p>
                        <p className="text-xs text-foreground capitalize">{selectedMessage.customerDetails.influencer.platform}</p>
                      </div>
                    )}
                  </div>
                  {selectedMessage.customerDetails.landingPage && (
                    <div className="mt-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Landing Page</p>
                      <p className="text-xs text-foreground break-all">{selectedMessage.customerDetails.landingPage}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Message Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Status</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedMessage.status === 'SENT' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                      selectedMessage.status === 'FAILED' ? 'border-red-200 bg-red-50 text-red-700' :
                      'border-blue-200 bg-blue-50 text-blue-700'
                    }
                  >
                    {selectedMessage.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Journey Type</p>
                  <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 capitalize">
                    {selectedMessage.journeyType}
                  </Badge>
                </div>
              </div>

              {selectedMessage.subject && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Subject</p>
                  <p className="text-sm font-medium text-foreground">{selectedMessage.subject}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Content</p>
                <div className="bg-muted/30 p-4 rounded-lg">
                  {selectedMessage.channel === 'EMAIL' ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedMessage.content }} className="text-sm" />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Scheduled For</p>
                  <p className="text-sm text-foreground">{formatDate(selectedMessage.scheduledFor)}</p>
                </div>
                {selectedMessage.sentAt && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Sent At</p>
                    <p className="text-sm text-foreground">{formatDate(selectedMessage.sentAt)}</p>
                  </div>
                )}
              </div>

              {selectedMessage.failedReason && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Failure Reason</p>
                  <p className="text-sm text-red-600">{selectedMessage.failedReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
