import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { querySTKPushStatus } from '@/lib/mpesa'
import { z } from 'zod'

const statusSchema = z.object({
  checkoutRequestId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { checkoutRequestId } = statusSchema.parse(body)

    // Verify the checkout request exists (no auth required)
    const ticket = await prisma.ticket.findFirst({
      where: {
        mpesaCheckoutRequestId: checkoutRequestId,
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Checkout request not found' },
        { status: 404 }
      )
    }

    // Query M-Pesa for payment status
    let statusResponse
    try {
      statusResponse = await querySTKPushStatus({ checkoutRequestId })
    } catch (mpesaError: any) {
      console.error('❌ M-Pesa Status Query Error:', mpesaError.message)
      // For rate limiting (429), return pending status instead of error
      if (mpesaError.message.includes('rate limit')) {
        return NextResponse.json({
          status: 'pending',
          resultCode: -1,
          resultDesc: 'Rate limit exceeded. Please wait a moment.',
          error: mpesaError.message,
        })
      }
      // For other errors, return error response
      return NextResponse.json(
        { 
          error: mpesaError.message || 'Failed to check M-Pesa payment status',
          status: 'error',
        },
        { status: 500 }
      )
    }

    // If payment is successful, update tickets
    if (statusResponse.ResultCode === 0 && statusResponse.ResultDesc === 'The service request is processed successfully.') {
      // Find all tickets with this checkout request ID
      const tickets = await prisma.ticket.findMany({
        where: {
          mpesaCheckoutRequestId: checkoutRequestId,
          status: 'PENDING',
        },
      })

      if (tickets.length > 0) {
        // Extract receipt number from response if available
        const receiptNumber = statusResponse.CheckoutRequestID || ''

        await prisma.ticket.updateMany({
          where: {
            mpesaCheckoutRequestId: checkoutRequestId,
            status: 'PENDING',
          },
          data: {
            status: 'CONFIRMED',
            mpesaReceiptNumber: receiptNumber,
          },
        })
      }
    }

    return NextResponse.json({
      status: statusResponse.ResultCode === 0 ? 'success' : 'pending',
      resultCode: statusResponse.ResultCode,
      resultDesc: statusResponse.ResultDesc,
      response: statusResponse,
    })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.errors },
        { status: 400 }
      )
    }

    if (err instanceof Error) {
      console.error('Error checking M-Pesa status:', err.message)
      return NextResponse.json(
        { error: err.message || 'Internal server error' },
        { status: 500 }
      )
    }

    console.error('Error checking M-Pesa status:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
