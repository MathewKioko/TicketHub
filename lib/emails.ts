/**
 * Email Notification Service for TicketHub v2
 * Placeholder for email notifications - can be integrated with SendGrid, Mailgun, etc.
 */

import { audit } from './audit'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@tickethub.co.ke'

let resend: any = null
if (RESEND_API_KEY) {
  try {
    const { Resend } = require('resend')
    resend = new Resend(RESEND_API_KEY)
  } catch {
    // Resend not available, will fall back to logging
  }
}

/**
 * Send email via Resend or fall back to logging
 */
async function sendResendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    console.log(`[EMAIL] Resend not configured. Would send to ${to}: ${subject}`)
    console.log(`[EMAIL] HTML:`, html)
    return { success: true, messageId: `email_${Date.now()}` }
  }

  try {
    const data = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    })
    return { success: true, messageId: data.id }
  } catch (error) {
    console.error(`[EMAIL] Resend failed:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export type EmailTemplate = 
  | 'ticket_confirmation'
  | 'payment_receipt'
  | 'event_reminder'
  | 'ticket_refund'
  | 'payout_processed'
  | 'event_cancelled'
  | 'account_verification'
  | 'password_reset'

type EmailData = {
  ticketConfirmation?: {
    ticketId: string
    eventTitle: string
    eventDate: string
    venue: string
    ticketType: string
    quantity: number
    amount: number
  }
  paymentReceipt?: {
    paymentId: string
    amount: number
    eventTitle: string
    reference: string
  }
  eventReminder?: {
    eventTitle: string
    eventDate: string
    venue: string
    ticketCount: number
  }
  refund?: {
    ticketId: string
    amount: number
    reason?: string
  }
  payout?: {
    amount: number
    bankName: string
    accountNumber: string
  }
  eventCancelled?: {
    eventTitle: string
    reason?: string
  }
  passwordReset?: {
    name: string
    resetUrl: string
  }
  verification?: {
    name: string
    verificationUrl: string
  }
}

/**
 * Send email notification
 * This is a placeholder - integrate with actual email service
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  data: EmailData,
  subject?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Build HTML body based on template
    const html = buildEmailHtml(to, template, data, subject)

    return await sendResendEmail(to, subject || getDefaultSubject(template), html)
  } catch (error) {
    console.error(`[EMAIL] Failed to send ${template}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Build HTML email body for a template
 */
function buildEmailHtml(
  to: string,
  template: EmailTemplate,
  data: EmailData,
  subject?: string
): string {
  const baseStyles = `
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 40px auto; padding: 20px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0077be; margin: 0; font-size: 24px;">TicketHub</h1>
        </div>
        <div style="color: #333333;">
          {CONTENT}
        </div>
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
          <p style="color: #666666; font-size: 12px; margin: 0;">
            TicketHub &mdash; Events in Nairobi<br>
            This email was sent to {TO}. If you didn't request this, you can safely ignore it.
          </p>
        </div>
      </div>
    </body>
  `

  const content = buildTemplateContent(template, data)

  return baseStyles
    .replace('{CONTENT}', content)
    .replace('{TO}', to)
}

function buildTemplateContent(template: EmailTemplate, data: EmailData): string {
  switch (template) {
    case 'ticket_confirmation': {
      const t = data.ticketConfirmation
      return `
        <h2 style="color: #0077be;">🎫 Your Ticket Confirmation</h2>
        <p>Thank you for your purchase! Here are your ticket details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Event:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${t?.eventTitle}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${t?.eventDate}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Venue:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${t?.venue}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Ticket Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${t?.ticketType}</td></tr>
          <tr><td style="padding: 8px;"><strong>Quantity:</strong></td><td style="padding: 8px;">${t?.quantity}</td></tr>
          <tr><td style="padding: 8px;"><strong>Amount:</strong></td><td style="padding: 8px;">KES ${t?.amount}</td></tr>
        </table>
        <p>Your tickets are saved to your wallet. Show your QR code at the gate for entry.</p>
      `
    }
    case 'payment_receipt': {
      const p = data.paymentReceipt
      return `
        <h2 style="color: #0077be;">💰 Payment Receipt</h2>
        <p>Your payment has been confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Event:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${p?.eventTitle}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Reference:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${p?.reference}</td></tr>
          <tr><td style="padding: 8px;"><strong>Amount:</strong></td><td style="padding: 8px;">KES ${p?.amount}</td></tr>
        </table>
      `
    }
    case 'event_reminder': {
      const r = data.eventReminder
      return `
        <h2 style="color: #0077be;">📅 Event Reminder</h2>
        <p>Your event is coming up soon!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Event:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${r?.eventTitle}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${r?.eventDate}</td></tr>
          <tr><td style="padding: 8px;"><strong>Venue:</strong></td><td style="padding: 8px;">${r?.venue}</td></tr>
        </table>
        <p>Ticket count: ${r?.ticketCount}</p>
      `
    }
    case 'ticket_refund': {
      const r = data.refund
      return `
        <h2 style="color: #0077be;">💸 Refund Processed</h2>
        <p>A refund has been processed for your ticket.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Ticket ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${r?.ticketId}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">KES ${r?.amount}</td></tr>
          ${r?.reason ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Reason:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${r.reason}</td></tr>` : ''}
        </table>
      `
    }
    case 'payout_processed': {
      const p = data.payout
      return `
        <h2 style="color: #0077be;">💵 Payout Processed</h2>
        <p>Your payout has been processed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">KES ${p?.amount}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Bank:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${p?.bankName}</td></tr>
          <tr><td style="padding: 8px;"><strong>Account:</strong></td><td style="padding: 8px;">${p?.accountNumber}</td></tr>
        </table>
      `
    }
    case 'event_cancelled': {
      const e = data.eventCancelled
      return `
        <h2 style="color: #0077be;">⚠️ Event Cancelled</h2>
        <p>Unfortunately, the following event has been cancelled:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Event:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${e?.eventTitle}</td></tr>
          ${e?.reason ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;"><strong>Reason:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${e.reason}</td></tr>` : ''}
        </table>
        <p>Please contact support for refund options.</p>
      `
    }
    case 'account_verification': {
      const v = data.verification
      return `
        <h2 style="color: #0077be;">✓ Verify Your Account</h2>
        <p>Hello ${v?.name},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${v?.verificationUrl}" style="background: #0077be; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>This link will expire in 24 hours.</p>
      `
    }
    case 'password_reset':
    default: {
      const r = data.passwordReset
      return `
        <h2 style="color: #0077be;">🔑 Reset Your Password</h2>
        <p>Hello ${r?.name},</p>
        <p>You requested a password reset for your TicketHub account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${r?.resetUrl}" style="background: #0077be; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `
    }
  }
}

/**
 * Get default subject line for template
 */
function getDefaultSubject(template: EmailTemplate): string {
  switch (template) {
    case 'ticket_confirmation':
      return '🎫 Your Ticket Confirmation'
    case 'payment_receipt':
      return '💰 Payment Receipt'
    case 'event_reminder':
      return '📅 Event Reminder'
    case 'ticket_refund':
      return '💸 Refund Processed'
    case 'payout_processed':
      return '💵 Payout Processed'
    case 'event_cancelled':
      return '⚠️ Event Cancelled'
    case 'account_verification':
      return '✓ Verify Your Account'
    case 'password_reset':
      return '🔑 Reset Your Password'
    default:
      return 'TicketHub Notification'
  }
}

/**
 * Send ticket confirmation email
 */
export async function sendTicketConfirmationEmail(
  to: string,
  data: EmailData['ticketConfirmation']
) {
  return sendEmail(to, 'ticket_confirmation', {
    ticketConfirmation: data,
  }, `🎫 Confirmación de Entrada: ${data?.eventTitle}`)
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(
  to: string,
  data: EmailData['paymentReceipt']
) {
  return sendEmail(to, 'payment_receipt', {
    paymentReceipt: data,
  }, `💰 Recibo de Pago: ${data?.eventTitle}`)
}

/**
 * Send event reminder email
 */
export async function sendEventReminderEmail(
  to: string,
  data: EmailData['eventReminder']
) {
  return sendEmail(to, 'event_reminder', {
    eventReminder: data,
  }, `📅 Recordatorio: ${data?.eventTitle}`)
}

/**
 * Send refund notification email
 */
export async function sendRefundEmail(
  to: string,
  data: EmailData['refund']
) {
  return sendEmail(to, 'ticket_refund', {
    refund: data,
  }, '💸 Reembolso Procesado')
}

/**
 * Send payout notification email
 */
export async function sendPayoutNotificationEmail(
  to: string,
  data: EmailData['payout']
) {
  return sendEmail(to, 'payout_processed', {
    payout: data,
  }, '💵 Reembolso Procesado')
}

/**
 * Send event cancellation email
 */
export async function sendEventCancellationEmail(
  to: string,
  data: EmailData['eventCancelled']
) {
  return sendEmail(to, 'event_cancelled', {
    eventCancelled: data,
  }, `⚠️ Evento Cancelado: ${data?.eventTitle}`)
}

/**
 * Send account verification email
 */
export async function sendVerificationEmail(
  to: string,
  data: EmailData['verification']
) {
  return sendEmail(to, 'account_verification', {
    verification: data,
  }, '✓ Verifica Tu Cuenta')
}

/**
 * Send password reset email via Resend
 */
export async function sendResetPasswordEmail(
  to: string,
  data: EmailData['passwordReset']
) {
  return sendEmail(to, 'password_reset', {
    passwordReset: data,
  }, '🔑 Reset Your Password - TicketHub')
}
