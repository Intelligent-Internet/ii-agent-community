// API route for getting room status

import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';
import { RoomStatusResponse } from '@/types/puzzle';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;

    const room = storageService.getRoom(roomId);
    
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const response: RoomStatusResponse = {
      roomId: room.id,
      players: room.players,
      puzzle: room.puzzle,
      gameState: room.gameState,
      isCompleted: room.isCompleted,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error getting room status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}