import axios, { AxiosRequestConfig } from 'axios'

const MPESA_BASE_URL =
  process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE
const MPESA_PASSKEY = process.env.MPESA_PASSKEY
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL
const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox'

function assertEnvVar(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required M-Pesa environment variable: ${name}`)
  }
  return value
}

function buildPassword(timestamp: string) {
  const shortCode = assertEnvVar(MPESA_SHORTCODE, 'MPESA_SHORTCODE')
  const passKey = process.env.MPESA_PASSKEY || ''
  const dataToEncode = `${shortCode}${passKey}${timestamp}`
  return Buffer.from(dataToEncode).toString('base64')
}

// Cache access token to reduce API calls
let cachedAccessToken: string | null = null
let tokenExpiryTime: number = 0
const TOKEN_CACHE_DURATION = 55 * 60 * 1000 // 55 minutes (tokens expire in 1 hour)

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < tokenExpiryTime) {
    return cachedAccessToken
  }

  const consumerKey = assertEnvVar(MPESA_CONSUMER_KEY, 'MPESA_CONSUMER_KEY')
  const consumerSecret = assertEnvVar(
    MPESA_CONSUMER_SECRET,
    'MPESA_CONSUMER_SECRET'
  )

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    'base64'
  )

  const config: AxiosRequestConfig = {
    method: 'GET',
    url: `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    timeout: 15000,
  }

  try {
    const response = await axios.request<{ access_token: string; expires_in?: number }>(config)

    if (!response.data?.access_token) {
      throw new Error('Failed to obtain M-Pesa access token')
    }

    // Cache the token
    cachedAccessToken = response.data.access_token
    const expiresIn = (response.data.expires_in || 3600) * 1000 // Default to 1 hour
    tokenExpiryTime = Date.now() + expiresIn - 5 * 60 * 1000 // Refresh 5 minutes before expiry

    return cachedAccessToken
  } catch (error: any) {
    // Clear cache on error
    cachedAccessToken = null
    tokenExpiryTime = 0

    if (error.response) {
      const status = error.response.status
      if (status === 401 || status === 403) {
        throw new Error('Invalid M-Pesa API credentials. Please check your MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET.')
      }
      throw new Error(`Failed to obtain M-Pesa access token: ${error.response.data?.error || error.message}`)
    }
    throw error
  }
}

type InitiateSTKPushParams = {
  amount: number
  phoneNumber: string
  accountReference: string
  transactionDesc?: string
  callbackUrl?: string
}

export async function initiateSTKPush({
  amount,
  phoneNumber,
  accountReference,
  transactionDesc = 'Event Ticket Purchase',
  callbackUrl,
}: InitiateSTKPushParams) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number')
  }

  const parsedAmount = Math.ceil(amount)
  const msisdn = phoneNumber.replace(/\D/g, '')
  if (!/^254\d{9}$/.test(msisdn)) {
    throw new Error('Phone number must be in format 2547XXXXXXXX')
  }

  const accessToken = await getAccessToken()
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14)

  const payload = {
    BusinessShortCode: assertEnvVar(MPESA_SHORTCODE, 'MPESA_SHORTCODE'),
    Password: buildPassword(timestamp),
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: parsedAmount,
    PartyA: msisdn,
    PartyB: assertEnvVar(MPESA_SHORTCODE, 'MPESA_SHORTCODE'),
    PhoneNumber: msisdn,
    CallBackURL: callbackUrl ?? assertEnvVar(MPESA_CALLBACK_URL, 'MPESA_CALLBACK_URL'),
    AccountReference: accountReference.substring(0, 12),
    TransactionDesc: transactionDesc.substring(0, 20) || 'Event Ticket',
  }

  try {
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    )

    return response.data
  } catch (error: any) {
    if (error.response) {
      // M-Pesa API returned an error response
      const status = error.response.status
      const data = error.response.data

      if (status === 429) {
        throw new Error('M-Pesa API rate limit exceeded. Please wait a moment and try again.')
      } else if (status === 403) {
        throw new Error('M-Pesa API access forbidden. Please check your API credentials.')
      } else if (status === 500) {
        throw new Error('M-Pesa API server error. Please try again later.')
      } else {
        const errorMessage = data?.errorMessage || data?.error_description || data?.message || `M-Pesa API error (${status})`
        throw new Error(errorMessage)
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('M-Pesa API request timeout. Please check your internet connection and try again.')
    } else {
      // Error setting up the request
      throw new Error(`M-Pesa request error: ${error.message}`)
    }
  }
}

type QuerySTKStatusParams = {
  checkoutRequestId: string
}

export async function querySTKPushStatus({
  checkoutRequestId,
}: QuerySTKStatusParams) {
  if (!checkoutRequestId) {
    throw new Error('checkoutRequestId is required')
  }

  const accessToken = await getAccessToken()
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14)

  const payload = {
    BusinessShortCode: assertEnvVar(MPESA_SHORTCODE, 'MPESA_SHORTCODE'),
    Password: buildPassword(timestamp),
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  }

  try {
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )

    return response.data
  } catch (error: any) {
    if (error.response) {
      // M-Pesa API returned an error response
      const status = error.response.status
      const data = error.response.data

      if (status === 429) {
        throw new Error('M-Pesa API rate limit exceeded. Please wait a moment before checking status again.')
      } else if (status === 403) {
        throw new Error('M-Pesa API access forbidden. Please check your API credentials.')
      } else if (status === 500) {
        throw new Error('M-Pesa API server error. Please try again later.')
      } else {
        const errorMessage = data?.errorMessage || data?.error_description || data?.message || `M-Pesa API error (${status})`
        throw new Error(errorMessage)
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('M-Pesa API request timeout. Please check your internet connection and try again.')
    } else {
      // Error setting up the request
      throw new Error(`M-Pesa request error: ${error.message}`)
    }
  }
}

