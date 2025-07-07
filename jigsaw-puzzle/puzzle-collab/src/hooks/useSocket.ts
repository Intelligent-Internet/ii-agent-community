// Custom hook for Socket.IO connection management

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/types/puzzle';

interface UseSocketOptions {
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

export const useSocket = (options: UseSocketOptions = {}) => {
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
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Connect to Socket.IO through Next.js API route
    const socketUrl = window.location.origin;
    
    console.log('Connecting to Socket.IO server at:', socketUrl);
    
    const socket = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setConnectionError(null);
    });

    // Handle successful connection confirmation from server
    socket.on('connected', ({ playerId: serverPlayerId, roomId: serverRoomId }) => {
      console.log('Connection confirmed by server:', { serverPlayerId, serverRoomId });
      setIsConnected(true);
    });

    // Test connection
    socket.on('test_response', (data) => {
      console.log('Test response received:', data);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, playerId]);

  // Set up event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    if (onPieceMoved) {
      socket.on('piece_moved', onPieceMoved);
    }

    if (onPiecePlaced) {
      socket.on('piece_placed', onPiecePlaced);
    }

    if (onPieceLocked) {
      socket.on('piece_locked', onPieceLocked);
    }

    if (onPieceUnlocked) {
      socket.on('piece_unlocked', onPieceUnlocked);
    }

    if (onCursorUpdate) {
      socket.on('cursor_update', onCursorUpdate);
    }

    if (onPlayerJoined) {
      socket.on('player_joined', onPlayerJoined);
    }

    if (onPlayerLeft) {
      socket.on('player_left', onPlayerLeft);
    }

    if (onGameCompleted) {
      socket.on('game_completed', onGameCompleted);
    }

    if (onGameStateUpdate) {
      socket.on('game_state_update', onGameStateUpdate);
    }

    return () => {
      socket.off('piece_moved');
      socket.off('piece_placed');
      socket.off('piece_locked');
      socket.off('piece_unlocked');
      socket.off('cursor_update');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_completed');
      socket.off('game_state_update');
    };
  }, [
    onPieceMoved,
    onPiecePlaced,
    onPieceLocked,
    onPieceUnlocked,
    onCursorUpdate,
    onPlayerJoined,
    onPlayerLeft,
    onGameCompleted,
    onGameStateUpdate,
  ]);

  // Socket event emitters
  const emitPieceMove = (pieceId: string, x: number, y: number) => {
    if (socketRef.current && playerId) {
      socketRef.current.emit('piece_move', { pieceId, x, y, playerId });
    }
  };

  const emitPiecePickup = (pieceId: string) => {
    if (socketRef.current && playerId) {
      socketRef.current.emit('piece_pickup', { pieceId, playerId });
    }
  };

  const emitPieceDrop = (pieceId: string, x: number, y: number) => {
    if (socketRef.current && playerId) {
      socketRef.current.emit('piece_drop', { pieceId, x, y, playerId });
    }
  };

  const emitCursorMove = (x: number, y: number) => {
    if (socketRef.current && playerId) {
      socketRef.current.emit('cursor_move', { x, y, playerId });
    }
  };

  const emitPlayerDisconnect = () => {
    if (socketRef.current && playerId) {
      socketRef.current.emit('player_disconnect', { playerId });
    }
  };

  const joinRoom = (roomId: string, playerId: string, playerName: string) => {
    if (socketRef.current) {
      console.log('Joining room:', { roomId, playerId, playerName });
      socketRef.current.emit('join_room', { roomId, playerId, playerName });
    }
  };

  const testConnection = () => {
    if (socketRef.current) {
      console.log('Testing connection...');
      socketRef.current.emit('test_connection');
    }
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