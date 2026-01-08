/**
 * Socket.IO Server for Online Multiplayer
 *
 * This API route initializes the Socket.IO server using a singleton pattern.
 * In Next.js App Router, we use a custom server approach to maintain WebSocket connections.
 *
 * Note: For development, this works with `next dev`. For production, you'll need
 * to use a custom server.js file that wraps Next.js.
 */

import { NextRequest } from 'next/server';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from '@/lib/multiplayer/socketServer';

// Global singleton for Socket.IO server
let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server (singleton pattern)
 */
function initializeSocketServer(): SocketIOServer {
  if (io) {
    return io;
  }

  // In Next.js development, we need to access the underlying HTTP server
  // This is a workaround for Next.js App Router limitations
  // For production, use a custom server.js file

  // Create Socket.IO server
  io = new SocketIOServer({
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Setup event handlers
  setupSocketHandlers(io);

  console.log('✅ Socket.IO server initialized');

  return io;
}

/**
 * GET /api/socket
 *
 * This endpoint initializes the Socket.IO server and returns status
 */
export async function GET(req: NextRequest) {
  try {
    const socketServer = initializeSocketServer();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Socket.IO server running',
        path: '/api/socket'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Failed to initialize Socket.IO server:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to initialize Socket.IO server'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * Export the Socket.IO server instance for use in other parts of the app
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}
