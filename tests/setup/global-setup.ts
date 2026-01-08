/**
 * Global test setup for Socket.IO testing
 * Starts the development server on a test port before running tests
 */

import { spawn, ChildProcess } from 'child_process';
import { createServer } from 'http';

let serverProcess: ChildProcess | null = null;
const TEST_PORT = 3001;
const TEST_SERVER_URL = `http://localhost:${TEST_PORT}`;

/**
 * Wait for server to be ready by attempting to connect
 */
async function waitForServer(url: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 200 || response.status === 404) {
        console.log(`✓ Test server ready at ${url}`);
        return;
      }
    } catch (error) {
      // Server not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Server failed to start after ${maxAttempts} attempts`);
}

/**
 * Setup function - runs once before all tests
 */
export async function setup() {
  console.log('Starting test server...');

  // Start server with custom port
  serverProcess = spawn('node', ['server.js'], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      NODE_ENV: 'test',
    },
    stdio: 'pipe', // Capture output for debugging
  });

  // Log server output for debugging
  serverProcess.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[test-server] ${output}`);
    }
  });

  serverProcess.stderr?.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(`[test-server error] ${output}`);
    }
  });

  // Handle server process errors
  serverProcess.on('error', (error) => {
    console.error('Failed to start test server:', error);
    throw error;
  });

  // Wait for server to be ready
  await waitForServer(TEST_SERVER_URL);

  // Store server info in global for test access
  (global as any).TEST_SERVER_URL = TEST_SERVER_URL;
  (global as any).TEST_PORT = TEST_PORT;

  // Return teardown function
  return async () => {
    console.log('Stopping test server...');
    if (serverProcess) {
      serverProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // Force kill if not stopped after 5s
          if (serverProcess) {
            serverProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        serverProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      serverProcess = null;
      console.log('✓ Test server stopped');
    }
  };
}

/**
 * Teardown function - runs once after all tests
 * Note: Vitest will call the returned teardown function from setup()
 */
export async function teardown() {
  // Teardown is handled by the function returned from setup()
}
