import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '../../../../../generated/prisma';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: itineraryId } = await params;

    try {
      // Check if itinerary exists and user has access
      const itinerary = await prisma.itinerary.findFirst({
        where: {
          id: itineraryId,
          userEmail: session.user.email,
        },
      });

      if (!itinerary) {
        return NextResponse.json(
          { error: 'Itinerary not found' },
          { status: 404 }
        );
      }

      // Check if already favorited
      const existingFavorite = await prisma.userFavorite.findFirst({
        where: {
          userEmail: session.user.email,
          itineraryId: itineraryId,
        },
      });

      if (existingFavorite) {
        return NextResponse.json(
          { error: 'Itinerary already in favorites' },
          { status: 400 }
        );
      }

      // Add to favorites
      await prisma.userFavorite.create({
        data: {
          userEmail: session.user.email,
          itineraryId: itineraryId,
          createdAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Itinerary added to favorites'
      });

    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json(
      { error: 'Failed to add to favorites' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const itineraryId = params.id;

    const client = await pool.connect();

    try {
      // Remove from favorites
      const result = await client.query(
        'DELETE FROM user_favorites WHERE user_email = $1 AND itinerary_id = $2',
        [session.user.email, itineraryId]
      );

      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: 'Itinerary not in favorites' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Itinerary removed from favorites'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json(
      { error: 'Failed to remove from favorites' },
      { status: 500 }
    );
  }
}