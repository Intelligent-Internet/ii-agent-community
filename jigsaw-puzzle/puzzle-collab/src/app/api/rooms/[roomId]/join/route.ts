// API route for joining puzzle rooms

import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';
import { JoinRoomRequest, JoinRoomResponse } from '@/types/puzzle';

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const body: JoinRoomRequest = await request.json();

    // Validate request data
    if (!body.playerName) {
      return NextResponse.json(
        { error: 'Missing required field: playerName' },
        { status: 400 }
      );
    }

    // Try to join the room
    const result = storageService.joinRoom(roomId, body.playerName);
    
    if (!result) {
      const room = storageService.getRoom(roomId);
      if (!room) {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        );
      } else {
        return NextResponse.json(
          { error: 'Room is full (max 2 players)' },
          { status: 409 }
        );
      }
    }

    const response: JoinRoomResponse = {
      playerId: result.playerId,
      puzzle: result.room.puzzle,
      gameState: result.room.gameState,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}