import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { initiateSTKPush } from '@/lib/mpesa'
import { z } from 'zod'

const mpesaCheckoutSchema = z.object({
  ticketIds: z.array(z.string()).min(1),
  phoneNumber: z.string().regex(/^254\d{9}$/, 'Phone number must be in format 2547XXXXXXXX'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketIds, phoneNumber } = mpesaCheckoutSchema.parse(body)

    // Verify tickets exist and are pending (no auth required)
    const tickets = await prisma.ticket.findMany({
      where: {
        id: { in: ticketIds },
        status: 'PENDING',
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            currency: true,
          },
        },
      },
    })

    if (tickets.length !== ticketIds.length) {
      return NextResponse.json(
        { error: 'Invalid tickets' },
        { status: 400 }
      )
    }

    if (tickets.length === 0) {
      return NextResponse.json(
        { error: 'No tickets found' },
        { status: 400 }
      )
    }

    const eventId = tickets[0].eventId
    const event = tickets[0].event
    
    // Calculate total amount
    const totalAmount = tickets.reduce(
      (sum: number, ticket: { price: number }) => sum + ticket.price,
      0
    )

    // Convert to KES if needed (M-Pesa uses KES)
    let amountInKES = totalAmount
    if (event.currency !== 'KES') {
      // Get exchange rate from env or use default
      const exchangeRate = event.currency === 'USD' 
        ? parseFloat(process.env.USD_TO_KES_RATE || '130')
        : 1
      amountInKES = totalAmount * exchangeRate
    }

    // Round to whole shillings (M-Pesa doesn't accept decimals)
    const amount = Math.ceil(amountInKES)

    // Generate account reference (use event ID and ticket IDs)
    const accountReference = `EVT${eventId.slice(-8)}${ticketIds[0].slice(-6)}`

    // Get callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/api/mpesa/callback`

    // Initiate STK Push
    console.log('🚀 Initiating M-Pesa STK Push:', {
      amount,
      phoneNumber,
      accountReference,
      eventTitle: event.title,
      ticketCount: tickets.length,
      callbackUrl,
    })

    let stkResponse
    try {
      stkResponse = await initiateSTKPush({
        amount,
        phoneNumber,
        accountReference,
        transactionDesc: `${event.title} - ${tickets.length} ticket(s)`,
        callbackUrl,
      })
    } catch (mpesaError: any) {
      console.error('❌ M-Pesa STK Push Error:', mpesaError.message)
      return NextResponse.json(
        { 
          error: mpesaError.message || 'Failed to initiate M-Pesa payment',
          details: 'Please check your M-Pesa API credentials and try again.',
        },
        { status: 500 }
      )
    }

    console.log('📱 M-Pesa STK Push Response:', {
      ResponseCode: stkResponse.ResponseCode,
      CustomerMessage: stkResponse.CustomerMessage,
      CheckoutRequestID: stkResponse.CheckoutRequestID,
      MerchantRequestID: stkResponse.MerchantRequestID,
    })

    // Check if STK Push was successful
    if (stkResponse.ResponseCode !== '0') {
      return NextResponse.json(
        { 
          error: stkResponse.CustomerMessage || 'Failed to initiate M-Pesa payment',
          responseCode: stkResponse.ResponseCode,
        },
        { status: 400 }
      )
    }

    // Update tickets with M-Pesa checkout request IDs
    await prisma.ticket.updateMany({
      where: { id: { in: ticketIds } },
      data: {
        paymentMethod: 'MPESA',
        mpesaCheckoutRequestId: stkResponse.CheckoutRequestID,
        mpesaMerchantRequestId: stkResponse.MerchantRequestID,
        mpesaPhoneNumber: phoneNumber,
      },
    })

    console.log('✅ Tickets updated with M-Pesa checkout info:', {
      ticketIds,
      checkoutRequestId: stkResponse.CheckoutRequestID,
    })

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      merchantRequestId: stkResponse.MerchantRequestID,
      customerMessage: stkResponse.CustomerMessage,
      message: 'M-Pesa payment request sent to your phone. Please complete the payment on your phone.',
    })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.errors },
        { status: 400 }
      )
    }

    if (err instanceof Error) {
      console.error('Error initiating M-Pesa checkout:', err.message)
      return NextResponse.json(
        { error: err.message || 'Internal server error' },
        { status: 500 }
      )
    }

    console.error('Error initiating M-Pesa checkout:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
