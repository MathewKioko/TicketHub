/**
 * Feature Flags System for TicketHub v2
 * Provides granular control over feature rollout
 */

import { prisma } from '@/lib/db'

export type FeatureFlagName = 
  | 'v2_dashboard'
  | 'v2_event_creation'
  | 'v2_multi_ticket_types'
  | 'v2_paystack_subaccounts'
  | 'v2_payouts'
  | 'v2_pdf_tickets'
  | 'v2_email_notifications'
  | 'v2_analytics'

// Default feature flags
const DEFAULT_FLAGS: Record<FeatureFlagName, boolean> = {
  v2_dashboard: false,
  v2_event_creation: false,
  v2_multi_ticket_types: false,
  v2_paystack_subaccounts: false,
  v2_payouts: false,
  v2_pdf_tickets: false,
  v2_email_notifications: false,
  v2_analytics: false,
}

/**
 * Check if a feature is enabled for a user
 */
export async function isFeatureEnabled(
  flagName: FeatureFlagName,
  userId?: string,
  userRole?: string
): Promise<boolean> {
  try {
    // Get feature flag from database
    const flag = await prisma.featureFlag.findUnique({
      where: { name: flagName },
    })

    // If flag doesn't exist, use default
    if (!flag) {
      return DEFAULT_FLAGS[flagName] || false
    }

    // If flag is globally disabled
    if (!flag.enabled) {
      return false
    }

    // Check rollout percentage
    if (flag.rollout > 0 && flag.rollout < 100) {
      // Simple deterministic rollout based on userId
      if (userId) {
        const hash = userId.split('').reduce((acc, char) => {
          return ((acc << 5) - acc) + char.charCodeAt(0)
        }, 0)
        const percentile = Math.abs(hash % 100)
        if (percentile > flag.rollout) {
          return false
        }
      } else {
        // Random rollout for anonymous users
        if (Math.random() * 100 > flag.rollout) {
          return false
        }
      }
    }

    // Check user role targeting
    if (flag.userRoles.length > 0) {
      if (!userRole || !flag.userRoles.includes(userRole)) {
        return false
      }
    }

    // Check specific user IDs
    if (flag.userIds.length > 0) {
      if (!userId || !flag.userIds.includes(userId)) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error checking feature flag:', error)
    // Default to false on error for safety
    return false
  }
}

/**
 * Get all feature flags for a user
 */
export async function getUserFeatures(
  userId?: string,
  userRole?: string
): Promise<Record<FeatureFlagName, boolean>> {
  const flags = { ...DEFAULT_FLAGS }
  const flagNames = Object.keys(DEFAULT_FLAGS) as FeatureFlagName[]

  for (const flagName of flagNames) {
    flags[flagName] = await isFeatureEnabled(flagName, userId, userRole)
  }

  return flags
}

/**
 * Enable a feature flag
 */
export async function enableFeature(flagName: FeatureFlagName): Promise<void> {
  await prisma.featureFlag.upsert({
    where: { name: flagName },
    update: { enabled: true },
    create: {
      name: flagName,
      enabled: true,
    },
  })
}

/**
 * Disable a feature flag
 */
export async function disableFeature(flagName: FeatureFlagName): Promise<void> {
  await prisma.featureFlag.upsert({
    where: { name: flagName },
    update: { enabled: false },
    create: {
      name: flagName,
      enabled: false,
    },
  })
}

/**
 * Set rollout percentage for a feature
 */
export async function setFeatureRollout(
  flagName: FeatureFlagName,
  rollout: number
): Promise<void> {
  await prisma.featureFlag.upsert({
    where: { name: flagName },
    update: { rollout: Math.min(100, Math.max(0, rollout)) },
    create: {
      name: flagName,
      rollout: Math.min(100, Math.max(0, rollout)),
      enabled: true,
    },
  })
}

/**
 * Initialize default feature flags
 */
export async function initializeFeatureFlags(): Promise<void> {
  const flagNames = Object.keys(DEFAULT_FLAGS) as FeatureFlagName[]

  for (const flagName of flagNames) {
    await prisma.featureFlag.upsert({
      where: { name: flagName },
      update: {},
      create: {
        name: flagName,
        enabled: DEFAULT_FLAGS[flagName],
        rollout: DEFAULT_FLAGS[flagName] ? 100 : 0,
      },
    })
  }
}
