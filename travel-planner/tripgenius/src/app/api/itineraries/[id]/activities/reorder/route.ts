import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '../../../../../../generated/prisma';

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

    const { activities } = await request.json();
    const { id: itineraryId } = await params;

    if (!activities || !Array.isArray(activities)) {
      return NextResponse.json(
        { error: 'Invalid activities data' },
        { status: 400 }
      );
    }

    try {
      // Verify the itinerary belongs to the user
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

      // Update each activity's date using a transaction
      await prisma.$transaction(
        activities.map((activity: any) =>
          prisma.activity.update({
            where: {
              id: activity.id,
              itineraryId: itineraryId,
            },
            data: {
              date: new Date(activity.date),
              updatedAt: new Date(),
            },
          })
        )
      );

      return NextResponse.json({ 
        success: true,
        message: 'Activities reordered successfully' 
      });

    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('Error reordering activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}