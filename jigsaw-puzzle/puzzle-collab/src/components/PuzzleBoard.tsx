// Main puzzle board component that manages all pieces and game state

'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzlePiece } from './PuzzlePiece';
import { PuzzlePiece as PuzzlePieceType, Player, GameState } from '@/types/puzzle';
import { useSocket } from '@/hooks/useSocket';
import { usePolling } from '@/hooks/usePolling';
import { throttle } from '@/lib/dragUtils';

interface PuzzleBoardProps {
  roomId: string;
  playerId: string;
  puzzle: {
    id: string;
    imageUrl: string;
    width: number;
    height: number;
    pieces: PuzzlePieceType[];
  };
  gameState: GameState;
  players: Player[];
  onGameStateUpdate?: (gameState: GameState) => void;
  onGameCompleted?: () => void;
}

interface CursorData {
  playerId: string;
  playerName: string;
  x: number;
  y: number;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  roomId,
  playerId,
  puzzle,
  gameState,
  players,
  onGameStateUpdate,
  onGameCompleted,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<PuzzlePieceType[]>(puzzle.pieces);
  const [otherPlayersCursors, setOtherPlayersCursors] = useState<CursorData[]>([]);
  const [currentGameState, setCurrentGameState] = useState<GameState>(gameState);

  // Calculate board dimensions and scale
  const boardWidth = Math.max(puzzle.width + 400, 1200); // Extra space for scattered pieces
  const boardHeight = Math.max(puzzle.height + 400, 800);
  const scale = Math.min(1, Math.min(1200 / boardWidth, 800 / boardHeight));

  // Throttled cursor movement handler
  const throttledCursorMove = useCallback(
    throttle((x: number, y: number) => {
      emitCursorMove(x, y);
    }, 100),
    []
  );

  // Real-time communication (polling-based for reliability)
  const {
    isConnected,
    emitPieceMove,
    emitPiecePickup,
    emitPieceDrop,
    emitCursorMove,
    joinRoom,
    testConnection,
  } = usePolling({
    roomId,
    playerId,
    onPieceMoved: useCallback((data) => {
      if (data.playerId !== playerId) {
        setPieces(prev => prev.map(piece =>
          piece.id === data.pieceId
            ? { ...piece, currentX: data.x, currentY: data.y }
            : piece
        ));
      }
    }, [playerId]),
    onPiecePlaced: useCallback((data) => {
      setPieces(prev => prev.map(piece =>
        piece.id === data.pieceId
          ? { ...piece, isPlaced: true }
          : piece
      ));
    }, []),
    onPieceLocked: useCallback((data) => {
      setPieces(prev => prev.map(piece =>
        piece.id === data.pieceId
          ? { ...piece, isLocked: true, lockedBy: data.lockedBy }
          : piece
      ));
    }, []),
    onPieceUnlocked: useCallback((data) => {
      setPieces(prev => prev.map(piece =>
        piece.id === data.pieceId
          ? { ...piece, isLocked: false, lockedBy: null }
          : piece
      ));
    }, []),
    onCursorUpdate: useCallback((data) => {
      setOtherPlayersCursors(prev => {
        const filtered = prev.filter(cursor => cursor.playerId !== data.playerId);
        return [...filtered, {
          playerId: data.playerId,
          playerName: data.playerName,
          x: data.x,
          y: data.y,
        }];
      });
    }, []),
    onPlayerLeft: useCallback((data) => {
      setOtherPlayersCursors(prev =>
        prev.filter(cursor => cursor.playerId !== data.playerId)
      );
    }, []),
    onGameCompleted: useCallback((data) => {
      console.log('Game completed!', data);
      onGameCompleted?.();
    }, [onGameCompleted]),
    onGameStateUpdate: useCallback((data) => {
      setCurrentGameState(data.gameState);
      onGameStateUpdate?.(data.gameState);
    }, [onGameStateUpdate]),
  });

  // Update pieces when puzzle prop changes
  useEffect(() => {
    setPieces(puzzle.pieces);
  }, [puzzle.pieces]);

