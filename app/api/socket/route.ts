import { NextRequest } from 'next/server'

// This is a placeholder route for Socket.IO
// Socket.IO server is initialized in server.ts (custom server)
// For Next.js App Router, Socket.IO needs a custom server setup

export async function GET(request: NextRequest) {
  return new Response('Socket.IO endpoint - use WebSocket connection', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

