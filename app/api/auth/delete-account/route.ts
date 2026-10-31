import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirm: z.literal('DELETE', {
    errorMap: () => ({ message: 'You must type "DELETE" to confirm account deletion' }),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { password, confirm } = deleteAccountSchema.parse(body)

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, email: true, password: true, role: true },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Verify password matches
    const { verifyPassword } = await import('@/lib/auth')
    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
    }

    // Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin account. Assign another admin first.' },
          { status: 400 }
        )
      }
    }

    // Delete user and cascade-related data
    await prisma.user.delete({
      where: { id: user.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
