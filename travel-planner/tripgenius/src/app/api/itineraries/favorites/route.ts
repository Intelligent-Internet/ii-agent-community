import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await pool.connect();

    try {
      // Get favorite itineraries with full details
      const result = await client.query(`
        SELECT 
          i.id,
          i.title,
          i.description,
          i.destination,
          i.start_date,
          i.end_date,
          i.budget,
          i.currency,
          i.status,
          i.ai_generated,
          i.created_at,
          i.updated_at,
          uf.created_at as favorited_at,
          COUNT(a.id) as activity_count
        FROM user_favorites uf
        JOIN itineraries i ON uf.itinerary_id = i.id
        LEFT JOIN activities a ON i.id = a.itinerary_id
        WHERE uf.user_email = $1
        GROUP BY i.id, i.title, i.description, i.destination, i.start_date, i.end_date, 
                 i.budget, i.currency, i.status, i.ai_generated, i.created_at, i.updated_at, uf.created_at
        ORDER BY uf.created_at DESC
      `, [session.user.email]);

      const favorites = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        destination: row.destination,
        startDate: row.start_date,
        endDate: row.end_date,
        budget: row.budget,
        currency: row.currency,
        status: row.status,
        aiGenerated: row.ai_generated,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        favoritedAt: row.favorited_at,
        activityCount: parseInt(row.activity_count)
      }));

      return NextResponse.json({ favorites });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}