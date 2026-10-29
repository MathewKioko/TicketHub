import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, revokeSession, logAuditAction } from '@/lib/auth'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get current session token
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (token) {
      await revokeSession(token)
    }

    // Clear the cookie
    cookieStore.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })

    // Log logout
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    await logAuditAction('LOGOUT', 'USER', user.id, 'User logged out', ipAddress, userAgent)

    return NextResponse.json({
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}