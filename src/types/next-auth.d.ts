import { UserRole } from '@prisma/client'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
      organisationId?: string | null
      organisationName?: string | null
    }
  }

  interface User {
    role: UserRole
    organisationId?: string | null
    organisationName?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    organisationId?: string | null
    organisationName?: string | null
  }
}
