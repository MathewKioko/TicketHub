import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractMpesaCallbackData, type MpesaCallbackResult } from '@/lib/mpesa'

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

      // Update all tickets to CONFIRMED
      await prisma.ticket.updateMany({
        where: {
          mpesaCheckoutRequestId: CheckoutRequestID,
          status: 'PENDING',
        },
        data: {
          status: 'CONFIRMED',
          mpesaReceiptNumber,
        },
      })

      // Emit real-time ticket count update (BEAST LEVEL: Real-time updates)
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
        phoneNumber,
      })

      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    } else {
      // Payment failed or was cancelled
      console.log(`❌ M-Pesa payment failed: ${ResultDesc}`, {
        ResultCode,
        CheckoutRequestID,
      })

      // Optionally update tickets to CANCELLED or leave as PENDING
      // For now, we'll leave them as PENDING so user can retry
      
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
