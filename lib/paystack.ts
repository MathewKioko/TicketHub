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

// ============================================
// PAYSTACK SUBACCOUNT (Revenue Split)
// ============================================

export type CreateSubaccountParams = {
  businessName: string
  bankCode: string
  accountNumber: string
  accountName: string
  percentageCharge: number // Platform's % cut (0-100)
  description?: string
  metadata?: Record<string, any>
}

export type CreateSubaccountResponse = {
  success: boolean
  subaccountCode: string
  subaccountId: number
  message: string
}

/**
 * Create a Paystack subaccount for an event organizer.
 * This enables automatic revenue split when customers pay.
 */
export async function createSubaccount(params: CreateSubaccountParams): Promise<CreateSubaccountResponse> {
  if (!params.businessName?.trim()) throw new Error('Business name is required')
  if (!params.bankCode?.trim()) throw new Error('Bank code is required')
  if (!params.accountNumber?.trim()) throw new Error('Account number is required')
  if (!params.accountName?.trim()) throw new Error('Account name is required')
  if (params.percentageCharge < 0 || params.percentageCharge > 100) {
    throw new Error('Percentage charge must be between 0 and 100')
  }

  const payload = {
    business_name: params.businessName.trim(),
    bank_code: params.bankCode.trim(),
    account_number: params.accountNumber.trim(),
    account_name: params.accountName.trim(),
    percentage_charge: params.percentageCharge, // Platform takes this %
    description: params.description ?? `TicketHub organizer subaccount`,
    metadata: {
      app: APP_NAME,
      platform_fee_percentage: params.percentageCharge,
      ...params.metadata,
    },
  }

  try {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: `${PAYSTACK_BASE_URL}/subaccount`,
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
        subaccount_code: string
        id: number
      }
    }>(config)

    if (response.data.status) {
      return {
        success: true,
        subaccountCode: response.data.data.subaccount_code,
        subaccountId: response.data.data.id,
        message: response.data.message,
      }
    } else {
      throw new Error(response.data.message || 'Failed to create subaccount')
    }
  } catch (error: any) {
    console.error('Paystack create subaccount error:', error.response?.data || error.message)
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error(error.message || 'Failed to create Paystack subaccount')
  }
}

/**
 * Update an existing Paystack subaccount (e.g., change split ratio or bank details)
 */
export type UpdateSubaccountParams = {
  subaccountCode: string
  businessName?: string
  bankCode?: string
  accountNumber?: string
  accountName?: string
  percentageCharge?: number
  description?: string
  isActive?: boolean
  metadata?: Record<string, any>
}

export async function updateSubaccount(params: UpdateSubaccountParams): Promise<CreateSubaccountResponse> {
  const payload: Record<string, any> = {}
  if (params.businessName) payload.business_name = params.businessName.trim()
  if (params.bankCode) payload.bank_code = params.bankCode.trim()
  if (params.accountNumber) payload.account_number = params.accountNumber.trim()
  if (params.accountName) payload.account_name = params.accountName.trim()
  if (params.percentageCharge !== undefined) {
    if (params.percentageCharge < 0 || params.percentageCharge > 100) {
      throw new Error('Percentage charge must be between 0 and 100')
    }
    payload.percentage_charge = params.percentageCharge
  }
  if (params.description) payload.description = params.description.trim()
  if (params.isActive !== undefined) payload.is_active = params.isActive
  if (params.metadata) payload.metadata = params.metadata

  try {
    const config: AxiosRequestConfig = {
      method: 'PUT',
      url: `${PAYSTACK_BASE_URL}/subaccount/${params.subaccountCode}`,
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
        subaccount_code: string
        id: number
      }
    }>(config)

    if (response.data.status) {
      return {
        success: true,
        subaccountCode: response.data.data.subaccount_code,
        subaccountId: response.data.data.id,
        message: response.data.message,
      }
    } else {
      throw new Error(response.data.message || 'Failed to update subaccount')
    }
  } catch (error: any) {
    console.error('Paystack update subaccount error:', error.response?.data || error.message)
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error(error.message || 'Failed to update Paystack subaccount')
  }
}

/**
 * List Paystack subaccounts (for admin reconciliation)
 */
export type ListSubaccountsParams = {
  perPage?: number
  page?: number
}

