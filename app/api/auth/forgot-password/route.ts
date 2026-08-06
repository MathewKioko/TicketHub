import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/emails'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return NextResponse.json({
        message: 'If that email exists, a password reset link has been sent.',
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: resetToken,
        verificationExpires: resetExpires,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://tickethubke.app' : 'http://localhost:3000')
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

    await sendPasswordResetEmail(user.email, {
      name: user.name || 'there',
      verificationUrl: resetUrl,
    })

    return NextResponse.json({
      message: 'If that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
