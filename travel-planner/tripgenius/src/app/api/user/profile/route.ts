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
      // Get user profile
      const userResult = await client.query(
        'SELECT email, name, created_at FROM users WHERE email = $1',
        [session.user.email]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      // Get user preferences if they exist
      const preferencesResult = await client.query(
        'SELECT * FROM user_preferences WHERE user_email = $1',
        [session.user.email]
      );

      let preferences = null;
      if (preferencesResult.rows.length > 0) {
        preferences = preferencesResult.rows[0];
      }

      // Get user statistics
      const statsResult = await client.query(`
        SELECT 
          COUNT(CASE WHEN type = 'hotel' THEN 1 END) as hotel_bookings,
          COUNT(CASE WHEN type = 'flight' THEN 1 END) as flight_bookings,
          COUNT(*) as total_bookings,
          COALESCE(SUM(total_amount), 0) as total_spent
        FROM bookings 
        WHERE user_email = $1 AND status = 'confirmed'
      `, [session.user.email]);

      const itinerariesResult = await client.query(
        'SELECT COUNT(*) as total_itineraries FROM itineraries WHERE user_email = $1',
        [session.user.email]
      );

      const stats = {
        ...statsResult.rows[0],
        total_itineraries: parseInt(itinerariesResult.rows[0].total_itineraries)
      };

      const profile = {
        email: user.email,
        name: user.name,
        joinedAt: user.created_at,
        preferences,
        stats
      };

      return NextResponse.json({ profile });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, preferences } = await request.json();

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update user name if provided
      if (name) {
        await client.query(
          'UPDATE users SET name = $1, updated_at = NOW() WHERE email = $2',
          [name, session.user.email]
        );
      }

      // Update or insert preferences if provided
      if (preferences) {
        const {
          preferredCurrency,
          budgetRange,
          travelStyle,
          interests,
          dietaryRestrictions,
          accessibility,
          notifications
        } = preferences;

        // Check if preferences exist
        const existingPrefs = await client.query(
          'SELECT id FROM user_preferences WHERE user_email = $1',
          [session.user.email]
        );

        if (existingPrefs.rows.length > 0) {
          // Update existing preferences
          await client.query(`
            UPDATE user_preferences 
            SET 
              preferred_currency = $1,
              budget_range = $2,
              travel_style = $3,
              interests = $4,
              dietary_restrictions = $5,
              accessibility_needs = $6,
              notification_settings = $7,
              updated_at = NOW()
            WHERE user_email = $8
          `, [
            preferredCurrency,
            budgetRange,
            travelStyle,
            JSON.stringify(interests),
            dietaryRestrictions,
            accessibility,
            JSON.stringify(notifications),
            session.user.email
          ]);
        } else {
          // Insert new preferences
          await client.query(`
            INSERT INTO user_preferences (
              user_email, preferred_currency, budget_range, travel_style,
              interests, dietary_restrictions, accessibility_needs,
              notification_settings, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          `, [
            session.user.email,
            preferredCurrency,
            budgetRange,
            travelStyle,
            JSON.stringify(interests),
            dietaryRestrictions,
            accessibility,
            JSON.stringify(notifications)
          ]);
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}