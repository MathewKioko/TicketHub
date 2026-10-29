import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { email, action } = body // action: 'grant' | 'revoke'

    if (!email || !action) {
      return NextResponse.json({ error: 'Email and action are required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { email } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent self-demotion
    if (targetUser.id === currentUser.id && action === 'revoke') {
      return NextResponse.json({ error: 'You cannot revoke your own admin access' }, { status: 400 })
    }

    let newRole: 'ADMIN' | 'ATTENDEE' | 'EVENT_OWNER' = 'ATTENDEE'
    let message: string

    if (action === 'grant') {
      newRole = 'ADMIN'
      message = `${email} is now an ADMINISTRATOR`
    } else if (action === 'revoke') {
      newRole = 'ATTENDEE'
      message = `Admin access revoked for ${email}`
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "grant" or "revoke"' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: newRole, verified: true },
      select: { id: true, email: true, name: true, role: true },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: `ADMIN_ROLE_${action.toUpperCase()}`,
        resource: 'user',
        resourceId: targetUser.id,
        details: JSON.stringify({
          targetUserId: targetUser.id,
          targetEmail: email,
          previousRole: targetUser.role,
          newRole,
          changedBy: currentUser.email,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({ success: true, user: updatedUser, message })
  } catch (error) {
    console.error('Admin role error:', error)
    return NextResponse.json({ error: 'Failed to update admin role' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true, createdAt: true, verified: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ admins })
  } catch (error) {
    console.error('Admin list error:', error)
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}