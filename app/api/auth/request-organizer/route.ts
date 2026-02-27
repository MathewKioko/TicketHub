import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

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
      return NextResponse.json(
        { error: 'You already have organizer access' },
        { status: 400 }
      )
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
      select: { organizerRequestStatus: true, role: true }
    })

    if (existingUser?.organizerRequestStatus === 'pending') {
      return NextResponse.json({
        message: 'Your request is already pending approval.',
        status: 'pending'
      })
    }

    // Update user to PENDING_ORGANIZER
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'PENDING_ORGANIZER',
        organizerRequestStatus: 'pending',
        organizerRequestAt: new Date(),
      }
    })

    // Log the request in audit log
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
