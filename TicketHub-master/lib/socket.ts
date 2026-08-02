import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

// Socket.IO server instance (BEAST LEVEL: Real-time communication)
let io: SocketIOServer | null = null

/**
 * Initialize Socket.IO server
 */
export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  })

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`)

    // Join event room for real-time updates
    socket.on('join-event', (eventId: string) => {
      socket.join(`event:${eventId}`)
      console.log(`📡 Socket ${socket.id} joined event:${eventId}`)
    })

    // Leave event room
    socket.on('leave-event', (eventId: string) => {
      socket.leave(`event:${eventId}`)
      console.log(`📡 Socket ${socket.id} left event:${eventId}`)
    })

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })
  })

  return io
}

/**
 * Get Socket.IO instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io
}

/**
 * Emit ticket count update to event room
 */
export function emitTicketCountUpdate(eventId: string, ticketCount: number) {
  if (!io) {
    console.warn('Socket.IO not initialized')
    return
  }

  io.to(`event:${eventId}`).emit('ticket-count-update', {
    eventId,
    ticketCount,
    timestamp: new Date().toISOString(),
  })

  console.log(`📢 Emitted ticket count update for event:${eventId} - Count: ${ticketCount}`)
}

/**
 * Emit event update to event room
 */
export function emitEventUpdate(eventId: string, data: any) {
  if (!io) {
    console.warn('Socket.IO not initialized')
    return
  }

  io.to(`event:${eventId}`).emit('event-update', {
    eventId,
    data,
    timestamp: new Date().toISOString(),
  })
}

