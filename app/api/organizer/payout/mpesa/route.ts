import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { canOrganise } from '@/lib/status'
import { initiateB2CPayout } from '@/lib/mpesa'

const mpesaPayoutSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  phoneNumber: z.string().regex(/^254\d{9}$/, 'Phone number must be in format 2547XXXXXXXX'),
  reason: z.string().min(1, 'Reason is required'),
})

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

    const body = await request.json()
    const { amount, phoneNumber, reason } = mpesaPayoutSchema.parse(body)

    // Get organizer's profile
    const profile = await prisma.eventOwnerProfile.findUnique({
      where: { userId: user.id },
    })

    if (!profile || !profile.paystackSubaccountId) {
      return NextResponse.json(
        { error: 'No payout account configured. Please complete organizer onboarding.' },
        { status: 400 }
      )
    }

    // Check pending payouts balance
    if (amount > profile.pendingPayouts) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: KES ${profile.pendingPayouts}` },
        { status: 400 }
      )
    }

    // Calculate platform fee and net amount
    const platformFee = Math.round((amount * profile.paystackSplitRatio) / 100 * 100) / 100
    const netAmount = amount - platformFee

    // Create Payout record (PENDING status)
    const payout = await prisma.payout.create({
      data: {
        eventOwnerId: user.id,
        amount: netAmount,
        currency: 'KES',
        grossAmount: amount,
        platformFee,
        netAmount,
        status: 'PENDING',
        reference: `MPESA-PAYOUT-${Date.now()}`,
        bankName: 'M-Pesa',
        accountNumber: phoneNumber,
      },
      select: {
        id: true,
        reference: true,
        amount: true,
        grossAmount: true,
        platformFee: true,
        netAmount: true,
        status: true,
        createdAt: true,
      },
    })

    // Initiate B2C payout via Safaricom
    let b2cResult
    try {
      b2cResult = await initiateB2CPayout({
        amount: netAmount,
        phoneNumber,
        remark: `TicketHub payout: ${reason}`,
        occasion: 'TicketHub Payout',
      })
    } catch (b2cError: any) {
      // If B2C fails, mark payout as failed
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'FAILED' },
      })

      // Refund pending payouts
      await prisma.eventOwnerProfile.update({
        where: { userId: user.id },
        data: {
          pendingPayouts: { increment: amount },
        },
      })

      return NextResponse.json(
        { error: `M-Pesa payout failed: ${b2cError.message}` },
        { status: 500 }
      )
    }

    // Update payout with B2C conversation ID and mark as processing
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: 'PROCESSING',
      },
    })

    // Deduct from pending payouts
    await prisma.eventOwnerProfile.update({
      where: { userId: user.id },
      data: {
        pendingPayouts: { decrement: amount },
        totalPayouts: { increment: netAmount },
      },
    })

    return NextResponse.json({
      success: true,
      payout: {
        ...payout,
        status: 'PROCESSING',
      },
      b2cResult: {
        conversationID: b2cResult.conversationID,
        responseDescription: b2cResult.responseDescription,
      },
      message: 'M-Pesa payout initiated. Funds will be delivered to your M-Pesa number shortly.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('M-Pesa payout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    const payouts = await prisma.payout.findMany({
      where: { eventOwnerId: user.id },
      select: {
        id: true,
        reference: true,
        amount: true,
        grossAmount: true,
        platformFee: true,
        netAmount: true,
        currency: true,
        status: true,
        bankName: true,
        accountNumber: true,
        processedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Also return organizer's current balance info
    const profile = await prisma.eventOwnerProfile.findUnique({
      where: { userId: user.id },
      select: {
        pendingPayouts: true,
        totalRevenue: true,
        totalPayouts: true,
        paystackSplitRatio: true,
      },
    })

    return NextResponse.json({
      payouts,
      balance: {
        pendingPayouts: profile?.pendingPayouts ?? 0,
        totalRevenue: profile?.totalRevenue ?? 0,
        totalPayouts: profile?.totalPayouts ?? 0,
        platformFeeRatio: profile?.paystackSplitRatio ?? 10,
      },
    })
  } catch (error) {
    console.error('Get M-Pesa payouts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
