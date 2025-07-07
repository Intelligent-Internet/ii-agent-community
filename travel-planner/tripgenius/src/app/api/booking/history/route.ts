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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'hotel', 'flight', or null for all
    const status = searchParams.get('status'); // 'confirmed', 'cancelled', etc.
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          id, type, reference_number, status, total_amount, 
          booking_data, created_at, updated_at
        FROM bookings 
        WHERE user_email = $1
      `;
      const queryParams: any[] = [session.user.email];

      // Add type filter if specified
      if (type) {
        query += ` AND type = $${queryParams.length + 1}`;
        queryParams.push(type);
      }

      // Add status filter if specified
      if (status) {
        query += ` AND status = $${queryParams.length + 1}`;
        queryParams.push(status);
      }

      // Add ordering and pagination
      query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      queryParams.push(limit, offset);

      const result = await client.query(query, queryParams);

      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) FROM bookings WHERE user_email = $1`;
      const countParams: any[] = [session.user.email];

      if (type) {
        countQuery += ` AND type = $${countParams.length + 1}`;
        countParams.push(type);
      }

      if (status) {
        countQuery += ` AND status = $${countParams.length + 1}`;
        countParams.push(status);
      }

      const countResult = await client.query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      const bookings = result.rows.map(row => ({
        id: row.id,
        type: row.type,
        reference: row.reference_number,
        status: row.status,
        totalAmount: row.total_amount,
        bookingData: row.booking_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return NextResponse.json({
        bookings,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching booking history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking history' },
      { status: 500 }
    );
  }
}