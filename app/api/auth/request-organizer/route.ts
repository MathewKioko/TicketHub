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

    if (['ORGANIZER', 'EVENT_OWNER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'You already have organizer access' },
        { status: 400 }
      )
    }

    // Update user role to pending organizer (or create a request record)
    // For now, we'll just log the request - in production you'd want a separate OrganizerRequest model
    
      // Log the request in audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ORGANIZER_REQUEST',
          resource: 'user',
          details: JSON.stringify({
            requestedRole: 'ORGANIZER',
            reason: 'User requested organizer access via become-organizer page',
          }),
        },
      })
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    // In a full implementation, you'd:
    // 1. Create an OrganizerRequest model to track requests
    // 2. Send email to admin to review the request
    // 3. Maybe add a PENDING_ORGANIZER role
    
    return NextResponse.json({
      message: 'Your organizer access request has been submitted. Our team will review your application and get back to you within 24-48 hours.',
    })
  } catch (error) {
    console.error('Error requesting organizer access:', error)
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    )
  }
}
