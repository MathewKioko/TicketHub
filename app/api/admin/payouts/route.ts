import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/payouts - List all payouts
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if Payout model exists
    if (!prisma.payout) {
      return NextResponse.json({ payouts: [], message: 'Payout model not available in database' })
    }

    // Enrich payouts with payment method info from associated tickets
    const enrichedPayouts = await Promise.all(
      payouts.map(async (payout) => {
        // Find associated tickets with payment method info
        const tickets = await prisma.ticket.findMany({
          where: {
            OR: [
              { mpesaCheckoutRequestId: { not: null } },
              { paystackReference: { not: null } },
            ],
          },
          select: {
            paymentMethod: true,
            mpesaReceiptNumber: true,
            mpesaPhoneNumber: true,
            paystackReference: true,
            paystackAccessCode: true,
          },
        })

        const associatedTicket = tickets.find(
          (t) => t.paymentMethod === payout.paymentMethod || 
                  (payout.paymentMethod === 'MPESA' && t.mpesaReceiptNumber) ||
                  (payout.paymentMethod === 'PAYSTACK' && t.paystackReference)
        )

        return {
          ...payout,
          paymentMethod: associatedTicket?.paymentMethod || 'PAYSTACK',
          ...(associatedTicket?.paymentMethod === 'MPESA' && {
            mpesaReceiptNumber: associatedTicket.mpesaReceiptNumber,
            mpesaPhoneNumber: associatedTicket.mpesaPhoneNumber,
          }),
          ...(associatedTicket?.paymentMethod === 'PAYSTACK' && {
            paystackReference: associatedTicket.paystackReference,
          }),
        }
      })
    )

    return NextResponse.json({ payouts: enrichedPayouts })
  } catch (error) {
    console.error('Admin payouts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}
