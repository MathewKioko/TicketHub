import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'PENDING', 'VERIFIED', 'REJECTED', or undefined for all

    const where: any = {}
    if (status && status !== 'all') {
      where.bankVerificationStatus = status
    } else {
      // Default: show pending verifications only
      where.bankVerificationStatus = 'PENDING'
    }

    const profiles = await prisma.eventOwnerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        bankStatementUploadedAt: 'desc',
      },
    })

    return NextResponse.json({
      profiles,
      pendingCount: profiles.filter((p) => p.bankVerificationStatus === 'PENDING').length,
    })
  } catch (error) {
    console.error('Admin bank verification list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
