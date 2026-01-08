/**
 * Socket.IO test helpers for multiplayer testing
 * Provides utilities for connection, event emission, and event waiting
 */

import { io, Socket } from 'socket.io-client';

/**
 * Create a Socket.IO client for testing
 */
export function createTestSocketClient(url?: string): Socket {
  const socketUrl = url || (global as any).TEST_SERVER_URL || 'http://localhost:3001';

  const socket = io(socketUrl, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 500,
  });

  return socket;
}

/**
 * Wait for a socket event with timeout
 */
export function waitForEvent<T = any>(
  socket: Socket,
  eventName: string,
  timeout: number = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    const handler = (data: T) => {
      clearTimeout(timer);
      socket.off(eventName, handler);
      resolve(data);
    };

    socket.on(eventName, handler);
  });
}

/**
 * Wait for socket connection
 */
export function waitForConnection(socket: Socket, timeout: number = 5000): Promise<void> {
  if (socket.connected) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('connect', connectHandler);
      socket.off('connect_error', errorHandler);
      reject(new Error('Socket connection timeout'));
    }, timeout);

    const connectHandler = () => {
      clearTimeout(timer);
      socket.off('connect_error', errorHandler);
      resolve();
    };

    const errorHandler = (error: Error) => {
      clearTimeout(timer);
      socket.off('connect', connectHandler);
      reject(error);
    };

    socket.once('connect', connectHandler);
    socket.once('connect_error', errorHandler);

    if (!socket.connected) {
      socket.connect();
    }
  });
}

/**
 * Wait for socket disconnection
 */
export function waitForDisconnection(socket: Socket, timeout: number = 5000): Promise<void> {
  if (!socket.connected) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('disconnect', handler);
      reject(new Error('Socket disconnection timeout'));
    }, timeout);

    const handler = () => {
      clearTimeout(timer);
      resolve();
    };

    socket.once('disconnect', handler);
  });
}

/**
 * Emit event and wait for acknowledgment
 */
export function emitWithAck<T = any>(
  socket: Socket,
  eventName: string,
  data: any,
  timeout: number = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ack: ${eventName}`));
    }, timeout);

    socket.emit(eventName, data, (response: T) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

/**
 * Create multiple Socket.IO clients for multi-client testing
 */
export function createMultipleClients(count: number, url?: string): Socket[] {
  return Array.from({ length: count }, () => createTestSocketClient(url));
}

/**
 * Connect multiple clients in parallel
 */
export async function connectMultipleClients(sockets: Socket[]): Promise<void> {
  await Promise.all(sockets.map(socket => waitForConnection(socket)));
}

/**
 * Disconnect multiple clients in parallel
 */
export async function disconnectMultipleClients(sockets: Socket[]): Promise<void> {
  await Promise.all(
    sockets.map(socket => {
      socket.disconnect();
      return Promise.resolve();
    })
  );
}

/**
 * Cleanup helper - disconnect and close sockets
 */
export function cleanupSockets(...sockets: Socket[]): void {
  sockets.forEach(socket => {
    if (socket.connected) {
      socket.disconnect();
    }
    socket.removeAllListeners();
    socket.close();
  });
}

/**
 * Wait for multiple events from different sockets simultaneously
 */
export function waitForMultipleEvents(
  eventConfigs: Array<{ socket: Socket; eventName: string }>,
  timeout: number = 5000
): Promise<any[]> {
  return Promise.all(
    eventConfigs.map(({ socket, eventName }) => waitForEvent(socket, eventName, timeout))
  );
}

/**
 * Mock room creation flow
 */
export async function createMockRoom(socket: Socket, sessionId: string, displayName?: string) {
  await waitForConnection(socket);

  const response = await emitWithAck(socket, 'room:create', {
    sessionId,
    displayName,
    timestamp: Date.now(),
  });

  return response;
}

/**
 * Mock room join flow
 */
export async function joinMockRoom(
  socket: Socket,
  roomId: string,
  sessionId: string,
  displayName?: string
) {
  await waitForConnection(socket);

  const response = await emitWithAck(socket, 'room:join', {
    roomId,
    sessionId,
    displayName,
    timestamp: Date.now(),
  });

  return response;
}

/**
 * Simulate network delay
 */
export function simulateNetworkDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert that socket is connected
 */
export function assertSocketConnected(socket: Socket): void {
  if (!socket.connected) {
    throw new Error('Expected socket to be connected, but it is disconnected');
  }
}

/**
 * Assert that socket is disconnected
 */
export function assertSocketDisconnected(socket: Socket): void {
  if (socket.connected) {
    throw new Error('Expected socket to be disconnected, but it is connected');
  }
}
