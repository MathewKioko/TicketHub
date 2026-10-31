import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { canOrganise } from '@/lib/status'
import { initiateTransfer } from '@/lib/paystack'

const payoutSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
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
    const { amount, reason } = payoutSchema.parse(body)

    // Get organizer's profile with recipient code
    const profile = await prisma.eventOwnerProfile.findUnique({
      where: { userId: user.id },
    })

    if (!profile || !profile.paystackSubaccountId) {
      return NextResponse.json(
        { error: 'No payout account configured. Please complete organizer onboarding.' },
        { status: 400 }
      )
    }

    if (!profile.bankVerified) {
      return NextResponse.json(
        { error: 'Bank account not verified by admin. Please upload your bank statement and wait for approval.' },
        { status: 403 }
      )
    }

    // Check pending payouts balance
    if (amount > profile.pendingPayouts) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: KES ${profile.pendingPayouts}` },
        { status: 400 }
      )
    }

    // For automatic split via subaccount, funds are already split on Paystack side.
    // But we still create a Payout record for tracking.
    //
    // To actually transfer money to organizer's bank, we'd need a transfer recipient
    // code. For now, we record the payout intent and mark it pending.
    //
    // In production, you'd call initiateTransfer with the recipient code.
    // For subaccounts, Paystack holds the split amount and you transfer it out.

    // Calculate gross and net
    const platformFee = Math.round((amount * profile.paystackSplitRatio) / 100 * 100) / 100
    const netAmount = amount - platformFee

    const payout = await prisma.payout.create({
      data: {
        eventOwnerId: user.id,
        amount: netAmount,
        currency: 'KES',
        grossAmount: amount,
        platformFee,
        netAmount,
        status: 'PENDING',
        reference: `PAYOUT-${Date.now()}`,
        bankName: profile.paystackSettledBank,
        accountNumber: profile.paystackAccountNumber,
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

    // Update pending payouts
    await prisma.eventOwnerProfile.update({
      where: { userId: user.id },
      data: {
        pendingPayouts: profile.pendingPayouts - amount,
      },
    })

    return NextResponse.json({
      success: true,
      payout,
      message: 'Payout request created. It will be processed and transferred to your bank account.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Payout error:', error)
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
        paystackPayoutId: true,
        paystackBatchId: true,
        processedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ payouts })
  } catch (error) {
    console.error('Get payouts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
