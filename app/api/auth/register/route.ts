import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendVerificationCodeEmail } from '@/lib/emails'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional(),
})

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate 6-digit OTP valid for 10 minutes
    const otp = generateOtp()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        otp,
        otpExpires,
        verified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        verified: true,
        createdAt: true,
      },
    })

    const emailResult = await sendVerificationCodeEmail(user.email, {
      name: user.name || 'there',
      code: otp,
    })

    if (!emailResult.success) {
      console.warn(`[VERIFY] Verification email could not be sent for ${email}:`, emailResult.error)
    }

    return NextResponse.json({
      user,
      message: 'Registration successful. Please check your email for a verification code.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}