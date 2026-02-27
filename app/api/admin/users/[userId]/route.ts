import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// PATCH /api/admin/users/[userId] - Update user role (approve/reject organizer request)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can approve/reject
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId } = await params
    const body = await request.json()
    const { action, note } = body // action: 'approve' | 'reject' | 'make_organizer' | 'make_attendee'

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    let newRole: UserRole = 'ADMIN'
    let requestStatus = ''
    let approvedAt: Date | null = null

    switch (action) {
      case 'approve':
      case 'make_organizer':
        newRole = 'EVENT_OWNER'
        requestStatus = 'approved'
        approvedAt = new Date()
        break
      case 'reject':
        newRole = 'ATTENDEE'
        requestStatus = 'rejected'
        break
      case 'make_attendee':
        newRole = 'ATTENDEE'
        requestStatus = ''
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        organizerRequestStatus: requestStatus || undefined,
        organizerApprovedAt: approvedAt || undefined,
        organizerNote: note || undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizerRequestStatus: true,
        organizerApprovedAt: true,
      }
    })

    // Log the action
    try {
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: `USER_ROLE_${action.toUpperCase()}`,
          resource: 'user',
          details: JSON.stringify({
            targetUserId: userId,
            previousRole: 'ADMIN',
            newRole,
            note,
            timestamp: new Date().toISOString(),
          }),
        },
      })
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: action === 'approve' || action === 'make_organizer' 
        ? 'User has been approved as organizer'
        : action === 'reject'
        ? 'Organizer request has been rejected'
        : 'User role updated'
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}
