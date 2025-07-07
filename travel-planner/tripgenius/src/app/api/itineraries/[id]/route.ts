import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 });
    }

    // Fetch itinerary with activities
    const itinerary = await db.itinerary.findUnique({
      where: { 
        id,
        userId: session.user.id // Ensure user can only access their own itineraries
      },
      include: {
        activities: {
          orderBy: [
            { date: 'asc' },
            { startTime: 'asc' }
          ]
        },
        bookings: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error('Get Itinerary Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itinerary' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { title, description, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 });
    }

    // Update itinerary
    const itinerary = await db.itinerary.update({
      where: { 
        id,
        userId: session.user.id
      },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        activities: {
          orderBy: [
            { date: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    return NextResponse.json({ success: true, itinerary });
  } catch (error) {
    console.error('Update Itinerary Error:', error);
    return NextResponse.json(
      { error: 'Failed to update itinerary' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 });
    }

    // Delete itinerary (this will cascade delete activities and bookings)
    await db.itinerary.delete({
      where: { 
        id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true, message: 'Itinerary deleted successfully' });
  } catch (error) {
    console.error('Delete Itinerary Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary' },
      { status: 500 }
    );
  }
}