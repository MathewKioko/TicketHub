import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { createSubaccount, createRecipient } from '@/lib/paystack'

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
    const { action, note, splitPercentage, bankCode, accountNumber, accountName, businessName } = body // action: 'approve' | 'reject' | 'make_organizer' | 'make_attendee'

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

    // Default platform fee (percentage TicketHub keeps)
    const platformFee = splitPercentage !== undefined ? parseInt(splitPercentage, 10) : 10

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        organizerRequestStatus: requestStatus || undefined,
        organizerApprovedAt: approvedAt || undefined,
        organizerNote: note || undefined,
        verified: action === 'approve' || action === 'make_organizer' ? true : undefined,
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

    // Create EventOwnerProfile with default split ratio when becoming organizer
    if (newRole === 'EVENT_OWNER') {
      await prisma.eventOwnerProfile.upsert({
        where: { userId: updatedUser.id },
        update: {},
        create: {
          userId: updatedUser.id,
          paystackSplitRatio: platformFee,
          bankVerified: false,
          documentsVerified: false,
          autoPayout: false,
          payoutSchedule: 'manual',
          totalRevenue: 0,
          totalPayouts: 0,
          pendingPayouts: 0,
        },
        select: {
          id: true,
          paystackSplitRatio: true,
          paystackSubaccountId: true,
        },
      })

      // If bank details provided, create Paystack subaccount and transfer recipient
      if (bankCode && accountNumber && accountName && businessName) {
        try {
          const subaccount = await createSubaccount({
            businessName,
            bankCode,
            accountNumber,
            accountName,
            percentageCharge: platformFee,
            description: `TicketHub organizer subaccount: ${updatedUser.name}`,
            metadata: {
              organizerId: updatedUser.id,
              organizerEmail: updatedUser.email,
              platformFeePercentage: platformFee,
            },
          })

          const recipient = await createRecipient({
            type: 'nuban',
            name: accountName,
            accountNumber,
            bankCode,
            currency: 'KES',
            description: `TicketHub organizer payout: ${updatedUser.name}`,
            metadata: {
              organizerId: updatedUser.id,
              organizerEmail: updatedUser.email,
            },
          })

          await prisma.eventOwnerProfile.update({
            where: { userId: updatedUser.id },
            data: {
              paystackSubaccountId: subaccount.subaccountCode,
              bankVerified: true,
            },
          })
        } catch (subaccountError) {
          console.error('Failed to create subaccount during approval:', subaccountError)
          // Don't fail the approval if subaccount creation fails
        }
      }
    }

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
            splitPercentage: platformFee,
            hasSubaccount: !!(bankCode && accountNumber && accountName && businessName),
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
        : 'User role updated',
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[userId] - Delete a user account (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId } = await params

    // Prevent deleting yourself
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin account' },
          { status: 400 }
        )
      }
    }

    // Delete related data first (tickets, payments, payouts, event owner profile, etc.)
    await prisma.ticket.deleteMany({ where: { userId } })
    await prisma.payment.deleteMany({ where: { userId } })
    await prisma.payout.deleteMany({ where: { eventOwnerId: userId } })
    await prisma.eventOwnerProfile.deleteMany({ where: { userId } })

    await prisma.user.delete({
      where: { id: userId },
    })

    // Log the deletion
    try {
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'USER_DELETED',
          resource: 'user',
          details: JSON.stringify({
            targetUserId: userId,
            targetEmail: user.email,
            targetName: user.name,
            targetRole: user.role,
            timestamp: new Date().toISOString(),
          }),
        },
      })
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: `User ${user.email} deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
