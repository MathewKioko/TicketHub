import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { logAuditAction } from '@/lib/auth'
import { headers } from 'next/headers'

const verifySchema = z.object({
  code: z.string().length(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = verifySchema.parse(body)

    // Find user with a valid (non-expired) OTP
    const user = await prisma.user.findFirst({
      where: {
        otp: code,
        otpExpires: {
          gt: new Date(),
        },
        verified: false,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Update user as verified and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        otp: null,
        otpExpires: null,
      },
    })

    // Log verification
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    await logAuditAction('OTP_VERIFICATION', 'USER', user.id, 'Email/OTP verification successful', ipAddress, userAgent)

    return NextResponse.json({
      message: 'Email verified successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
