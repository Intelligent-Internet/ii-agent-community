// API route for creating puzzle rooms

import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';
import { CreateRoomRequest, CreateRoomResponse } from '@/types/puzzle';

export async function POST(request: NextRequest) {
  try {
    const body: CreateRoomRequest = await request.json();
    
    // Validate request data
    if (!body.playerName || !body.puzzleImage || !body.difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: playerName, puzzleImage, difficulty' },
        { status: 400 }
      );
    }

    if (!['easy', 'medium', 'hard'].includes(body.difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty. Must be easy, medium, or hard' },
        { status: 400 }
      );
    }

    // Create the room
    const result = storageService.createRoom(
      body.playerName,
      body.puzzleImage,
      body.difficulty
    );

    const response: CreateRoomResponse = {
      roomId: result.roomId,
      playerId: result.playerId,
      puzzleId: result.puzzleId,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}