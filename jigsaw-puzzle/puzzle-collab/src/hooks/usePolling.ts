// Polling-based real-time communication hook
// This provides a fallback for real-time features when WebSocket isn't available

import { useEffect, useRef, useState, useCallback } from 'react';
import { SocketEvents } from '@/types/puzzle';

interface UsePollingOptions {
  roomId?: string;
  playerId?: string;
  onPieceMoved?: (data: SocketEvents['piece_moved']) => void;
  onPiecePlaced?: (data: SocketEvents['piece_placed']) => void;
  onPieceLocked?: (data: SocketEvents['piece_locked']) => void;
  onPieceUnlocked?: (data: SocketEvents['piece_unlocked']) => void;
  onCursorUpdate?: (data: SocketEvents['cursor_update']) => void;
  onPlayerJoined?: (data: SocketEvents['player_joined']) => void;
  onPlayerLeft?: (data: SocketEvents['player_left']) => void;
  onGameCompleted?: (data: SocketEvents['game_completed']) => void;
  onGameStateUpdate?: (data: SocketEvents['game_state_update']) => void;
}

interface GameEvent {
  id: string;
  type: string;
  data: any;
  playerId: string;
  timestamp: number;
}

export const usePolling = (options: UsePollingOptions = {}) => {
  const {
    roomId,
    playerId,
    onPieceMoved,
    onPiecePlaced,
    onPieceLocked,
    onPieceUnlocked,
    onCursorUpdate,
    onPlayerJoined,
    onPlayerLeft,
    onGameCompleted,
    onGameStateUpdate,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const lastEventId = useRef<string>('');
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Start polling for events
  const startPolling = useCallback(async () => {
    if (!roomId || !playerId) return;

    try {
      const response = await fetch(`/api/events?roomId=${roomId}&playerId=${playerId}&lastEventId=${lastEventId.current}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const events: GameEvent[] = await response.json();

      // Process events
      events.forEach(event => {
        if (event.playerId === playerId) return; // Skip own events

        switch (event.type) {
          case 'piece_moved':
            onPieceMoved?.(event.data);
            break;
          case 'piece_placed':
            onPiecePlaced?.(event.data);
            break;
          case 'piece_locked':
            onPieceLocked?.(event.data);
            break;
          case 'piece_unlocked':
            onPieceUnlocked?.(event.data);
            break;
          case 'cursor_update':
            onCursorUpdate?.(event.data);
            break;
          case 'player_joined':
            onPlayerJoined?.(event.data);
            break;
          case 'player_left':
            onPlayerLeft?.(event.data);
            break;
          case 'game_completed':
            onGameCompleted?.(event.data);
            break;
          case 'game_state_update':
            onGameStateUpdate?.(event.data);
            break;
        }

        lastEventId.current = event.id;
      });

      setIsConnected(true);
      setConnectionError(null);
    } catch (error) {
      console.error('Polling error:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
      setIsConnected(false);
    }
  }, [roomId, playerId, onPieceMoved, onPiecePlaced, onPieceLocked, onPieceUnlocked, onCursorUpdate, onPlayerJoined, onPlayerLeft, onGameCompleted, onGameStateUpdate]);

  // Initialize polling
  useEffect(() => {
    if (!roomId || !playerId) return;

    console.log('Starting polling for room:', roomId);
    
    // Start polling immediately
    startPolling();
    
    // Set up interval polling
    pollingInterval.current = setInterval(startPolling, 1000); // Poll every second

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [roomId, playerId, startPolling]);

  // Event emitters
  const emitEvent = async (type: string, data: any) => {
    if (!roomId || !playerId) return;

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          playerId,
          type,
          data,
        }),
      });
    } catch (error) {
      console.error('Failed to emit event:', error);
    }
  };

  const emitPieceMove = (pieceId: string, x: number, y: number) => {
    emitEvent('piece_moved', { pieceId, x, y, playerId });
  };

  const emitPiecePickup = (pieceId: string) => {
    emitEvent('piece_locked', { pieceId, lockedBy: playerId });
  };

  const emitPieceDrop = (pieceId: string, x: number, y: number) => {
    emitEvent('piece_unlocked', { pieceId });
  };

  const emitCursorMove = (x: number, y: number) => {
    emitEvent('cursor_update', { x, y, playerId });
  };

  const emitPlayerDisconnect = () => {
    emitEvent('player_left', { playerId });
  };

  const joinRoom = async (roomId: string, playerId: string, playerName: string) => {
    console.log('Joining room via polling:', { roomId, playerId, playerName });
    await emitEvent('player_joined', { player: { id: playerId, name: playerName, connected: true } });
    setIsConnected(true);
  };

  const testConnection = () => {
    console.log('Testing polling connection - polling active:', !!pollingInterval.current);
    return !!pollingInterval.current;
  };

  return {
    isConnected,
    connectionError,
    emitPieceMove,
    emitPiecePickup,
    emitPieceDrop,
    emitCursorMove,
    emitPlayerDisconnect,
    joinRoom,
    testConnection,
  };
};