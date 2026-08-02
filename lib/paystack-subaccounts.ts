/**
 * Paystack Subaccount Management for TicketHub v2
 * Handles revenue split between platform and event owners
 */

import axios from 'axios'

const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co'
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

/**
 * Create a Paystack subaccount for an event owner
 * This allows revenue to be split between platform and event owner
 */
export async function createSubaccount(params: {
  businessName: string
  bankCode: string
  accountNumber: string
  percentageCharge?: number // Platform fee percentage (0-100)
  description?: string
}): Promise<{
  success: boolean
  subaccountCode?: string
  error?: string
}> {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/subaccount`,
      {
        business_name: params.businessName,
        bank_code: params.bankCode,
        account_number: params.accountNumber,
        percentage_charge: params.percentageCharge || 0,
        description: params.description || 'TicketHub Event Owner',
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.status) {
      return {
        success: true,
        subaccountCode: response.data.data.subaccount_code,
      }
    } else {
      return {
        success: false,
        error: response.data.message,
      }
    }
  } catch (error: any) {
    console.error('Paystack subaccount creation error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    }
  }
}

/**
 * Update a Paystack subaccount
 */
export async function updateSubaccount(params: {
  subaccountCode: string
  businessName?: string
  bankCode?: string
  accountNumber?: string
  percentageCharge?: number
}): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const updateData: any = {}
    if (params.businessName) updateData.business_name = params.businessName
    if (params.bankCode) updateData.bank_code = params.bankCode
    if (params.accountNumber) updateData.account_number = params.accountNumber
    if (params.percentageCharge !== undefined) updateData.percentage_charge = params.percentageCharge

    const response = await axios.put(
      `${PAYSTACK_BASE_URL}/subaccount/${params.subaccountCode}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return {
      success: response.data.status,
      error: response.data.message,
    }
  } catch (error: any) {
    console.error('Paystack subaccount update error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    }
  }
}

/**
 * Get subaccount details
 */
export async function getSubaccount(subaccountCode: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/subaccount/${subaccountCode}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    if (response.data.status) {
      return {
        success: true,
        data: response.data.data,
      }
    } else {
      return {
        success: false,
        error: response.data.message,
      }
    }
  } catch (error: any) {
    console.error('Paystack subaccount fetch error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    }
  }
}

/**
 * List all subaccounts
 */
export async function listSubaccounts(params?: {
  perPage?: number
  page?: number
}): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    const response = await axios.get(`${PAYSTACK_BASE_URL}/subaccount`, {
      params: {
        perPage: params?.perPage || 50,
        page: params?.page || 1,
      },
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    return {
      success: response.data.status,
      data: response.data.data,
    }
  } catch (error: any) {
    console.error('Paystack subaccount list error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    }
  }
}

/**
 * Initialize payment with revenue split
 * Uses Paystack's split payment feature
 */
export async function initializeSplitPayment(params: {
  email: string
  amount: number // in kobo/smallest unit
  reference: string
  callbackUrl: string
  metadata?: Record<string, any>
  subaccount?: string
  splitPercentage?: number // Alternative to subaccount: flat percentage
}): Promise<{
  success: boolean
  authorizationUrl?: string
  accessCode?: string
  reference?: string
  error?: string
}> {
  try {
    // Build split configuration
    const split: any = {
      type: 'percentage',
      percentage_split: params.splitPercentage || 0,
    }

    // If subaccount is provided, add it to the split
    if (params.subaccount) {
      split.subaccount = params.subaccount
      split.bearer_type = 'subaccount'
    }

    const payload: any = {
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      split,
    }

    // If no subaccount, remove split (use platform-only payment)
    if (!params.subaccount) {
      delete payload.split
    }

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.status) {
      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference,
      }
    } else {
      return {
        success: false,
        error: response.data.message,
      }
    }
  } catch (error: any) {
    console.error('Paystack split payment initialization error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    }
  }
}

/**
 * Get list of Nigerian banks for subaccount creation
 */
export async function getBanks(): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    const response = await axios.get(`${PAYSTACK_BASE_URL}/bank`, {
      params: { country: 'nigeria' },
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    return {
      success: response.data.status,
      data: response.data.data,
    }
  } catch (error: any) {
    console.error('Paystack banks fetch error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    }
  }
}

/**
 * Verify bank account details
 */
export async function verifyBankAccount(params: {
  bankCode: string
  accountNumber: string
}): Promise<{
  success: boolean
  data?: {
    accountNumber: string
    accountName: string
    bankCode: string
  }
  error?: string
}> {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/bank/resolve`,
      {
        params: {
          account_number: params.accountNumber,
          bank_code: params.bankCode,
        },
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    if (response.data.status) {
      return {
        success: true,
        data: response.data.data,
      }
    } else {
      return {
        success: false,
        error: response.data.message,
      }
    }
  } catch (error: any) {
    console.error('Paystack bank verification error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    }
  }
}

/**
 * Create a payout/batch transfer to event owner
 */
export async function createPayout(params: {
  subaccount: string
  amount: number // in kobo
  reference: string
  bankCode: string
  accountNumber: string
}): Promise<{
  success: boolean
  payoutBatchId?: string
  error?: string
}> {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/payout`,
      {
        subaccount: params.subaccount,
        amount: params.amount,
        reference: params.reference,
        bank_code: params.bankCode,
        account_number: params.accountNumber,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.status) {
      return {
        success: true,
        payoutBatchId: response.data.data.batch_id,
      }
    } else {
      return {
        success: false,
        error: response.data.message,
      }
    }
  } catch (error: any) {
    console.error('Paystack payout error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    }
  }
}
