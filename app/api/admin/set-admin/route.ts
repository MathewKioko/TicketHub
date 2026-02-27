import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Hidden admin endpoint to set a user as admin
// Usage: POST /api/admin/set-admin?email=user@example.com&secret=YOUR_SECRET_KEY
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const secret = searchParams.get('secret')

    // Verify secret key (should match environment variable)
    const adminSecret = process.env.ADMIN_SECRET_KEY || 'tickethub-admin-secret-2024'
    if (secret !== adminSecret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find and update user
    const user = await prisma.user.update({
      where: { email },
      data: { 
        role: 'ADMIN',
        verified: true 
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: `User ${email} is now an ADMIN`,
      userId: user.id 
    })
  } catch (error) {
    console.error('Set admin error:', error)
    return NextResponse.json({ error: 'Failed to set admin' }, { status: 500 })
  }
}
