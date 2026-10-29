import axios, { AxiosRequestConfig } from 'axios'

// Environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co'
const APP_NAME = process.env.APP_NAME || 'tickethub'
const INTERNAL_WEBHOOK_SECRET = process.env.INTERNAL_WEBHOOK_SECRET

function assertEnvVar(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required Paystack environment variable: ${name}`)
  }
  return value
}

// Generate unique reference for tickets
export function generateTicketReference(): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 10)
  return `TICKET_${timestamp}_${randomString}`
}

// Validate reference format
export function isValidTicketReference(reference: string): boolean {
  return /^TICKET_\d+_[a-z0-9]+$/.test(reference)
}

// Initialize Payment Request Types
export type InitializePaymentParams = {
  email: string
  amount: number // Amount in smallest currency unit (kobo for NGN, cents for USD)
  reference?: string
  userId: string
  eventId: string
  ticketIds?: string[]
  callbackUrl?: string
  metadata?: Record<string, any>
}

export type InitializePaymentResponse = {
  success: boolean
  reference: string
  authorizationUrl: string
  accessCode?: string
  message?: string
}

// Initialize Paystack Payment
export async function initializePayment({
  email,
  amount,
  reference,
  userId,
  eventId,
  ticketIds,
  callbackUrl,
  metadata,
}: InitializePaymentParams): Promise<InitializePaymentResponse> {
  // Validate inputs
  if (!email || !email.includes('@')) {
    throw new Error('Valid email is required')
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number')
  }

  const generatedReference = reference || generateTicketReference()

  // Build metadata for routing and idempotency
  const paymentMetadata = {
    app: APP_NAME,
    eventId,
    userId,
    ticketIds: ticketIds || [],
    ...metadata,
  }

  const payload = {
    email,
    phone: metadata?.phone || '',
    amount: Math.round(amount), // Ensure integer
    currency: 'KES',
    reference: generatedReference,
    callback_url: callbackUrl,
    metadata: paymentMetadata,
    channels: ['mobile_money', 'card', 'bank', 'ussd'],
  }

  try {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: `${PAYSTACK_BASE_URL}/transaction/initialize`,
      headers: {
        Authorization: `Bearer ${assertEnvVar(PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      data: payload,
      timeout: 30000,
    }

    const response = await axios.request<{
      status: boolean
      message: string
      data: {
        reference: string
        authorization_url: string
        access_code: string
      }
    }>(config)

    if (response.data.status) {
      return {
        success: true,
        reference: response.data.data.reference,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
      }
    } else {
      throw new Error(response.data.message || 'Failed to initialize payment')
    }
  } catch (error: any) {
    console.error('Paystack initialize error:', error.response?.data || error.message)
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 401) {
        throw new Error('Invalid Paystack API credentials')
      } else if (status === 400) {
        throw new Error(data.message || 'Invalid payment request')
      } else if (status === 422) {
        throw new Error(data.message || 'Validation error')
      } else {
        throw new Error(`Paystack API error: ${data.message || error.message}`)
      }
    } else if (error.request) {
      throw new Error('Paystack API request timeout. Please check your connection')
    } else {
      throw new Error(`Paystack initialization error: ${error.message}`)
    }
  }
}

// Verify Payment Request Types
export type VerifyPaymentParams = {
  reference: string
}

export type VerifyPaymentResponse = {
  success: boolean
  verified: boolean
  status: string
  amount: number
  currency: string
  reference: string
  metadata: {
    app?: string
    eventId?: string
    userId?: string
    ticketIds?: string[]
  }
  customer: {
    email: string
    phone?: string
  }
  authorization?: {
    bank?: string
    cardType?: string
    last4?: string
  }
}

// Verify Paystack Payment
export async function verifyPayment({ reference }: VerifyPaymentParams): Promise<VerifyPaymentResponse> {
  if (!reference) {
    throw new Error('Reference is required')
  }

  // Validate reference format for security
  if (!isValidTicketReference(reference)) {
    throw new Error('Invalid reference format')
  }

  try {
    const config: AxiosRequestConfig = {
      method: 'GET',
      url: `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      headers: {
        Authorization: `Bearer ${assertEnvVar(PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY')}`,
      },
      timeout: 30000,
    }

    const response = await axios.request<{
      status: boolean
      message: string
      data: {
        id: number
        reference: string
        amount: number
        currency: string
        status: string
        metadata: Record<string, any>
        customer: {
          email: string
          phone: string
        }
        authorization: {
          bank: string
          card_type: string
          last4: string
        }
      }
    }>(config)

    if (response.data.status) {
      const data = response.data.data
      
      return {
        success: true,
        verified: data.status === 'success',
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        reference: data.reference,
        metadata: {
          app: data.metadata?.app,
          eventId: data.metadata?.eventId,
          userId: data.metadata?.userId,
          ticketIds: data.metadata?.ticketIds,
        },
        customer: {
          email: data.customer.email,
          phone: data.customer.phone,
        },
        authorization: {
          bank: data.authorization?.bank,
          cardType: data.authorization?.card_type,
          last4: data.authorization?.last4,
        },
      }
    } else {
      throw new Error(response.data.message || 'Verification failed')
    }
  } catch (error: any) {
    console.error('Paystack verify error:', error.response?.data || error.message)
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 404) {
        throw new Error('Transaction not found')
      } else if (status === 401) {
        throw new Error('Invalid Paystack API credentials')
      } else {
        throw new Error(`Paystack API error: ${data.message || error.message}`)
      }
    } else if (error.request) {
      throw new Error('Paystack API request timeout')
    } else {
      throw new Error(`Paystack verification error: ${error.message}`)
    }
  }
}

// Webhook Event Types
export type PaystackWebhookEvent = {
  event: string
  data: {
    id: number
    reference: string
    amount: number
    currency: string
    status: string
    metadata: Record<string, any>
    customer: {
      email: string
      phone: string
    }
    authorization: {
      bank: string
      card_type: string
      last4: string
    }
  }
}

// List Transactions (for reconciliation)
export type ListTransactionsParams = {
  perPage?: number
  page?: number
  from?: string
  to?: string
}

export async function listTransactions({
  perPage = 50,
  page = 1,
  from,
  to,
}: ListTransactionsParams) {
  try {
    const params = new URLSearchParams({
      perPage: perPage.toString(),
      page: page.toString(),
    })

    if (from) params.append('from', from)
    if (to) params.append('to', to)

    const config: AxiosRequestConfig = {
      method: 'GET',
      url: `${PAYSTACK_BASE_URL}/transaction?${params.toString()}`,
      headers: {
        Authorization: `Bearer ${assertEnvVar(PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY')}`,
      },
      timeout: 30000,
    }

    const response = await axios.request(config)
    return response.data
  } catch (error: any) {
    console.error('Paystack list transactions error:', error.response?.data || error.message)
    throw error
  }
}

// Export configuration for frontend
export function getPaystackPublicKey(): string {
  return assertEnvVar(PAYSTACK_PUBLIC_KEY, 'PAYSTACK_PUBLIC_KEY')
}

export function getInternalWebhookSecret(): string {
  return assertEnvVar(INTERNAL_WEBHOOK_SECRET, 'INTERNAL_WEBHOOK_SECRET')
}
