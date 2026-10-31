import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { verifyBankAccount, createSubaccount } from '@/lib/paystack'

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

    // Validate required fields
    if (!businessName?.trim() || !accountNumber?.trim() || !bankCode?.trim() || !accountName?.trim()) {
      return NextResponse.json(
        { error: 'All bank account fields are required' },
        { status: 400 }
      )
    }

    // Attempt bank account verification via PayStack (non-blocking for infra issues)
    let bankVerified = false
    let verificationError: string | undefined
    try {
      const verificationResult = await verifyBankAccount({
        bankCode,
        accountNumber,
      })
      bankVerified = verificationResult.success
      verificationError = verificationResult.error
    } catch {
      // PayStack infrastructure issue — allow profile creation but mark as unverified
      bankVerified = false
      verificationError = 'Bank verification service unavailable'
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
          bankVerified: bankVerified,
        },
      })
    } else {
      // Create new Paystack subaccount (only if bank verified)
      let subaccountResult
      if (bankVerified) {
        try {
          subaccountResult = await createSubaccount({
            businessName,
            bankCode,
            accountNumber,
            accountName,
            percentageCharge: splitRatio || 10,
            description: `Event owner: ${currentUser.name}`,
          })
        } catch {
          subaccountResult = null
        }
      }

      if (subaccountResult?.success) {
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
      } else {
        // Create profile without subaccount — user needs admin approval for payouts
        profile = await prisma.eventOwnerProfile.create({
          data: {
            userId: currentUser.id,
            paystackBusinessName: businessName,
            paystackSettledBank: bankCode,
            paystackAccountNumber: accountNumber,
            paystackSplitRatio: splitRatio || 10,
            autoPayout: autoPayout || false,
            payoutSchedule: payoutSchedule || 'weekly',
            bankVerified: false,
          },
        })
      }
    }

    return NextResponse.json({
      profile,
      success: true,
      bankVerified,
      ...(verificationError ? { verificationError } : {}),
    })
  } catch (error) {
    console.error('Create profile error:', error)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}
