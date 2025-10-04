import { prisma } from './prisma'
import axios from 'axios'

export interface WebhookConfig {
  id: string
  name: string
  url: string
  secret: string
  events: WebhookEvent[]
  isActive: boolean
  retryAttempts: number
  timeout: number
  headers?: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

export type WebhookEvent =
  | 'lead.created'
  | 'lead.updated'
  | 'user.created'
  | 'user.merged'
  | 'event.created'
  | 'fraud.detected'
  | 'campaign.updated'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: any
  webhookId: string
  deliveryId: string
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: WebhookPayload
  status: 'pending' | 'success' | 'failed' | 'retrying'
  attempts: number
  lastAttempt?: Date
  response?: {
    status: number
    body: string
    headers: Record<string, string>
  }
  error?: string
  createdAt: Date
  updatedAt: Date
}

export class WebhookService {
  private static webhooks: Map<string, WebhookConfig> = new Map()

  static async registerWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebhookConfig> {
    const webhook: WebhookConfig = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.webhooks.set(webhook.id, webhook)

    // In production, this would be stored in the database
    console.log(`Webhook registered: ${webhook.name} - ${webhook.url}`)

    return webhook
  }

  static async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig | null> {
    const webhook = this.webhooks.get(id)
    if (!webhook) return null

    const updatedWebhook = {
      ...webhook,
      ...updates,
      updatedAt: new Date()
    }

    this.webhooks.set(id, updatedWebhook)
    return updatedWebhook
  }

  static async deleteWebhook(id: string): Promise<boolean> {
    return this.webhooks.delete(id)
  }

