import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user itineraries
    const itineraries = await db.itinerary.findMany({
      where: { 
        userId: session.user.id
      },
      include: {
        activities: {
          take: 3, // Just preview activities
          orderBy: [
            { date: 'asc' },
            { startTime: 'asc' }
          ]
        },
        _count: {
          select: {
            activities: true,
            bookings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ itineraries });
  } catch (error) {
    console.error('Get Itineraries Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itineraries' },
      { status: 500 }
    );
  }
}