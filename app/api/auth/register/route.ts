import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword, generateVerificationCode } from '@/lib/auth'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/emails'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional(),
})

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

    // Generate 6-digit verification OTP code
    const verificationCode = generateVerificationCode()
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        verificationToken: verificationCode,
        verificationExpires,
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

    // Send verification email with OTP code
    await sendVerificationEmail(user.email, {
      name: user.name,
      code: verificationCode,
      email: user.email,
    })

    return NextResponse.json({
      user,
      message: 'Registration successful. Please check your email for the verification code.',
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