export async function listSubaccounts(params: ListSubaccountsParams = {}) {
  try {
    const paramsStr = new URLSearchParams({
      perPage: (params.perPage ?? 50).toString(),
      page: (params.page ?? 1).toString(),
    }).toString()

    const config: AxiosRequestConfig = {
      method: 'GET',
      url: `${PAYSTACK_BASE_URL}/subaccount?${paramsStr}`,
      headers: {
        Authorization: `Bearer ${assertEnvVar(PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY')}`,
      },
      timeout: 30000,
    }

    const response = await axios.request(config)
    return response.data
  } catch (error: any) {
    console.error('Paystack list subaccounts error:', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get bank codes from Paystack (for organizer bank selection dropdown)
 */
export async function listBanks() {
  try {
    const config: AxiosRequestConfig = {
      method: 'GET',
      url: `${PAYSTACK_BASE_URL}/bank`,
      headers: {
        Authorization: `Bearer ${assertEnvVar(PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }

    const response = await axios.request<{
      status: boolean
      data: Array<{
        name: string
        code: string
        slug: string
        longcode: string
        gateway: string
        pay_with_bank: boolean
        supports_transfer: boolean
        active: boolean
        country: string
        currency: string
        type: string
        is_deleted: boolean
        create: boolean
        mobile_banking: boolean
        ussd: boolean
        digital: boolean
      }>
    }>(config)

    return response.data
  } catch (error: any) {
    console.error('Paystack list banks error:', error.response?.data || error.message)
    throw error
  }
}

/**
 * Initiate a payout/transfer to an organizer's bank account
 */
export type TransferParams = {
  amount: number // Amount in smallest currency unit (cents for KES)
  recipientCode: string // Paystack transfer recipient code
  reason: string
  reference?: string
  currency?: string
}

export async function initiateTransfer(params: TransferParams): Promise<{
  success: boolean
  transferCode?: string
  transferId?: number
  message: string
}> {
  const payload = {
    source: 'balance',
    amount: Math.round(params.amount),
    recipient: params.recipientCode,
    reason: params.reason.trim(),
    reference: params.reference ?? `payout-${Date.now()}`,
    currency: params.currency ?? 'KES',
  }

  try {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: `${PAYSTACK_BASE_URL}/transfer`,
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
        transfer_code: string
        id: number
      }
    }>(config)

    if (response.data.status) {
      return {
        success: true,
        transferCode: response.data.data.transfer_code,
        transferId: response.data.data.id,
        message: response.data.message,
      }
    } else {
      throw new Error(response.data.message || 'Transfer failed')
    }
  } catch (error: any) {
    console.error('Paystack transfer error:', error.response?.data || error.message)
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error(error.message || 'Transfer failed')
  }
}

/**
 * Create a Paystack transfer recipient (bank account for payouts)
 */
export type CreateRecipientParams = {
  type: 'nuban'
  name: string
  accountNumber: string
  bankCode: string
  currency: string
  description?: string
  metadata?: Record<string, any>
}

export async function createRecipient(params: CreateRecipientParams): Promise<{
  success: boolean
  recipientCode: string
  recipientId: number
  message: string
}> {
  const payload = {
    type: params.type,
    name: params.name.trim(),
    account_number: params.accountNumber.trim(),
    bank_code: params.bankCode.trim(),
    currency: params.currency,
    description: params.description ?? `TicketHub organizer payout recipient`,
    metadata: {
      app: APP_NAME,
      ...params.metadata,
    },
  }

  try {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: `${PAYSTACK_BASE_URL}/transferrecipient`,
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
        recipient_code: string
        id: number
      }
    }>(config)

    if (response.data.status) {
      return {
        success: true,
        recipientCode: response.data.data.recipient_code,
        recipientId: response.data.data.id,
        message: response.data.message,
      }
    } else {
      throw new Error(response.data.message || 'Failed to create recipient')
    }
  } catch (error: any) {
    console.error('Paystack create recipient error:', error.response?.data || error.message)
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error(error.message || 'Failed to create Paystack recipient')
  }
}

/**
 * Verify a bank account using PayStack's resolve account endpoint.
 * Returns the account name if valid, throws if invalid.
 */
export type VerifyBankAccountParams = {
  bankCode: string
  accountNumber: string
}

export type VerifyBankAccountResult = {
  success: boolean
  accountName?: string
  bankName?: string
  error?: string
}

export async function verifyBankAccount({
  bankCode,
  accountNumber,
}: VerifyBankAccountParams): Promise<VerifyBankAccountResult> {
  if (!bankCode?.trim()) {
    return { success: false, error: 'Bank code is required' }
  }
  if (!accountNumber?.trim()) {
    return { success: false, error: 'Account number is required' }
  }

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
      {
        headers: {
          Authorization: `Bearer ${assertEnvVar(PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY')}`,
        },
        timeout: 15000,
      }
    )

    if (response.data.status && response.data.data) {
      return {
        success: true,
        accountName: response.data.data.account_name,
        bankName: response.data.data.bank_name,
      }
    } else {
      return {
        success: false,
        error: response.data.message || 'Account not found',
      }
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { success: false, error: 'Account number not found for this bank' }
    }
    if (error.response?.data?.message) {
      return { success: false, error: error.response.data.message }
    }
    return {
      success: false,
      error: error.message || 'Account verification failed',
    }
  }
}
