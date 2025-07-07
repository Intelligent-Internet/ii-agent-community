// In-memory storage service for rooms and puzzles

import { Room, Player, Puzzle, GameState, PuzzleDifficulty } from '@/types/puzzle';
import { v4 as uuidv4 } from 'uuid';

class StorageService {
  private rooms: Map<string, Room> = new Map();
  private puzzles: Map<string, Puzzle> = new Map();

  // Room management
  createRoom(
    playerName: string,
    puzzleImage: string,
    difficulty: PuzzleDifficulty
  ): { roomId: string; playerId: string; puzzleId: string } {
    const roomId = `room_${uuidv4()}`;
    const playerId = `player_${uuidv4()}`;
    const puzzleId = `puzzle_${uuidv4()}`;

    // Create the puzzle
    const puzzle = this.createPuzzle(puzzleId, puzzleImage, difficulty);
    this.puzzles.set(puzzleId, puzzle);

    // Create the player
    const player: Player = {
      id: playerId,
      name: playerName,
      isConnected: true,
    };

    // Create initial game state
    const gameState: GameState = {
      completedPieces: 0,
      totalPieces: puzzle.pieceCount,
      completionPercentage: 0,
      isCompleted: false,
      startTime: new Date().toISOString(),
      endTime: null,
    };

    // Create the room
    const room: Room = {
      id: roomId,
      players: [player],
      puzzle,
      gameState,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    this.rooms.set(roomId, room);

    return { roomId, playerId, puzzleId };
  }

  joinRoom(roomId: string, playerName: string): { playerId: string; room: Room } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Check if room is full
    if (room.players.length >= 2) return null;

    const playerId = `player_${uuidv4()}`;
    const player: Player = {
      id: playerId,
      name: playerName,
      isConnected: true,
    };

    room.players.push(player);
    return { playerId, room };
  }

  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  updatePlayerConnection(roomId: string, playerId: string, isConnected: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    player.isConnected = isConnected;
    return true;
  }

  updatePlayerCursor(roomId: string, playerId: string, x: number, y: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    player.cursor = { x, y };
    return true;
  }

