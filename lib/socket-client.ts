'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

/**
 * Custom hook for Socket.IO client connection (BEAST LEVEL: Real-time updates)
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize Socket.IO client
    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected')
    })

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error)
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  return socketRef.current
}

/**
 * Hook to listen for ticket count updates for a specific event
 */
export function useTicketCountUpdates(eventId: string | null, onUpdate: (count: number) => void) {
  const socket = useSocket()

  useEffect(() => {
    if (!socket || !eventId) return

    // Join event room
    socket.emit('join-event', eventId)

    // Listen for ticket count updates
    const handleUpdate = (data: { eventId: string; ticketCount: number; timestamp: string }) => {
      if (data.eventId === eventId) {
        onUpdate(data.ticketCount)
      }
    }

    socket.on('ticket-count-update', handleUpdate)

    // Cleanup
    return () => {
      socket.off('ticket-count-update', handleUpdate)
      socket.emit('leave-event', eventId)
    }
  }, [socket, eventId, onUpdate])
}

