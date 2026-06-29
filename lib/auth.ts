import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { checkRateLimit, recordFailure, recordSuccess } from './rate-limit'

export const authOptions: NextAuthOptions = {
  session: { 
    strategy: 'jwt',
    maxAge: 12 * 60 * 60, // 12 hours session timeout
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // Get IP from headers
        const forwardedFor = (req?.headers as Record<string, string | string[] | undefined>)?.[ 'x-forwarded-for' ]
        const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor || '127.0.0.1')
        
        // Check Rate Limit
        const { allowed, reset } = checkRateLimit(ip)
        if (!allowed) {
          throw new Error(`Too many attempts. Try again at ${new Date(reset).toLocaleTimeString()}`)
        }

        if (!credentials?.username || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user) {
          recordFailure(ip)
          return null
        }

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) {
          recordFailure(ip)
          return null
        }

        // Success
        recordSuccess(ip)
        return { id: String(user.id), name: user.username, email: user.email ?? '' }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.name = user.name }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) { 
        session.user.id = token.id as string; 
        session.user.name = token.name 
      }
      return session
    },
  },
}
