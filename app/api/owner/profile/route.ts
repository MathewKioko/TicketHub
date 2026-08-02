import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createSubaccount, verifyBankAccount } from '@/lib/paystack-subaccounts'

// GET /api/owner/profile - Get event owner profile
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is event owner
    if (!['EVENT_OWNER', 'ORGANIZER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Event owner access required' }, { status: 403 })
    }

    const profile = await prisma.eventOwnerProfile.findUnique({
      where: { userId: currentUser.id },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// POST /api/owner/profile - Create/update event owner profile with Paystack subaccount
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is event owner
    if (!['EVENT_OWNER', 'ORGANIZER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Event owner access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      businessName,
      bankCode,
      accountNumber,
      accountName,
      splitRatio,
      autoPayout,
      payoutSchedule,
    } = body

    // Verify bank account first
    const verificationResult = await verifyBankAccount({
      bankCode,
      accountNumber,
    })

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: 'Invalid bank account details', details: verificationResult.error },
        { status: 400 }
      )
    }

    // Check if profile already exists
    const existingProfile = await prisma.eventOwnerProfile.findUnique({
      where: { userId: currentUser.id },
    })

    let profile

    if (existingProfile?.paystackSubaccountId) {
      // Update existing subaccount
      profile = await prisma.eventOwnerProfile.update({
        where: { userId: currentUser.id },
        data: {
          paystackBusinessName: businessName,
          paystackSettledBank: bankCode,
          paystackAccountNumber: accountNumber,
          paystackSplitRatio: splitRatio || 0,
          autoPayout: autoPayout || false,
          payoutSchedule: payoutSchedule || 'weekly',
          bankVerified: true,
        },
      })
    } else {
      // Create new Paystack subaccount
      const subaccountResult = await createSubaccount({
        businessName,
        bankCode,
        accountNumber,
        percentageCharge: splitRatio || 10, // Default 10% platform fee
        description: `Event owner: ${currentUser.name}`,
      })

      if (!subaccountResult.success) {
        return NextResponse.json(
          { error: 'Failed to create Paystack subaccount', details: subaccountResult.error },
          { status: 500 }
        )
      }

      // Create profile with subaccount
      profile = await prisma.eventOwnerProfile.create({
        data: {
          userId: currentUser.id,
          paystackSubaccountId: subaccountResult.subaccountCode,
          paystackBusinessName: businessName,
          paystackSettledBank: bankCode,
          paystackAccountNumber: accountNumber,
          paystackSplitRatio: splitRatio || 10,
          autoPayout: autoPayout || false,
          payoutSchedule: payoutSchedule || 'weekly',
          bankVerified: true,
        },
      })
    }

    return NextResponse.json({ profile, success: true })
  } catch (error) {
    console.error('Create profile error:', error)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}
