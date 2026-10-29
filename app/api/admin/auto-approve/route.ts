import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Feature flag name for auto-approval
const AUTO_APPROVE_FLAG = 'organizer-auto-approve'

// Default validation rules
const DEFAULT_RULES = {
  requireVerifiedEmail: true,
  requireNoLock: true,
  requireNoSuspension: true,
  minAccountAgeHours: 0, // 0 = no minimum age
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const flag = await prisma.featureFlag.findUnique({
      where: { name: AUTO_APPROVE_FLAG },
    })

    return NextResponse.json({
      enabled: flag?.enabled ?? false,
      rules: flag?.userRoles ? JSON.parse(flag.userRoles.join(',')) : DEFAULT_RULES,
      description: flag?.description ?? 'Automatic organizer approval after validation checks',
    })
  } catch (error) {
    console.error('Auto-approve settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { enabled, rules } = body

    // Upsert feature flag
    const flag = await prisma.featureFlag.upsert({
      where: { name: AUTO_APPROVE_FLAG },
      update: {
        enabled: !!enabled,
        userRoles: rules ? Object.entries(rules as Record<string, any>).map(([k, v]) => `${k}:${v}`) : [],
        updatedAt: new Date(),
      },
      create: {
        name: AUTO_APPROVE_FLAG,
        description: 'Automatic organizer approval after validation checks',
        enabled: !!enabled,
        userRoles: rules ? Object.entries(rules as Record<string, any>).map(([k, v]) => `${k}:${v}`) : [],
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'ADMIN_SETTING_CHANGE',
        resource: 'system',
        details: JSON.stringify({
          setting: 'organizer-auto-approve',
          enabled,
          rules,
          changedBy: currentUser.email,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      enabled: flag.enabled,
      message: `Auto-approval ${enabled ? 'enabled' : 'disabled'}`,
    })
  } catch (error) {
    console.error('Auto-approve settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}