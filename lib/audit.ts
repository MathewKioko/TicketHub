/**
 * Audit Logging System for TicketHub v2
 * Provides structured logging for all platform activities
 */

import { prisma } from '@/lib/db'

export type AuditAction = 
  // User actions
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTER'
  | 'USER_UPDATE'
  | 'USER_ROLE_CHANGE'
  
  // Event actions
  | 'EVENT_CREATE'
  | 'EVENT_UPDATE'
  | 'EVENT_DELETE'
  | 'EVENT_PUBLISH'
  | 'EVENT_CANCEL'
  
  // Ticket actions
  | 'TICKET_PURCHASE'
  | 'TICKET_CANCEL'
  | 'TICKET_REFUND'
  | 'TICKET_CHECKIN'
  
  // Payment actions
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  
  // Payout actions
  | 'PAYOUT_INITIATED'
  | 'PAYOUT_PROCESSED'
  | 'PAYOUT_FAILED'
  
  // Admin actions
  | 'ADMIN_EVENT_APPROVAL'
  | 'ADMIN_USER_SUSPEND'
  | 'ADMIN_REFUND_APPROVAL'

export type AuditResource = 
  | 'user'
  | 'event'
  | 'ticket'
  | 'payment'
  | 'payout'
  | 'system'

export type AuditLogInput = {
  userId?: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        details: input.details || {},
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    })
  } catch (error) {
    // Log to console but don't throw - audit logging should not break main flow
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(params: {
  userId?: string
  action?: AuditAction
  resource?: AuditResource
  resourceId?: string
  from?: Date
  to?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (params.userId) where.userId = params.userId
  if (params.action) where.action = params.action
  if (params.resource) where.resource = params.resource
  if (params.resourceId) where.resourceId = params.resourceId
  
  if (params.from || params.to) {
    where.createdAt = {}
    if (params.from) where.createdAt.gte = params.from
    if (params.to) where.createdAt.lte = params.to
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: params.limit || 50,
    skip: params.offset || 0,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  const total = await prisma.auditLog.count({ where })

  return { logs, total }
}

/**
 * Helper functions for common audit actions
 */
export const audit = {
  user: {
    login: (userId: string, ip?: string, ua?: string) =>
      createAuditLog({ userId, action: 'USER_LOGIN', resource: 'user', ipAddress: ip, userAgent: ua }),
    logout: (userId: string, ip?: string, ua?: string) =>
      createAuditLog({ userId, action: 'USER_LOGOUT', resource: 'user', ipAddress: ip, userAgent: ua }),
    register: (userId: string, ip?: string, ua?: string) =>
      createAuditLog({ userId, action: 'USER_REGISTER', resource: 'user', ipAddress: ip, userAgent: ua }),
    update: (userId: string, details: Record<string, any>) =>
      createAuditLog({ userId, action: 'USER_UPDATE', resource: 'user', details }),
    roleChange: (userId: string, oldRole: string, newRole: string, adminId?: string) =>
      createAuditLog({ 
        userId: adminId || userId, 
        action: 'USER_ROLE_CHANGE', 
        resource: 'user', 
        resourceId: userId,
        details: { oldRole, newRole },
      }),
  },

  event: {
    create: (userId: string, eventId: string) =>
      createAuditLog({ userId, action: 'EVENT_CREATE', resource: 'event', resourceId: eventId }),
    update: (userId: string, eventId: string, details: Record<string, any>) =>
      createAuditLog({ userId, action: 'EVENT_UPDATE', resource: 'event', resourceId: eventId, details }),
    delete: (userId: string, eventId: string) =>
      createAuditLog({ userId, action: 'EVENT_DELETE', resource: 'event', resourceId: eventId }),
    publish: (userId: string, eventId: string) =>
      createAuditLog({ userId, action: 'EVENT_PUBLISH', resource: 'event', resourceId: eventId }),
    cancel: (userId: string, eventId: string, reason?: string) =>
      createAuditLog({ userId, action: 'EVENT_CANCEL', resource: 'event', resourceId: eventId, details: { reason } }),
  },

  ticket: {
    purchase: (userId: string, ticketId: string, eventId: string, amount: number) =>
      createAuditLog({ userId, action: 'TICKET_PURCHASE', resource: 'ticket', resourceId: ticketId, details: { eventId, amount } }),
    cancel: (userId: string, ticketId: string) =>
      createAuditLog({ userId, action: 'TICKET_CANCEL', resource: 'ticket', resourceId: ticketId }),
    refund: (userId: string, ticketId: string, amount: number, adminId?: string) =>
      createAuditLog({ userId: adminId || userId, action: 'TICKET_REFUND', resource: 'ticket', resourceId: ticketId, details: { amount } }),
    checkin: (ticketId: string, eventId: string, scannerId?: string) =>
      createAuditLog({ userId: scannerId, action: 'TICKET_CHECKIN', resource: 'ticket', resourceId: ticketId, details: { eventId } }),
  },

  payment: {
    initiated: (userId: string, paymentId: string, amount: number) =>
      createAuditLog({ userId, action: 'PAYMENT_INITIATED', resource: 'payment', resourceId: paymentId, details: { amount } }),
    success: (userId: string, paymentId: string, amount: number) =>
      createAuditLog({ userId, action: 'PAYMENT_SUCCESS', resource: 'payment', resourceId: paymentId, details: { amount } }),
    failed: (userId: string, paymentId: string, reason: string) =>
      createAuditLog({ userId, action: 'PAYMENT_FAILED', resource: 'payment', resourceId: paymentId, details: { reason } }),
    refunded: (userId: string, paymentId: string, amount: number) =>
      createAuditLog({ userId, action: 'PAYMENT_REFUNDED', resource: 'payment', resourceId: paymentId, details: { amount } }),
  },

  payout: {
    initiated: (eventOwnerId: string, payoutId: string, amount: number) =>
      createAuditLog({ userId: eventOwnerId, action: 'PAYOUT_INITIATED', resource: 'payout', resourceId: payoutId, details: { amount } }),
    processed: (eventOwnerId: string, payoutId: string, amount: number) =>
      createAuditLog({ userId: eventOwnerId, action: 'PAYOUT_PROCESSED', resource: 'payout', resourceId: payoutId, details: { amount } }),
    failed: (eventOwnerId: string, payoutId: string, reason: string) =>
      createAuditLog({ userId: eventOwnerId, action: 'PAYOUT_FAILED', resource: 'payout', resourceId: payoutId, details: { reason } }),
  },

  admin: {
    eventApproval: (adminId: string, eventId: string, approved: boolean) =>
      createAuditLog({ userId: adminId, action: 'ADMIN_EVENT_APPROVAL', resource: 'event', resourceId: eventId, details: { approved } }),
    userSuspend: (adminId: string, userId: string, suspended: boolean) =>
      createAuditLog({ userId: adminId, action: 'ADMIN_USER_SUSPEND', resource: 'user', resourceId: userId, details: { suspended } }),
    refundApproval: (adminId: string, paymentId: string, approved: boolean) =>
      createAuditLog({ userId: adminId, action: 'ADMIN_REFUND_APPROVAL', resource: 'payment', resourceId: paymentId, details: { approved } }),
  },
}
