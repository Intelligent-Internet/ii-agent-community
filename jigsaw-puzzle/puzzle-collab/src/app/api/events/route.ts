// Events API for polling-based real-time communication

import { NextRequest, NextResponse } from 'next/server';

interface GameEvent {
  id: string;
  type: string;
  data: any;
  playerId: string;
  roomId: string;
  timestamp: number;
}

// In-memory storage for events (in production, use Redis or database)
const eventStore = new Map<string, GameEvent[]>(); // roomId -> events[]
const maxEventsPerRoom = 100; // Keep last 100 events per room

// Generate unique event ID
function generateEventId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Clean up old events
function cleanupEvents(roomId: string) {
  const events = eventStore.get(roomId) || [];
  if (events.length > maxEventsPerRoom) {
    eventStore.set(roomId, events.slice(-maxEventsPerRoom));
  }
}

// GET: Retrieve events since lastEventId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const playerId = searchParams.get('playerId');
    const lastEventId = searchParams.get('lastEventId') || '';

    if (!roomId || !playerId) {
      return NextResponse.json({ error: 'Missing roomId or playerId' }, { status: 400 });
    }

    const events = eventStore.get(roomId) || [];
    
    // Find the index of the last event
    let startIndex = 0;
    if (lastEventId) {
      const lastIndex = events.findIndex(event => event.id === lastEventId);
      if (lastIndex !== -1) {
        startIndex = lastIndex + 1;
      }
    }

    // Return events after the last known event, excluding own events
    const newEvents = events
      .slice(startIndex)
      .filter(event => event.playerId !== playerId);

    return NextResponse.json(newEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, playerId, type, data } = body;

    if (!roomId || !playerId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event: GameEvent = {
      id: generateEventId(),
      type,
      data,
      playerId,
      roomId,
      timestamp: Date.now(),
    };

    // Add event to store
    if (!eventStore.has(roomId)) {
      eventStore.set(roomId, []);
    }
    
    const events = eventStore.get(roomId)!;
    events.push(event);
    
    // Cleanup old events
    cleanupEvents(roomId);

    console.log(`Event added to room ${roomId}:`, { type, playerId, eventId: event.id });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Error adding event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Clean up room events (optional)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    eventStore.delete(roomId);
    console.log(`Events cleared for room ${roomId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}