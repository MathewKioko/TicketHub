import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { canOrganise } from '@/lib/status'

export const maxDuration = 60 // seconds for large file uploads

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canOrganise(user.role)) {
      return NextResponse.json(
        { error: 'Organizer access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF, PNG, or JPG files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be under 10MB' },
        { status: 400 }
      )
    }

    // Convert file to base64 data URL
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update organizer profile with bank statement
    const profile = await prisma.eventOwnerProfile.upsert({
      where: { userId: user.id },
      update: {
        bankStatementUrl: dataUrl,
        bankStatementUploadedAt: new Date(),
        bankVerificationStatus: 'PENDING',
        bankVerified: false,
      },
      create: {
        userId: user.id,
        bankStatementUrl: dataUrl,
        bankStatementUploadedAt: new Date(),
        bankVerificationStatus: 'PENDING',
        bankVerified: false,
        paystackSplitRatio: 10,
        documentsVerified: false,
        autoPayout: false,
        payoutSchedule: 'manual',
        totalRevenue: 0,
        totalPayouts: 0,
        pendingPayouts: 0,
      },
    })

    return NextResponse.json({
      success: true,
      url: dataUrl,
      message: 'Bank statement uploaded. An administrator will review it.',
      profile,
    })
  } catch (error) {
    console.error('Bank statement upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
