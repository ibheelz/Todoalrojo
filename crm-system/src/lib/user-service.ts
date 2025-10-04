import { prisma } from './prisma'
import { z } from 'zod'
import { IdentifierType } from '@prisma/client'

export interface UserIdentificationData {
  email?: string
  phone?: string
  clickId?: string
  deviceId?: string
  sessionId?: string
  fingerprint?: string
  ip?: string
  userAgent?: string
}

export interface UserContextData {
  firstName?: string
  lastName?: string
  country?: string
  region?: string
  city?: string
  timezone?: string
  language?: string
}

export class UserService {
  static async findOrCreateUser(
    identificationData: UserIdentificationData,
    contextData?: UserContextData
  ) {
    const { email, phone, clickId, deviceId, sessionId, fingerprint, ip, userAgent } = identificationData

    // Debug: Check if prisma is defined
    console.log('🔍 [USER SERVICE] Prisma client check:', {
      prismaExists: !!prisma,
      prismaType: typeof prisma,
      prismaCustomer: !!prisma?.customer,
      prismaCustomerFindFirst: !!prisma?.customer?.findFirst
    })

    if (!prisma) {
      throw new Error('Prisma client is not initialized')
    }

    // Try to find existing user by identifiers
    let existingUser = null

    // First try by email (strongest identifier)
    if (email) {
      existingUser = await prisma.customer.findFirst({
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
    if (!existingUser && phone) {
      existingUser = await prisma.customer.findFirst({
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
    if (!existingUser && (clickId || deviceId || sessionId)) {
      const searchTerms = []
      if (clickId) searchTerms.push({ type: 'CLICK_ID' as IdentifierType, value: clickId })
      if (deviceId) searchTerms.push({ type: 'DEVICE_ID' as IdentifierType, value: deviceId })
      if (sessionId) searchTerms.push({ type: 'SESSION_ID' as IdentifierType, value: sessionId })

      if (searchTerms.length > 0) {
        existingUser = await prisma.customer.findFirst({
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

    if (existingUser) {
      // Update user with new context data and identifiers
      const updateData: any = {
        lastSeen: new Date()
      }

      // Update master email/phone if not set
      if (email && !existingUser.masterEmail) {
        updateData.masterEmail = email
      }
      if (phone && !existingUser.masterPhone) {
        updateData.masterPhone = phone
      }

      // Update context data if provided
      if (contextData) {
        Object.keys(contextData).forEach(key => {
          if (contextData[key] && !existingUser![key]) {
            updateData[key] = contextData[key]
          }
        })
      }

      const updatedUser = await prisma.customer.update({
        where: { id: existingUser.id },
        data: updateData,
        include: { identifiers: true }
      })

      // Add new identifiers if they don't exist
      await this.addMissingIdentifiers(updatedUser.id, identificationData)

      return updatedUser
    } else {
      // Create new user
      const userData: any = {
        masterEmail: email,
        masterPhone: phone,
        firstSeen: new Date(),
        lastSeen: new Date(),
        ...contextData
      }

      const newUser = await prisma.customer.create({
        data: userData,
        include: { identifiers: true }
      })

      // Add all identifiers
      await this.addMissingIdentifiers(newUser.id, identificationData)

      return await prisma.customer.findUnique({
        where: { id: newUser.id },
        include: { identifiers: true }
      })
    }
  }

  static async addMissingIdentifiers(customerId: string, identificationData: UserIdentificationData) {
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
          isVerified: false
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
          isVerified: false
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

  static async searchUsers(query: string) {
    return await prisma.customer.findMany({
      where: {
        OR: [
          { masterEmail: { contains: query, mode: 'insensitive' } },
          { masterPhone: { contains: query } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { identifiers: { some: { value: { contains: query, mode: 'insensitive' } } } }
        ]
      },
      include: {
        identifiers: true,
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

  static async getUserDetails(customerId: string) {
    return await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        identifiers: true,
        clicks: { orderBy: { createdAt: 'desc' }, take: 50 },
        leads: { orderBy: { createdAt: 'desc' }, take: 50 },
        events: { orderBy: { createdAt: 'desc' }, take: 50 },
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
}