  // Join room when component mounts
  useEffect(() => {
    const currentPlayer = players.find(p => p.id === playerId);
    if (currentPlayer && joinRoom) {
      console.log('Joining room from PuzzleBoard:', { roomId, playerId, playerName: currentPlayer.name });
      joinRoom(roomId, playerId, currentPlayer.name);
      
      // Test connection after a short delay
      setTimeout(() => {
        if (testConnection) {
          testConnection();
        }
      }, 1000);
    }
  }, [roomId, playerId, players, joinRoom, testConnection]);

  // Handle mouse movement for cursor tracking
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    throttledCursorMove(x, y);
  }, [scale, throttledCursorMove]);

  // Piece event handlers
  const handlePieceMove = useCallback((pieceId: string, x: number, y: number) => {
    setPieces(prev => prev.map(piece =>
      piece.id === pieceId
        ? { ...piece, currentX: x, currentY: y }
        : piece
    ));
    emitPieceMove(pieceId, x, y);
  }, [emitPieceMove]);

  const handlePiecePickup = useCallback((pieceId: string) => {
    emitPiecePickup(pieceId);
  }, [emitPiecePickup]);

  const handlePieceDrop = useCallback((pieceId: string, x: number, y: number) => {
    emitPieceDrop(pieceId, x, y);
  }, [emitPieceDrop]);

  // Render puzzle pieces sorted by z-index (placed pieces on bottom, dragged on top)
  const sortedPieces = [...pieces].sort((a, b) => {
    if (a.isPlaced && !b.isPlaced) return -1;
    if (!a.isPlaced && b.isPlaced) return 1;
    if (a.isLocked && !b.isLocked) return 1;
    if (!a.isLocked && b.isLocked) return -1;
    return 0;
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg">
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-50">
        <div className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${isConnected 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
          }
        `}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Players indicator */}
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Players</h3>
          <div className="space-y-1">
            {players.map((player) => (
              <div key={player.id} className="flex items-center space-x-2">
                <div className={`
                  w-2 h-2 rounded-full
                  ${player.isConnected ? 'bg-green-500' : 'bg-gray-400'}
                `} />
                <span className={`
                  text-sm
                  ${player.id === playerId ? 'font-semibold text-blue-600' : 'text-gray-700'}
                `}>
                  {player.name} {player.id === playerId && '(You)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-4 right-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {currentGameState.completedPieces} / {currentGameState.totalPieces} pieces
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${currentGameState.completionPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentGameState.completionPercentage.toFixed(1)}% complete
          </div>
        </div>
      </div>

      {/* Puzzle board */}
      <div
        ref={boardRef}
        className="relative w-full h-full overflow-auto"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: boardWidth,
          height: boardHeight,
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Puzzle outline */}
        <div
          className="absolute border-4 border-dashed border-gray-400 rounded-lg bg-white/20"
          style={{
            left: 200,
            top: 200,
            width: puzzle.width,
            height: puzzle.height,
          }}
        />

        {/* Puzzle pieces */}
        {sortedPieces.map((piece) => (
          <PuzzlePiece
            key={piece.id}
            piece={piece}
            puzzleImageUrl={puzzle.imageUrl}
            onPieceMove={handlePieceMove}
            onPiecePickup={handlePiecePickup}
            onPieceDrop={handlePieceDrop}
            isCurrentPlayer={!piece.isLocked || piece.lockedBy === playerId}
            containerBounds={{ width: boardWidth, height: boardHeight }}
            scale={1}
          />
        ))}

        {/* Other players' cursors */}
        <AnimatePresence>
          {otherPlayersCursors.map((cursor) => (
            <motion.div
              key={cursor.playerId}
              className="absolute z-40 pointer-events-none"
              style={{
                left: cursor.x,
                top: cursor.y,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Cursor */}
              <div className="relative">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.414l.707-.707zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {/* Player name label */}
                <div className="absolute left-6 top-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                  {cursor.playerName}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Completion celebration */}
        <AnimatePresence>
          {currentGameState.isCompleted && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-lg p-8 text-center shadow-2xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Puzzle Completed!
                </h2>
                <p className="text-gray-600 mb-4">
                  Congratulations! You and your partner solved the puzzle together.
                </p>
                <div className="text-sm text-gray-500">
                  Completed in {currentGameState.endTime && 
                    Math.round((new Date(currentGameState.endTime).getTime() - 
                    new Date(currentGameState.startTime).getTime()) / 1000)} seconds
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};