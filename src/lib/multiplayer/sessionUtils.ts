/**
 * Session storage utilities for managing player session IDs
 *
 * These utilities handle:
 * - Generating unique session IDs for anonymous players
 * - Persisting session IDs in sessionStorage for reconnection
 * - Managing current room state
 */

const SESSION_ID_KEY = 'chess_session_id';
const CURRENT_ROOM_KEY = 'current_room_id';
const DISPLAY_NAME_KEY = 'display_name';

/**
 * Generates a UUIDv4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets or creates a session ID for the current player
 *
 * The session ID is stored in sessionStorage and persists across page refreshes
 * but is cleared when the tab/window is closed.
 *
 * @returns Session ID (UUIDv4)
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return '';
  }

  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (!sessionId) {
      sessionId = generateUUID();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    return sessionId;
  } catch (error) {
    console.error('Error accessing sessionStorage:', error);
    // Return temporary session ID if storage fails
    return generateUUID();
  }
}

/**
 * Clears the session ID (used for testing or manual logout)
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(SESSION_ID_KEY);
  } catch (error) {
    console.error('Error clearing session ID:', error);
  }
}

/**
 * Sets the current room ID
 *
 * This is used to enable automatic reconnection when a player
 * refreshes the page or loses connection temporarily.
 *
 * @param roomId - Room ID to set as current
 */
export function setCurrentRoomId(roomId: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(CURRENT_ROOM_KEY, roomId);
  } catch (error) {
    console.error('Error setting current room ID:', error);
  }
}

/**
 * Gets the current room ID
 *
 * @returns Current room ID or null if not in a room
 */
export function getCurrentRoomId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(CURRENT_ROOM_KEY);
  } catch (error) {
    console.error('Error getting current room ID:', error);
    return null;
  }
}

/**
 * Clears the current room ID
 *
 * Called when leaving a room or when game ends
 */
export function clearCurrentRoomId(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(CURRENT_ROOM_KEY);
  } catch (error) {
    console.error('Error clearing current room ID:', error);
  }
}

/**
 * Sets the player's display name
 *
 * @param displayName - Display name to persist
 */
export function setDisplayName(displayName: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(DISPLAY_NAME_KEY, displayName);
  } catch (error) {
    console.error('Error setting display name:', error);
  }
}

/**
 * Gets the player's display name
 *
 * @returns Display name or null if not set
 */
export function getDisplayName(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(DISPLAY_NAME_KEY);
  } catch (error) {
    console.error('Error getting display name:', error);
    return null;
  }
}

/**
 * Clears the player's display name
 */
export function clearDisplayName(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(DISPLAY_NAME_KEY);
  } catch (error) {
    console.error('Error clearing display name:', error);
  }
}

/**
 * Clears all session data
 */
export function clearAllSessionData(): void {
  clearSessionId();
  clearCurrentRoomId();
  clearDisplayName();
}
