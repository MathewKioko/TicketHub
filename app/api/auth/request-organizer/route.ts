import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

function validateAutoApproval(user: any, rules: any): { passed: boolean; reason?: string } {
  if (rules.requireVerifiedEmail && !user.verified) {
    return { passed: false, reason: 'Email not verified' }
  }
  if (rules.requireNoLock && user.lockUntil && user.lockUntil > new Date()) {
    return { passed: false, reason: 'Account is locked' }
  }
  if (rules.requireNoSuspension && user.organizerRequestStatus === 'suspended') {
    return { passed: false, reason: 'Account is suspended' }
  }
  if (rules.minAccountAgeHours && rules.minAccountAgeHours > 0) {
    const cutoff = new Date(Date.now() - rules.minAccountAgeHours * 60 * 60 * 1000)
    if (user.createdAt && new Date(user.createdAt) > cutoff) {
      return { passed: false, reason: `Account must be at least ${rules.minAccountAgeHours} hour(s) old` }
    }
  }
  return { passed: true }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to request organizer access' },
        { status: 401 }
      )
    }

    // Check current role
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: ' Admins already have full access' },
        { status: 400 }
      )
    }

    if (user.role === 'EVENT_OWNER' || user.role === 'ORGANIZER') {
      return NextResponse.json({
        message: 'You already have organizer access',
        status: 'already_has_access',
        alreadyHasAccess: true,
      })
    }

    // Get request body for optional note
    let note = ''
    try {
      const body = await request.json()
      note = body.note || ''
    } catch {
      // No body provided, that's fine
    }

    // Check if already pending
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizerRequestStatus: true, role: true, verified: true, lockUntil: true, createdAt: true }
    })

    if (existingUser?.organizerRequestStatus === 'pending') {
      return NextResponse.json({
        message: 'Your request is already pending approval.',
        status: 'pending'
      })
    }

    // Check auto-approval settings
    const autoApproveFlag = await prisma.featureFlag.findUnique({
      where: { name: 'organizer-auto-approve' },
    })

    const autoApproveEnabled = autoApproveFlag?.enabled ?? false
    let rules: any = {}
    if (autoApproveFlag?.userRoles?.length) {
      try {
        rules = Object.fromEntries(
          autoApproveFlag.userRoles.map((r: string) => {
            const [key, value] = r.split(':')
            return [key, value === 'true' ? true : value === 'false' ? false : value]
          })
        )
      } catch {
        rules = {}
      }
    }

    if (autoApproveEnabled) {
      const validation = validateAutoApproval(existingUser, rules)

      if (validation.passed) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'EVENT_OWNER',
            organizerRequestStatus: 'approved',
            organizerApprovedAt: new Date(),
            organizerNote: note || 'Auto-approved by system validation',
            verified: true,
          },
        })

        try {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'ORGANIZER_AUTO_APPROVE',
              resource: 'user',
              details: JSON.stringify({
                requestedRole: 'EVENT_OWNER',
                note,
                validationRules: rules,
                timestamp: new Date().toISOString(),
              }),
            },
          })
        } catch (auditError) {
          console.error('Failed to log audit:', auditError)
        }

        return NextResponse.json({
          message: 'Your organizer access has been approved automatically.',
          status: 'approved',
          autoApproved: true,
        })
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: { set: 'PENDING_ORGANIZER' } as any,
            organizerRequestStatus: 'pending',
            organizerRequestAt: new Date(),
            organizerNote: `Auto-approval failed: ${validation.reason}`,
          },
        })

        try {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'ORGANIZER_AUTO_APPROVE_FAILED',
              resource: 'user',
              details: JSON.stringify({
                requestedRole: 'PENDING_ORGANIZER',
                reason: validation.reason,
                validationRules: rules,
                timestamp: new Date().toISOString(),
              }),
            },
          })
        } catch (auditError) {
          console.error('Failed to log audit:', auditError)
        }

        return NextResponse.json({
          message: `Your request could not be auto-approved: ${validation.reason}. It has been submitted for manual review.`,
          status: 'pending',
          autoApproved: false,
          reason: validation.reason,
        })
      }
    }

    // Manual approval path (original behavior)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: { set: 'PENDING_ORGANIZER' } as any,
        organizerRequestStatus: 'pending',
        organizerRequestAt: new Date(),
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ORGANIZER_REQUEST',
          resource: 'user',
          details: JSON.stringify({
            requestedRole: 'PENDING_ORGANIZER',
            note,
            timestamp: new Date().toISOString(),
          }),
        },
      })
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    return NextResponse.json({
      message: 'Your organizer access request has been submitted. Our team will review your application.',
      status: 'pending'
    })
  } catch (error) {
    console.error('Error requesting organizer access:', error)
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    )
  }
}

// GET endpoint to check request status
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        organizerRequestStatus: true,
        organizerRequestAt: true,
        organizerApprovedAt: true,
      }
    })

    return NextResponse.json({
      role: userData?.role,
      requestStatus: userData?.organizerRequestStatus,
      requestAt: userData?.organizerRequestAt,
      approvedAt: userData?.organizerApprovedAt,
    })
  } catch (error) {
    console.error('Error checking organizer status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
