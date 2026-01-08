import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { setupSocketHandlers } from '@/lib/multiplayer/socketServer';
import { GameState, GamePhase } from '@/types/game';

describe('Hero Selection Synchronization', () => {
  let io: Server;
  let clientSocket1: any;
  let clientSocket2: any;
  let httpServer: any;
  let createdRoom: any;
  const PORT = 3003; // Using a different port

  beforeEach(async () => {
    httpServer = createServer();
    io = new Server(httpServer);
    setupSocketHandlers(io);

    await new Promise<void>((resolve) => {
      httpServer.listen(PORT, () => {
        resolve();
      });
    });

    // Connect Player 1
    clientSocket1 = Client(`http://localhost:${PORT}`);
    
    await new Promise<void>((resolve) => {
      clientSocket1.on('connect', resolve);
    });

    // Create Room
    await new Promise<void>((resolve) => {
      clientSocket1.emit('room:create', { 
        sessionId: 'player-1', 
        displayName: 'Player 1' 
      }, (response: any) => {
         createdRoom = response.room;
         resolve();
      });
    });

    // Connect Player 2
    clientSocket2 = Client(`http://localhost:${PORT}`);
    
    await new Promise<void>((resolve) => {
       clientSocket2.on('connect', resolve);
    });

    // Join Room
    await new Promise<void>((resolve) => {
      clientSocket2.emit('room:join', {
        roomId: createdRoom.id,
        sessionId: 'player-2',
        displayName: 'Player 2'
      }, () => {
        resolve();
      });
    });
    
    // Tiny delay to ensure server state is settled
    await new Promise(r => setTimeout(r, 50));
  });

  afterEach(() => {
    io.close();
    clientSocket1.close();
    clientSocket2.close();
    httpServer.close();
  });

  it('should sync hero selection from P1 to P2', () => new Promise<void>((done) => {
    const mockGameState: Partial<GameState> = {
      ...createdRoom.gameState,
      gamePhase: GamePhase.HERO_SELECTION,
      players: [
         { ...createdRoom.gameState.players[0], hero: { id: 'xiangyu', name: 'Xiang Yu', skills: [], awakened: false } }, // P1 selected
         createdRoom.gameState.players[1]
      ]
    };

    clientSocket2.on('game:state', (data: any) => {
      expect(data.gameState).toBeDefined();
      expect(data.gameState.players[0].hero.id).toBe('xiangyu');
      done();
    });

    clientSocket1.emit('hero:select', { gameState: mockGameState }, (response: any) => {
      expect(response.success).toBe(true);
    });
  }));

  it('should sync hero selection from P2 to P1', () => new Promise<void>((done) => {
    const mockGameState: Partial<GameState> = {
      ...createdRoom.gameState,
      gamePhase: GamePhase.HERO_SELECTION,
      players: [
         createdRoom.gameState.players[0],
         { ...createdRoom.gameState.players[1], hero: { id: 'liubang', name: 'Liu Bang', skills: [], awakened: false } } // P2 selected
      ]
    };

    clientSocket1.on('game:state', (data: any) => {
      expect(data.gameState).toBeDefined();
      expect(data.gameState.players[1].hero.id).toBe('liubang');
      done();
    });

    clientSocket2.emit('hero:select', { gameState: mockGameState }, (response: any) => {
      expect(response.success).toBe(true);
    });
  }));
  
  it('should return error if not in room', () => new Promise<void>((done) => {
      const clientSocket3 = Client(`http://localhost:${PORT}`);
      clientSocket3.on('connect', () => {
          clientSocket3.emit('hero:select', { gameState: {} }, (response: any) => {
              expect(response.success).toBe(false);
              expect(response.error).toBe('Not in a room');
              clientSocket3.close();
              done();
          });
      });
  }));
});
