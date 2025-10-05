'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail, MessageSquare, Users, TrendingUp, Clock,
  Play, Pause, RefreshCw, Search, Calendar, CheckCircle,
  XCircle, AlertCircle, Send, Zap, Target, Gift, Sparkles,
  ArrowRight, Activity
} from 'lucide-react'

interface JourneyStat {
  totalJourneys: number
  activeJourneys: number
  stageDistribution: { stage: number; count: number }[]
  messageStats: { status: string; channel: string; count: number }[]
}

interface JourneyState {
  id: string
  customerId: string
  operatorId: string
  stage: number
  depositCount: number
  totalDepositValue: string
  emailCount: number
  smsCount: number
  lastEmailAt: string | null
  lastSmsAt: string | null
  unsubEmail: boolean
  unsubSms: boolean
  unsubGlobal: boolean
  currentJourney: string | null
  journeyStartedAt: string | null
  customer: {
    id: string
    masterEmail: string | null
    masterPhone: string | null
    firstName: string | null
    lastName: string | null
  }
  journeyMessages: any[]
}

export default function JourneyAutomationPage() {
  const [stats, setStats] = useState<JourneyStat | null>(null)
  const [messageStatus, setMessageStatus] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
    loadMessageStatus()
  }, [])

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

  const handleProcessMessages = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/journey/process-messages', {
        method: 'POST'
      })
      const data = await response.json()
      alert(`Processed ${data.sent} messages (${data.failed} failed)`)
      await loadMessageStatus()
      await loadStats()
    } catch (error) {
      console.error('Failed to process messages:', error)
      alert('Failed to process messages')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    window.location.href = `/dashboard/customers?search=${encodeURIComponent(searchQuery)}`
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
        <Button
          onClick={handleProcessMessages}
          disabled={isProcessing}
          className="bg-primary hover:bg-primary/90 text-black font-bold shadow-lg"
          size="lg"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? 'Processing...' : 'Process Messages'}
        </Button>
      </div>

      {/* Stats Overview - Premium Cards */}
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

      {/* Journey Types - Premium Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Acquisition Journey */}
        <div className="premium-card hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
          {/* Gradient Background */}
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
          {/* Gradient Background */}
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
                      {/* Progress bar */}
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
          {/* Email Stats */}
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

          {/* SMS Stats */}
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
              onClick={loadStats}
              className="justify-start font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
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
            Journey automation will start automatically when new leads are captured or operator events are received.
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
            onClick={() => window.location.href = '/dashboard/leads'}
            className="bg-primary hover:bg-primary/90 text-black font-bold"
            size="lg"
          >
            View Leads
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
