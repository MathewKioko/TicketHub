import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractMpesaCallbackData, type MpesaCallbackResult } from '@/lib/mpesa'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const callbackData: MpesaCallbackResult = body.Body?.stkCallback || body

    // Extract callback data
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callbackData

    console.log('M-Pesa Callback received:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    })

    // Find tickets with this checkout request ID
    const tickets = await prisma.ticket.findMany({
      where: {
        mpesaCheckoutRequestId: CheckoutRequestID,
        status: 'PENDING',
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (tickets.length === 0) {
      console.warn(`No tickets found for CheckoutRequestID: ${CheckoutRequestID}`)
      // Still return success to M-Pesa to acknowledge receipt
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    // ResultCode 0 means success
    if (ResultCode === 0 && CallbackMetadata) {
      const { mpesaReceiptNumber, amount, phoneNumber, transactionDate } =
        extractMpesaCallbackData(callbackData)

      // Get organizer's profile for split ratio
      const organizerId = tickets[0].event.organizerId
      const profile = await prisma.eventOwnerProfile.findUnique({
        where: { userId: organizerId },
      })

      const platformFeeRatio = profile?.paystackSplitRatio ?? 10
      const platformFeeAmount = Math.round((amount * platformFeeRatio) / 100 * 100) / 100
      const organizerPayoutAmount = amount - platformFeeAmount

      // Create Payment records for each ticket
      await Promise.all(
        tickets.map(async (t) => {
          await prisma.payment.create({
            data: {
              userId: t.userId,
              eventId: t.eventId,
              amount: t.price * t.quantity,
              currency: 'KES',
              platformFee: platformFeeAmount / tickets.length,
              eventOwnerPayout: organizerPayoutAmount / tickets.length,
              status: 'SUCCESS',
              processedAt: new Date(),
              metadata: {
                mpesaReceiptNumber,
                paymentMethod: 'MPESA',
              },
            },
          })

          // Update ticket to CONFIRMED
          await prisma.ticket.update({
            where: { id: t.id },
            data: {
              status: 'CONFIRMED',
              mpesaReceiptNumber,
            },
          })
        })
      )

      // Update organizer pending payout balance
      if (profile) {
        await prisma.eventOwnerProfile.update({
          where: { userId: organizerId },
          data: {
            totalRevenue: { increment: organizerPayoutAmount },
            pendingPayouts: { increment: organizerPayoutAmount },
          },
        })
      }

      // Emit real-time ticket count update
      if (tickets.length > 0) {
        try {
          const eventId = tickets[0].event.id
          const { getSocketIO } = await import('@/lib/socket')
          const socketIO = getSocketIO()
          if (socketIO) {
            const confirmedCount = await prisma.ticket.count({
              where: {
                eventId,
                status: { in: ['CONFIRMED', 'CHECKED_IN'] },
              },
            })
            const { emitTicketCountUpdate } = await import('@/lib/socket')
            emitTicketCountUpdate(eventId, confirmedCount)
          }
        } catch (socketError) {
          console.warn('Socket.IO update failed:', socketError)
        }
      }

      console.log(`✅ M-Pesa payment confirmed for ${tickets.length} ticket(s)`, {
        receiptNumber: mpesaReceiptNumber,
        amount,
        platformFeeAmount,
        organizerPayoutAmount,
        phoneNumber,
      })

      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    } else {
      // Payment failed or was cancelled
      console.log(`❌ M-Pesa payment failed: ${ResultDesc}`, {
        ResultCode,
        CheckoutRequestID,
      })

      // Mark tickets as CANCELLED
      await prisma.ticket.updateMany({
        where: {
          mpesaCheckoutRequestId: CheckoutRequestID,
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
        },
      })

      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error)
    // Still return success to M-Pesa to acknowledge receipt
    // We don't want M-Pesa to retry if there's a processing error
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}

// M-Pesa may also send GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: 'M-Pesa callback endpoint is active' })
}
