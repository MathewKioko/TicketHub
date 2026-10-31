import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const verificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  note: z.string().optional(),
})

export async function PATCH(
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
    const body = await request.json()
    const { status, note } = verificationSchema.parse(body)

    // Find the organizer profile
    const profile = await prisma.eventOwnerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Organizer profile not found' },
        { status: 404 }
      )
    }

    if (!profile.bankStatementUrl) {
      return NextResponse.json(
        { error: 'No bank statement has been uploaded' },
        { status: 400 }
      )
    }

    if (profile.bankVerificationStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'Bank statement has already been reviewed' },
        { status: 400 }
      )
    }

    // Update the verification status
    const updatedProfile = await prisma.eventOwnerProfile.update({
      where: { userId },
      data: {
        bankVerificationStatus: status,
        bankVerified: status === 'VERIFIED',
        bankVerificationNote: note ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message:
        status === 'VERIFIED'
          ? 'Bank statement verified. Organizer can now request payouts.'
          : 'Bank statement rejected. Organizer needs to re-upload.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Bank verification approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