export type MpesaCallbackResult = {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode: number
  ResultDesc: string
  CallbackMetadata?: {
    Item: Array<{
      Name: string
      Value?: string | number
    }>
  }
}

export function extractMpesaCallbackData(callback: MpesaCallbackResult) {
  const metadata = callback.CallbackMetadata?.Item ?? []
  const getValue = (name: string) =>
    metadata.find((item) => item.Name === name)?.Value

  return {
    amount: Number(getValue('Amount') ?? 0),
    mpesaReceiptNumber: String(getValue('MpesaReceiptNumber') ?? ''),
    transactionDate: String(getValue('TransactionDate') ?? ''),
    phoneNumber: String(getValue('PhoneNumber') ?? ''),
  }
}

export function isMpesaConfigured(): boolean {
  return Boolean(
    MPESA_CONSUMER_KEY &&
      MPESA_CONSUMER_SECRET &&
      MPESA_SHORTCODE &&
      MPESA_PASSKEY &&  
      MPESA_ENVIRONMENT
  )
}

// ============================================
// M-PESA B2C PAYOUT (Business to Customer)
// ============================================

/**
 * Send money from your M-Pesa business paybill/till to an organizer's M-Pesa number.
 * Uses Safaricom B2C API.
 */
export type B2CPayoutParams = {
  amount: number // Amount in KES
  phoneNumber: string // Organizer's M-Pesa number (2547XXXXXXXX)
  remark: string // Description for the transaction
  occasion?: string
}

export type B2CPayoutResponse = {
  success: boolean
  conversationID: string
  originatorConversationID: string
  responseDescription: string
  transactionID?: string
  message: string
}

export async function initiateB2CPayout({
  amount,
  phoneNumber,
  remark,
  occasion = 'TicketHub Payout',
}: B2CPayoutParams): Promise<B2CPayoutResponse> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Payout amount must be a positive number')
  }

  const parsedAmount = Math.ceil(amount)
  const msisdn = phoneNumber.replace(/\D/g, '')
  if (!/^254\d{9}$/.test(msisdn)) {
    throw new Error('Organizer phone number must be in format 2547XXXXXXXX')
  }

  const accessToken = await getAccessToken()
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14)

  const payload = {
    InitiatorName: process.env.MPESA_INITIATOR_NAME || '',
    SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || '',
    CommandID: 'BusinessPayment',
    Amount: parsedAmount,
    PartyA: assertEnvVar(MPESA_SHORTCODE, 'MPESA_SHORTCODE'), // Your business paybill/till
    PartyB: msisdn, // Organizer's M-Pesa number
    Remarks: remark.substring(0, 100),
    QueueTimeOutURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mpesa/b2c/timeout`,
    ResultURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mpesa/b2c/result`,
    Occasion: occasion.substring(0, 25),
  }

  try {
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/b2c/v1/paymentrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    return {
      success: true,
      conversationID: response.data.ConversationID ?? '',
      originatorConversationID: response.data.OriginatorConversationID ?? '',
      responseDescription: response.data.ResponseDescription ?? '',
      message: response.data.ResponseDescription ?? 'Payout initiated successfully',
    }
  } catch (error: any) {
    console.error('M-Pesa B2C payout error:', error.response?.data || error.message)
    if (error.response?.data?.errorMessage) {
      throw new Error(error.response.data.errorMessage)
    }
    if (error.response?.data?.error_description) {
      throw new Error(error.response.data.error_description)
    }
    throw new Error(error.message || 'M-Pesa B2C payout failed')
  }
}

/**
 * Query B2C transaction status
 */
export type B2CQueryParams = {
  conversationID: string
}

export async function queryB2CPayoutStatus({
  conversationID,
}: B2CQueryParams): Promise<{
  success: boolean
  resultCode: number
  resultDescription: string
  transactionID?: string
}> {
  if (!conversationID) {
    throw new Error('conversationID is required')
  }

  const accessToken = await getAccessToken()
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14)

  const payload = {
    InitiatorName: process.env.MPESA_INITIATOR_NAME || '',
    SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || '',
    CommandID: 'TransactionStatusQuery',
    TransactionID: conversationID,
    PartyA: assertEnvVar(MPESA_SHORTCODE, 'MPESA_SHORTCODE'),
    IdentifierType: '4', // Shortcode
    ResultURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mpesa/b2c/query/result`,
    QueueTimeOutURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mpesa/b2c/query/timeout`,
    Remarks: 'Query B2C payout status',
  }

  try {
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/transactionstatus/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    return {
      success: true,
      resultCode: response.data.ResultCode ?? -1,
      resultDescription: response.data.ResultDescription ?? '',
      transactionID: response.data.TransactionID,
    }
  } catch (error: any) {
    console.error('M-Pesa B2C query error:', error.response?.data || error.message)
    if (error.response?.data?.errorMessage) {
      throw new Error(error.response.data.errorMessage)
    }
    throw new Error(error.message || 'M-Pesa B2C query failed')
  }
}

export { getAccessToken }


