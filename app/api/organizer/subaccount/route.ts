import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { canOrganise } from '@/lib/status'
import {
  createSubaccount,
  createRecipient,
  updateSubaccount,
} from '@/lib/paystack'

const subaccountSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  accountName: z.string().min(2, 'Account name is required'),
  accountNumber: z.string().min(8, 'Account number is required'),
  bankCode: z.string().min(2, 'Bank code is required'),
  splitPercentage: z.number().min(0).max(100, 'Platform fee must be 0-100'),
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
    const { businessName, accountName, accountNumber, bankCode, splitPercentage } =
      subaccountSchema.parse(body)

    // Check if subaccount already exists
    const existingProfile = await prisma.eventOwnerProfile.findUnique({
      where: { userId: user.id },
    })

    if (existingProfile?.paystackSubaccountId) {
      return NextResponse.json(
        { error: 'Payout account already exists' },
        { status: 400 }
      )
    }

    // Step 1: Create Paystack subaccount (automatic revenue split)
    const subaccount = await createSubaccount({
      businessName,
      bankCode,
      accountNumber,
      accountName,
      percentageCharge: splitPercentage, // Platform keeps this %
      description: `TicketHub organizer: ${user.name}`,
      metadata: {
        organizerId: user.id,
        organizerEmail: user.email,
        platformFeePercentage: splitPercentage,
      },
    })

    // Step 2: Create Paystack transfer recipient (for manual payouts)
    const recipient = await createRecipient({
      type: 'nuban',
      name: accountName,
      accountNumber,
      bankCode,
      currency: 'KES',
      description: `TicketHub organizer payout: ${user.name}`,
      metadata: {
        organizerId: user.id,
        organizerEmail: user.email,
      },
    })

    // Step 3: Save to EventOwnerProfile
    const profile = await prisma.eventOwnerProfile.upsert({
      where: { userId: user.id },
      update: {
        paystackSubaccountId: subaccount.subaccountCode,
        paystackBusinessName: businessName,
        paystackSettledBank: bankCode,
        paystackAccountNumber: accountNumber,
        paystackSplitRatio: splitPercentage,
      },
      create: {
        userId: user.id,
        paystackSubaccountId: subaccount.subaccountCode,
        paystackBusinessName: businessName,
        paystackSettledBank: bankCode,
        paystackAccountNumber: accountNumber,
        paystackSplitRatio: splitPercentage,
      },
      select: {
        id: true,
        paystackSubaccountId: true,
        paystackBusinessName: true,
        paystackSplitRatio: true,
        bankVerified: true,
        documentsVerified: true,
      },
    })

    // Update user role if needed
    if (user.role !== 'EVENT_OWNER' && user.role !== 'ORGANIZER') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'EVENT_OWNER' },
      })
    }

    return NextResponse.json({
      success: true,
      subaccount: {
        code: subaccount.subaccountCode,
        id: subaccount.subaccountId,
      },
      recipient: {
        code: recipient.recipientCode,
        id: recipient.recipientId,
      },
      profile,
      message: 'Payout account created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create subaccount error:', error)
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

    const profile = await prisma.eventOwnerProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        paystackSubaccountId: true,
        paystackBusinessName: true,
        paystackSettledBank: true,
        paystackAccountNumber: true,
        paystackSplitRatio: true,
        bankVerified: true,
        documentsVerified: true,
        totalRevenue: true,
        totalPayouts: true,
        pendingPayouts: true,
        autoPayout: true,
        payoutSchedule: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      profile,
    })
  } catch (error) {
    console.error('Get subaccount error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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
    const { splitPercentage } = body

    const profile = await prisma.eventOwnerProfile.findUnique({
      where: { userId: user.id },
    })

    if (!profile?.paystackSubaccountId) {
      return NextResponse.json(
        { error: 'No payout account found' },
        { status: 404 }
      )
    }

    // Update Paystack subaccount if split percentage changed
    if (splitPercentage !== undefined) {
      const split = parseInt(splitPercentage, 10)
      if (split < 0 || split > 100) {
        return NextResponse.json(
          { error: 'Split percentage must be 0-100' },
          { status: 400 }
        )
      }

      await updateSubaccount({
        subaccountCode: profile.paystackSubaccountId,
        percentageCharge: split,
      })
    }

    const updated = await prisma.eventOwnerProfile.update({
      where: { userId: user.id },
      data: {
        ...(splitPercentage !== undefined ? { paystackSplitRatio: parseInt(splitPercentage, 10) } : {}),
      },
      select: {
        paystackSplitRatio: true,
        paystackSubaccountId: true,
        autoPayout: true,
        payoutSchedule: true,
      },
    })

    return NextResponse.json({
      success: true,
      profile: updated,
      message: 'Payout settings updated',
    })
  } catch (error) {
    console.error('Update subaccount error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