  static getWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values())
  }

  static getActiveWebhooksForEvent(event: WebhookEvent): WebhookConfig[] {
    return Array.from(this.webhooks.values())
      .filter(webhook => webhook.isActive && webhook.events.includes(event))
  }

  static async triggerWebhooks(event: WebhookEvent, data: any): Promise<void> {
    const activeWebhooks = this.getActiveWebhooksForEvent(event)

    if (activeWebhooks.length === 0) {
      console.log(`No active webhooks for event: ${event}`)
      return
    }

    console.log(`Triggering ${activeWebhooks.length} webhooks for event: ${event}`)

    // Process webhooks in parallel
    const deliveryPromises = activeWebhooks.map(webhook =>
      this.deliverWebhook(webhook, event, data)
    )

    await Promise.allSettled(deliveryPromises)
  }

  private static async deliverWebhook(
    webhook: WebhookConfig,
    event: WebhookEvent,
    data: any
  ): Promise<WebhookDelivery> {
    const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      webhookId: webhook.id,
      deliveryId
    }

    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      event,
      payload,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    try {
      await this.sendWebhook(webhook, payload, delivery)
    } catch (error) {
      console.error(`Webhook delivery failed for ${webhook.name}:`, error)
    }

    return delivery
  }

  private static async sendWebhook(
    webhook: WebhookConfig,
    payload: WebhookPayload,
    delivery: WebhookDelivery
  ): Promise<void> {
    const maxAttempts = webhook.retryAttempts || 3

    while (delivery.attempts < maxAttempts) {
      delivery.attempts++
      delivery.lastAttempt = new Date()
      delivery.status = delivery.attempts === 1 ? 'pending' : 'retrying'

      try {
        // Create signature for webhook security
        const signature = this.createSignature(payload, webhook.secret)

        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'TodoAlRojo-CRM-Webhook/1.0',
          'X-Webhook-Event': payload.event,
          'X-Webhook-Delivery': payload.deliveryId,
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': payload.timestamp,
          ...(webhook.headers || {})
        }

        console.log(`Sending webhook (attempt ${delivery.attempts}): ${webhook.url}`)

        const response = await axios.post(webhook.url, payload, {
          headers,
          timeout: webhook.timeout || 30000,
          validateStatus: (status) => status < 500 // Don't retry on 4xx errors
        })

        delivery.response = {
          status: response.status,
          body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
          headers: response.headers as Record<string, string>
        }

        if (response.status >= 200 && response.status < 300) {
          delivery.status = 'success'
          console.log(`Webhook delivered successfully: ${webhook.name}`)
          return
        } else {
          delivery.error = `HTTP ${response.status}: ${response.statusText}`
          console.warn(`Webhook returned non-success status: ${response.status}`)
        }

      } catch (error: any) {
        delivery.error = error.message || 'Unknown error'
        console.error(`Webhook delivery attempt ${delivery.attempts} failed:`, error.message)

        // Don't retry on certain errors
        if (error.code === 'ENOTFOUND' || error.response?.status === 404) {
          break
        }
      }

      // Wait before retry (exponential backoff)
      if (delivery.attempts < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, delivery.attempts - 1), 30000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    delivery.status = 'failed'
    delivery.updatedAt = new Date()
    console.error(`Webhook delivery failed after ${delivery.attempts} attempts: ${webhook.name}`)
  }

  private static createSignature(payload: WebhookPayload, secret: string): string {
    const crypto = require('crypto')
    const body = JSON.stringify(payload)
    return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`
  }

  // Event trigger methods
  static async onLeadCreated(lead: any): Promise<void> {
    await this.triggerWebhooks('lead.created', {
      id: lead.id,
      email: lead.email,
      phone: lead.phone,
      firstName: lead.firstName,
      lastName: lead.lastName,
      campaign: lead.campaign,
      source: lead.source,
      qualityScore: lead.qualityScore,
      isDuplicate: lead.isDuplicate,
      value: lead.value,
      createdAt: lead.createdAt,
      userId: lead.userId
    })
  }

  static async onUserCreated(customer: any): Promise<void> {
    await this.triggerWebhooks('user.created', {
      id: user.id,
      masterEmail: user.masterEmail,
      masterPhone: user.masterPhone,
      firstName: user.firstName,
      lastName: user.lastName,
      country: user.country,
      city: user.city,
      createdAt: user.createdAt,
      identifiersCount: user.identifiers?.length || 0
    })
  }

  static async onUserMerged(masterUser: any, mergedUser: any): Promise<void> {
    await this.triggerWebhooks('user.merged', {
      masterUser: {
        id: masterUser.id,
        masterEmail: masterUser.masterEmail,
        masterPhone: masterUser.masterPhone
      },
      mergedUser: {
        id: mergedUser.id,
        masterEmail: mergedUser.masterEmail,
        masterPhone: mergedUser.masterPhone
      },
      mergedAt: new Date().toISOString()
    })
  }

  static async onEventCreated(event: any): Promise<void> {
    await this.triggerWebhooks('event.created', {
      id: event.id,
      eventType: event.eventType,
      eventName: event.eventName,
      category: event.category,
      value: event.value,
      currency: event.currency,
      isRevenue: event.isRevenue,
      isConverted: event.isConverted,
      campaign: event.campaign,
      source: event.source,
      userId: event.userId,
      createdAt: event.createdAt
    })
  }

  static async onFraudDetected(alert: any): Promise<void> {
    await this.triggerWebhooks('fraud.detected', {
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      affectedEntities: alert.affectedEntities,
      data: alert.data,
      createdAt: alert.createdAt
    })
  }

  static async onCampaignUpdated(campaign: any, changes: any): Promise<void> {
    await this.triggerWebhooks('campaign.updated', {
      id: campaign.id,
      name: campaign.name,
      slug: campaign.slug,
      changes,
      updatedAt: campaign.updatedAt
    })
  }

  // Test webhook connectivity
  static async testWebhook(webhookId: string): Promise<{ success: boolean; error?: string }> {
    const webhook = this.webhooks.get(webhookId)
    if (!webhook) {
      return { success: false, error: 'Webhook not found' }
    }

    try {
      const testPayload: WebhookPayload = {
        event: 'lead.created',
        timestamp: new Date().toISOString(),
        data: { test: true, message: 'This is a test webhook' },
        webhookId: webhook.id,
        deliveryId: `test_${Date.now()}`
      }

      const signature = this.createSignature(testPayload, webhook.secret)

      const response = await axios.post(webhook.url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test',
          'X-Webhook-Signature': signature,
          'X-Webhook-Test': 'true'
        },
        timeout: webhook.timeout || 10000
      })

      return {
        success: response.status >= 200 && response.status < 300,
        error: response.status >= 300 ? `HTTP ${response.status}` : undefined
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection failed'
      }
    }
  }

  // Initialize default webhooks for demo
  static async initializeDefaultWebhooks(): Promise<void> {
    // Example webhook configurations
    const defaultWebhooks = [
      {
        name: 'Lead Notifications',
        url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
        secret: 'slack-webhook-secret',
        events: ['lead.created', 'fraud.detected'] as WebhookEvent[],
        isActive: false, // Disabled by default
        retryAttempts: 3,
        timeout: 15000,
        headers: { 'X-Custom-Header': 'CRM-Lead-Webhook' }
      },
      {
        name: 'External CRM Integration',
        url: 'https://api.external-crm.com/webhooks/leads',
        secret: 'external-crm-secret',
        events: ['lead.created', 'user.created', 'event.created'] as WebhookEvent[],
        isActive: false,
        retryAttempts: 5,
        timeout: 30000
      }
    ]

    for (const webhookConfig of defaultWebhooks) {
      await this.registerWebhook(webhookConfig)
    }

    console.log('Default webhooks initialized')
  }
}