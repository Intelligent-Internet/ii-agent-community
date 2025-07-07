// Type definitions for the collaborative jigsaw puzzle game

export interface Player {
  id: string;
  name: string;
  isConnected: boolean;
  cursor?: {
    x: number;
    y: number;
  };
}

export interface PuzzlePieceConnector {
  top: 'none' | 'out' | 'in';
  right: 'none' | 'out' | 'in';
  bottom: 'none' | 'out' | 'in';
  left: 'none' | 'out' | 'in';
}

export interface PuzzlePieceShape {
  path: string;
  connectors: PuzzlePieceConnector;
}

export interface PuzzlePiece {
  id: string;
  row: number;
  col: number;
  correctX: number;
  correctY: number;
  currentX: number;
  currentY: number;
  isPlaced: boolean;
  isLocked: boolean;
  lockedBy: string | null;
  shape: PuzzlePieceShape;
}

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  pieceCount: number;
  pieces: PuzzlePiece[];
  difficulty: PuzzleDifficulty;
}

export interface GameState {
  completedPieces: number;
  totalPieces: number;
  completionPercentage: number;
  isCompleted: boolean;
  startTime: string;
  endTime: string | null;
}

export interface Room {
  id: string;
  players: Player[];
  puzzle: Puzzle;
  gameState: GameState;
  isCompleted: boolean;
  createdAt: string;
}

// API Request/Response types
export interface CreateRoomRequest {
  playerName: string;
  puzzleImage: string;
  difficulty: PuzzleDifficulty;
}

export interface CreateRoomResponse {
  roomId: string;
  playerId: string;
  puzzleId: string;
}

export interface JoinRoomRequest {
  playerName: string;
}

export interface JoinRoomResponse {
  playerId: string;
  puzzle: Puzzle;
  gameState: GameState;
}

export interface RoomStatusResponse {
  roomId: string;
  players: Player[];
  puzzle: Puzzle;
  gameState: GameState;
  isCompleted: boolean;
}

// WebSocket Event types
export interface SocketEvents {
  // Client to Server
  piece_move: {
    pieceId: string;
    x: number;
    y: number;
    playerId: string;
  };
  
  piece_pickup: {
    pieceId: string;
    playerId: string;
  };
  
  piece_drop: {
    pieceId: string;
    x: number;
    y: number;
    playerId: string;
  };
  
  cursor_move: {
    x: number;
    y: number;
    playerId: string;
  };
  
  player_disconnect: {
    playerId: string;
  };

  // Server to Client
  piece_moved: {
    pieceId: string;
    x: number;
    y: number;
    playerId: string;
  };
  
  piece_placed: {
    pieceId: string;
    playerId: string;
  };
  
  piece_locked: {
    pieceId: string;
    lockedBy: string;
  };
  
  piece_unlocked: {
    pieceId: string;
  };
  
  cursor_update: {
    x: number;
    y: number;
    playerId: string;
    playerName: string;
  };
  
  player_joined: {
    player: Player;
  };
  
  player_left: {
    playerId: string;
  };
  
  game_completed: {
    completionTime: string;
    totalPieces: number;
    players: Player[];
  };
  
  game_state_update: {
    gameState: GameState;
  };
}

// Utility types for piece generation
export interface PieceGenerationConfig {
  rows: number;
  cols: number;
  pieceWidth: number;
  pieceHeight: number;
  connectorSize: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}