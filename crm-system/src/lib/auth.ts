import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 AUTH DEBUG: Starting authorization...')
        console.log('📧 Email provided:', credentials?.email)
        console.log('🔑 Password provided:', credentials?.password ? '[HIDDEN]' : 'NO PASSWORD')

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials - email or password not provided')
          return null
        }

        try {
          // Check admin users first
          console.log('🔍 Searching for admin user with email:', credentials.email)
          const adminUser = await prisma.adminUser.findUnique({
            where: { email: credentials.email }
          })

          console.log('👤 Admin user found:', adminUser ? 'YES' : 'NO')
          if (adminUser) {
            console.log('📊 Admin user details:', {
              id: adminUser.id,
              email: adminUser.email,
              isActive: adminUser.isActive,
              role: adminUser.role,
              hasPasswordHash: !!adminUser.passwordHash
            })
          }

          if (adminUser && adminUser.isActive) {
            console.log('🔒 Comparing passwords for admin user...')
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              adminUser.passwordHash
            )

            console.log('✅ Password valid for admin:', isValidPassword)

            if (isValidPassword) {
              console.log('🎉 Admin login successful!')
              await prisma.adminUser.update({
                where: { id: adminUser.id },
                data: { lastLogin: new Date() }
              })

              const userResponse = {
                id: adminUser.id,
                email: adminUser.email,
                name: `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || adminUser.email,
                role: adminUser.role,
                userType: 'admin'
              }
              console.log('👤 Returning admin customer:', userResponse)
              return userResponse
            } else {
              console.log('❌ Invalid password for admin user')
            }
          } else if (adminUser && !adminUser.isActive) {
            console.log('❌ Admin user is inactive')
          }

          // Check client users
          console.log('🔍 Searching for client user with email:', credentials.email)
          const client = await prisma.client.findUnique({
            where: { email: credentials.email }
          })

          console.log('🏢 Client user found:', client ? 'YES' : 'NO')
          if (client) {
            console.log('📊 Client user details:', {
              id: client.id,
              email: client.email,
              isActive: client.isActive,
              hasPasswordHash: !!client.passwordHash
            })
          }

          if (client && client.isActive && client.passwordHash) {
            console.log('🔒 Comparing passwords for client user...')
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              client.passwordHash
            )

            console.log('✅ Password valid for client:', isValidPassword)

            if (isValidPassword) {
              console.log('🎉 Client login successful!')
              const userResponse = {
                id: client.id,
                email: client.email,
                name: client.name,
                role: 'CLIENT',
                userType: 'client'
              }
              console.log('👤 Returning client customer:', userResponse)
              return userResponse
            } else {
              console.log('❌ Invalid password for client user')
            }
          } else if (client && !client.isActive) {
            console.log('❌ Client user is inactive')
          } else if (client && !client.passwordHash) {
            console.log('❌ Client user has no password hash')
          }

          console.log('❌ No valid user found for credentials')
          return null
        } catch (error) {
          console.error('💥 AUTH ERROR:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.userType = user.userType
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.userType = token.userType as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  },
  debug: true,
  logger: {
    error(code, metadata) {
      console.error('🚨 NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('⚠️ NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('🐛 NextAuth Debug:', code, metadata)
    }
  }
}