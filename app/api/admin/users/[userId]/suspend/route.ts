import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId } = await params
    const body = await request.json()
    const { action, reason } = body // action: 'suspend' | 'unsuspend'

    if (!action || !['suspend', 'unsuspend'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "suspend" or "unsuspend"' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ error: 'You cannot suspend yourself' }, { status: 400 })
    }

    if (targetUser.role === 'ADMIN' && action === 'suspend') {
      return NextResponse.json({ error: 'Cannot suspend another administrator' }, { status: 400 })
    }

    const isSuspend = action === 'suspend'

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        organizerRequestStatus: isSuspend ? 'suspended' : targetUser.organizerRequestStatus || null,
        organizerNote: isSuspend ? (reason || 'Suspended by administrator') : null,
        lockUntil: isSuspend ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null, // 1 year lock
      },
      select: { id: true, email: true, name: true, role: true, organizerRequestStatus: true },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: `ADMIN_USER_${isSuspend ? 'SUSPEND' : 'UNSUSPEND'}`,
        resource: 'user',
        resourceId: userId,
        details: JSON.stringify({
          targetUserId: userId,
          targetEmail: targetUser.email,
          action,
          reason,
          changedBy: currentUser.email,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User ${isSuspend ? 'suspended' : 'unsuspended'} successfully`,
    })
  } catch (error) {
    console.error('User suspend error:', error)
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
  }
}