  removePlayer(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.players = room.players.filter(p => p.id !== playerId);
    
    // If no players left, clean up room after 5 minutes
    if (room.players.length === 0) {
      setTimeout(() => {
        const currentRoom = this.rooms.get(roomId);
        if (currentRoom && currentRoom.players.length === 0) {
          this.rooms.delete(roomId);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }

    return true;
  }

  // Puzzle piece management
  updatePiecePosition(roomId: string, pieceId: string, x: number, y: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const piece = room.puzzle.pieces.find(p => p.id === pieceId);
    if (!piece) return false;

    piece.currentX = x;
    piece.currentY = y;

    // Check if piece is in correct position (with some tolerance)
    const tolerance = 20;
    const isInCorrectPosition = 
      Math.abs(piece.currentX - piece.correctX) < tolerance &&
      Math.abs(piece.currentY - piece.correctY) < tolerance;

    if (isInCorrectPosition && !piece.isPlaced) {
      piece.isPlaced = true;
      piece.currentX = piece.correctX;
      piece.currentY = piece.correctY;
      
      // Update game state
      this.updateGameState(roomId);
    }

    return true;
  }

  lockPiece(roomId: string, pieceId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const piece = room.puzzle.pieces.find(p => p.id === pieceId);
    if (!piece || piece.isLocked) return false;

    piece.isLocked = true;
    piece.lockedBy = playerId;
    return true;
  }

  unlockPiece(roomId: string, pieceId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const piece = room.puzzle.pieces.find(p => p.id === pieceId);
    if (!piece) return false;

    piece.isLocked = false;
    piece.lockedBy = null;
    return true;
  }

  private updateGameState(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const completedPieces = room.puzzle.pieces.filter(p => p.isPlaced).length;
    const totalPieces = room.puzzle.pieces.length;
    const completionPercentage = (completedPieces / totalPieces) * 100;
    const isCompleted = completedPieces === totalPieces;

    room.gameState = {
      ...room.gameState,
      completedPieces,
      totalPieces,
      completionPercentage,
      isCompleted,
      endTime: isCompleted ? new Date().toISOString() : null,
    };

    room.isCompleted = isCompleted;
  }

  private createPuzzle(puzzleId: string, imageUrl: string, difficulty: PuzzleDifficulty): Puzzle {
    // Determine puzzle dimensions based on difficulty
    const difficultyConfig = {
      easy: { rows: 4, cols: 6, width: 600, height: 400 },
      medium: { rows: 6, cols: 8, width: 800, height: 600 },
      hard: { rows: 8, cols: 12, width: 1200, height: 800 },
    };

    const config = difficultyConfig[difficulty];
    const pieceWidth = config.width / config.cols;
    const pieceHeight = config.height / config.rows;

    const pieces = this.generatePuzzlePieces(config.rows, config.cols, pieceWidth, pieceHeight);
    
    return {
      id: puzzleId,
      imageUrl,
      width: config.width,
      height: config.height,
      pieceCount: pieces.length,
      pieces,
      difficulty,
    };
  }

  private generatePuzzlePieces(rows: number, cols: number, pieceWidth: number, pieceHeight: number) {
    const pieces = [];
    const connectorSize = 15;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const pieceId = `piece_${row}_${col}`;
        const correctX = col * pieceWidth;
        const correctY = row * pieceHeight;
        
        // Random initial position (scattered around the puzzle area)
        const margin = 100;
        const puzzleWidth = cols * pieceWidth;
        const puzzleHeight = rows * pieceHeight;
        const currentX = Math.random() * (puzzleWidth + 2 * margin) - margin;
        const currentY = Math.random() * (puzzleHeight + 2 * margin) - margin;

        // Generate connectors (simplified for now)
        const connectors = {
          top: row === 0 ? 'none' as const : (Math.random() > 0.5 ? 'out' as const : 'in' as const),
          bottom: row === rows - 1 ? 'none' as const : (Math.random() > 0.5 ? 'out' as const : 'in' as const),
          left: col === 0 ? 'none' as const : (Math.random() > 0.5 ? 'out' as const : 'in' as const),
          right: col === cols - 1 ? 'none' as const : (Math.random() > 0.5 ? 'out' as const : 'in' as const),
        };

        // Generate SVG path for piece shape (simplified rectangle with connectors)
        const path = this.generatePiecePath(pieceWidth, pieceHeight, connectors, connectorSize);

        pieces.push({
          id: pieceId,
          row,
          col,
          correctX,
          correctY,
          currentX,
          currentY,
          isPlaced: false,
          isLocked: false,
          lockedBy: null,
          shape: {
            path,
            connectors,
          },
        });
      }
    }

    return pieces;
  }

  private generatePiecePath(
    width: number,
    height: number,
    connectors: any,
    connectorSize: number
  ): string {
    // This is a simplified piece shape generator
    // In a real implementation, you'd want more sophisticated jigsaw piece shapes
    
    let path = `M0,0`;
    
    // Top edge
    if (connectors.top === 'out') {
      path += ` L${width/2 - connectorSize},0 Q${width/2},${-connectorSize} ${width/2 + connectorSize},0`;
    } else if (connectors.top === 'in') {
      path += ` L${width/2 - connectorSize},0 Q${width/2},${connectorSize} ${width/2 + connectorSize},0`;
    }
    path += ` L${width},0`;
    
    // Right edge
    if (connectors.right === 'out') {
      path += ` L${width},${height/2 - connectorSize} Q${width + connectorSize},${height/2} ${width},${height/2 + connectorSize}`;
    } else if (connectors.right === 'in') {
      path += ` L${width},${height/2 - connectorSize} Q${width - connectorSize},${height/2} ${width},${height/2 + connectorSize}`;
    }
    path += ` L${width},${height}`;
    
    // Bottom edge
    if (connectors.bottom === 'out') {
      path += ` L${width/2 + connectorSize},${height} Q${width/2},${height + connectorSize} ${width/2 - connectorSize},${height}`;
    } else if (connectors.bottom === 'in') {
      path += ` L${width/2 + connectorSize},${height} Q${width/2},${height - connectorSize} ${width/2 - connectorSize},${height}`;
    }
    path += ` L0,${height}`;
    
    // Left edge
    if (connectors.left === 'out') {
      path += ` L0,${height/2 + connectorSize} Q${-connectorSize},${height/2} 0,${height/2 - connectorSize}`;
    } else if (connectors.left === 'in') {
      path += ` L0,${height/2 + connectorSize} Q${connectorSize},${height/2} 0,${height/2 - connectorSize}`;
    }
    path += ` Z`;
    
    return path;
  }

  // Utility methods
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}

// Export singleton instance
export const storageService = new StorageService();