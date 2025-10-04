import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    userType: string
  }

  interface Session {
    customer: {
      id: string
      email: string
      name: string
      role: string
      userType: string
    }
  }
}