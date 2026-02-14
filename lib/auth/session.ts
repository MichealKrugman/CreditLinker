import { getServerSession as getNextAuthSession } from 'next-auth'
import { authOptions } from './auth.config'

/**
 * Get server-side session
 * Use this in Server Components, API Routes, and Server Actions
 */
export async function getServerSession() {
  return await getNextAuthSession(authOptions)
}

/**
 * Get current user from session
 * Returns null if no session exists
 */
export async function getCurrentUser() {
  const session = await getServerSession()
  return session?.user || null
}

/**
 * Require authentication - throw error if not authenticated
 * Use in API routes that require authentication
 */
export async function requireAuth() {
  const session = await getServerSession()
  
  if (!session || !session.user) {
    throw new Error('Unauthorized')
  }

  return session.user
}

/**
 * Get business ID from session
 * Throws error if user has no business
 */
export async function getBusinessId(): Promise<string> {
  const user = await requireAuth()
  
  if (!user.businessId) {
    throw new Error('No business found for user')
  }

  return user.businessId
}
