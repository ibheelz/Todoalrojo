import { prisma } from './prisma'
import { z } from 'zod'
import { IdentifierType } from '@prisma/client'

export interface CustomerIdentificationData {
  email?: string
  phone?: string
  clickId?: string
  deviceId?: string
  sessionId?: string
  fingerprint?: string
  ip?: string
  userAgent?: string
}

export interface CustomerContextData {
  firstName?: string
  lastName?: string
  company?: string
  jobTitle?: string
  source?: string
  country?: string
  region?: string
  city?: string
  timezone?: string
  language?: string
  profileImage?: string
  assignedTeam?: string[]
}

export class CustomerService {
  static async findOrCreateCustomer(
    identificationData: CustomerIdentificationData,
    contextData?: CustomerContextData
  ) {
    const { email, phone, clickId, deviceId, sessionId, fingerprint, ip, userAgent } = identificationData

    // Try to find existing customer by identifiers
    let existingCustomer = null

    // First try by email (strongest identifier)
    if (email) {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { masterEmail: email },
            { identifiers: { some: { type: 'EMAIL', value: email } } }
          ]
        },
        include: { identifiers: true }
      })
    }

    // Then try by phone
    if (!existingCustomer && phone) {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { masterPhone: phone },
            { identifiers: { some: { type: 'PHONE', value: phone } } }
          ]
        },
        include: { identifiers: true }
      })
    }

    // Then try by device/click IDs
    if (!existingCustomer && (clickId || deviceId || sessionId)) {
      const searchTerms = []
      if (clickId) searchTerms.push({ type: 'CLICK_ID' as IdentifierType, value: clickId })
      if (deviceId) searchTerms.push({ type: 'DEVICE_ID' as IdentifierType, value: deviceId })
      if (sessionId) searchTerms.push({ type: 'SESSION_ID' as IdentifierType, value: sessionId })

      if (searchTerms.length > 0) {
        existingCustomer = await prisma.customer.findFirst({
          where: {
            identifiers: {
              some: {
                OR: searchTerms
              }
            }
          },
          include: { identifiers: true }
        })
      }
    }

    if (existingCustomer) {
      // Update customer with new context data and identifiers
      const updateData: any = {
        lastSeen: new Date()
      }

      // Update master email/phone if not set
      if (email && !existingCustomer.masterEmail) {
        updateData.masterEmail = email
      }
      if (phone && !existingCustomer.masterPhone) {
        updateData.masterPhone = phone
      }

      // Update context data if provided
      if (contextData) {
        Object.keys(contextData).forEach(key => {
          if (contextData[key] && !existingCustomer![key]) {
            updateData[key] = contextData[key]
          }
        })
      }

      const updatedCustomer = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: updateData,
        include: { identifiers: true }
      })

      // Add new identifiers if they don't exist
      await this.addMissingIdentifiers(updatedCustomer.id, identificationData)

      return updatedCustomer
    } else {
      // Create new customer
      const customerData: any = {
        masterEmail: email,
        firstSeen: new Date(),
        lastSeen: new Date(),
        assignedTeam: contextData?.assignedTeam || [],
        ...contextData
      }

      // Only set masterPhone if it doesn't already exist in the database
      if (phone) {
        const existingPhoneCustomer = await prisma.customer.findFirst({
          where: { masterPhone: phone }
        })

        if (!existingPhoneCustomer) {
          customerData.masterPhone = phone
        }
      }

      let newCustomer
      try {
        newCustomer = await prisma.customer.create({
          data: customerData,
          include: { identifiers: true }
        })
      } catch (createError) {
        console.error('Customer creation error:', createError)
        console.error('Customer data that failed:', customerData)
        throw createError
      }

      // Add all identifiers
      await this.addMissingIdentifiers(newCustomer.id, identificationData)

      return await prisma.customer.findUnique({
        where: { id: newCustomer.id },
        include: { identifiers: true }
      })
    }
  }

  static async addMissingIdentifiers(customerId: string, identificationData: CustomerIdentificationData, verificationData?: any) {
    const identifiersToAdd = []

    if (identificationData.email) {
      const exists = await prisma.identifier.findFirst({
        where: { customerId, type: 'EMAIL', value: identificationData.email }
      })
      if (!exists) {
        identifiersToAdd.push({
          customerId,
          type: 'EMAIL' as IdentifierType,
          value: identificationData.email,
          isPrimary: true,
          isVerified: verificationData?.emailVerified || false
        })
      } else if (verificationData?.emailVerified && !exists.isVerified) {
        // Update existing identifier if verification status changed
        await prisma.identifier.update({
          where: { id: exists.id },
          data: { isVerified: true }
        })
      }
    }

    if (identificationData.phone) {
      const exists = await prisma.identifier.findFirst({
        where: { customerId, type: 'PHONE', value: identificationData.phone }
      })
      if (!exists) {
        identifiersToAdd.push({
          customerId,
          type: 'PHONE' as IdentifierType,
          value: identificationData.phone,
          isPrimary: !identificationData.email,
          isVerified: verificationData?.smsVerified || false
        })
      } else if (verificationData?.smsVerified && !exists.isVerified) {
        // Update existing identifier if verification status changed
        await prisma.identifier.update({
          where: { id: exists.id },
          data: { isVerified: true }
        })
      }
    }

    if (identificationData.clickId) {
      const exists = await prisma.identifier.findFirst({
        where: { customerId, type: 'CLICK_ID', value: identificationData.clickId }
      })
      if (!exists) {
        identifiersToAdd.push({
          customerId,
          type: 'CLICK_ID' as IdentifierType,
          value: identificationData.clickId,
          isPrimary: false,
          isVerified: true
        })
      }
    }

    if (identificationData.deviceId) {
      const exists = await prisma.identifier.findFirst({
        where: { customerId, type: 'DEVICE_ID', value: identificationData.deviceId }
      })
      if (!exists) {
        identifiersToAdd.push({
          customerId,
          type: 'DEVICE_ID' as IdentifierType,
          value: identificationData.deviceId,
          isPrimary: false,
          isVerified: true
        })
      }
    }

    if (identificationData.sessionId) {
      const exists = await prisma.identifier.findFirst({
        where: { customerId, type: 'SESSION_ID', value: identificationData.sessionId }
      })
      if (!exists) {
        identifiersToAdd.push({
          customerId,
          type: 'SESSION_ID' as IdentifierType,
          value: identificationData.sessionId,
          isPrimary: false,
          isVerified: true
        })
      }
    }

    if (identificationData.fingerprint) {
      const exists = await prisma.identifier.findFirst({
        where: { customerId, type: 'FINGERPRINT', value: identificationData.fingerprint }
      })
      if (!exists) {
        identifiersToAdd.push({
          customerId,
          type: 'FINGERPRINT' as IdentifierType,
          value: identificationData.fingerprint,
          isPrimary: false,
          isVerified: true
        })
      }
    }

    if (identifiersToAdd.length > 0) {
      await prisma.identifier.createMany({
        data: identifiersToAdd
      })
    }
  }

  static async searchCustomers(query: string) {
    return await prisma.customer.findMany({
      where: {
        OR: [
          { masterEmail: { contains: query, mode: 'insensitive' } },
          { masterPhone: { contains: query } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { identifiers: { some: { value: { contains: query, mode: 'insensitive' } } } }
        ]
      },
      include: {
        identifiers: true,
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            campaign: true,
            source: true,
            medium: true,
            userAgent: true,
            ip: true,
            landingPage: true,
            createdAt: true
          }
        },
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            clickId: true,
            campaign: true,
            source: true,
            medium: true,
            userAgent: true,
            ip: true,
            landingPage: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            clicks: true,
            leads: true,
            events: true
          }
        }
      },
      take: 50
    })
  }

  static async getCustomerDetails(customerId: string) {
    return await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        identifiers: true,
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            clickId: true,
            campaign: true,
            source: true,
            medium: true,
            ip: true,
            country: true,
            city: true,
            device: true,
            browser: true,
            os: true,
            landingPage: true,
            userAgent: true,
            createdAt: true
          }
        },
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            campaign: true,
            source: true,
            medium: true,
            ip: true,
            country: true,
            city: true,
            landingPage: true,
            formUrl: true,
            userAgent: true,
            customFields: true,
            qualityScore: true,
            isDuplicate: true,
            value: true,
            createdAt: true
          }
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            eventType: true,
            eventName: true,
            category: true,
            value: true,
            currency: true,
            isRevenue: true,
            isConverted: true,
            campaign: true,
            clickId: true,
            properties: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            clicks: true,
            leads: true,
            events: true
          }
        }
      }
    })
  }

  static async deleteCustomer(customerId: string) {
    // Delete in order: identifiers, related records (leads, clicks, events), then customer
    await prisma.identifier.deleteMany({
      where: { customerId }
    })

    await prisma.lead.deleteMany({
      where: { customerId }
    })

    await prisma.click.deleteMany({
      where: { customerId }
    })

    await prisma.event.deleteMany({
      where: { customerId }
    })

    const deletedCustomer = await prisma.customer.delete({
      where: { id: customerId }
    })

    return deletedCustomer
  }

  static async listCustomers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          identifiers: true,
          leads: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              campaign: true,
              source: true,
              medium: true,
              userAgent: true,
              ip: true,
              landingPage: true,
              customFields: true,
              createdAt: true
            }
          },
          clicks: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              clickId: true,
              campaign: true,
              source: true,
              medium: true,
              userAgent: true,
              ip: true,
              landingPage: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              clicks: true,
              leads: true,
              events: true
            }
          }
        }
      }),
      prisma.customer.count()
    ])

    return {
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  static async updateCustomer(customerId: string, updateData: Partial<CustomerContextData>) {
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        identifiers: true,
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            campaign: true,
            source: true,
            medium: true,
            userAgent: true,
            ip: true,
            landingPage: true,
            createdAt: true
          }
        },
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            clickId: true,
            campaign: true,
            source: true,
            medium: true,
            userAgent: true,
            ip: true,
            landingPage: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            clicks: true,
            leads: true,
            events: true
          }
        }
      }
    })

    return updatedCustomer
  }
}