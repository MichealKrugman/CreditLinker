import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import * as bcrypt from 'bcryptjs'
import { prisma } from '@/lib/database/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            businesses: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // Return user object (exclude password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          businessId: user.businesses[0]?.id || null,
          businessName: user.businesses[0]?.name || null,
        }
      },
    }),
  ],
  
  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.businessId = user.businessId
        token.businessName = user.businessName
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.name
        token.businessId = session.businessId
        token.businessName = session.businessName
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.businessId = token.businessId as string | null
        session.user.businessName = token.businessName as string | null
      }

      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  
  debug: process.env.NODE_ENV === 'development',
}
