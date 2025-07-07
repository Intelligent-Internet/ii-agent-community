import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '../../../../../generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      flightId,
      passengers,
      travelClass,
      totalPrice,
      contactInfo,
      paymentInfo
    } = await request.json();

    // Validate required fields
    if (!flightId || !passengers || !travelClass || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required booking information' },
        { status: 400 }
      );
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const client = await pool.connect();

    try {
      // Generate booking reference
      const bookingReference = `FL${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
      
      // Create booking record
      const bookingResult = await client.query(
        `INSERT INTO bookings (
          user_email, type, reference_number, status, total_amount, 
          booking_data, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
        RETURNING id`,
        [
          session.user.email,
          'flight',
          bookingReference,
          'confirmed',
          totalPrice,
          JSON.stringify({
            flightId,
            passengers,
            travelClass,
            contactInfo,
            paymentInfo: {
              ...paymentInfo,
              cardNumber: paymentInfo.cardNumber ? `****-****-****-${paymentInfo.cardNumber.slice(-4)}` : undefined
            }
          })
        ]
      );

      const booking = {
        id: bookingResult.rows[0].id,
        reference: bookingReference,
        status: 'confirmed',
        type: 'flight',
        totalAmount: totalPrice,
        bookingDate: new Date().toISOString(),
        flightDetails: {
          flightId,
          travelClass,
          passengers: passengers.length,
          passengerNames: passengers.map((p: any) => `${p.firstName} ${p.lastName}`)
        },
        confirmationDetails: {
          bookingReference,
          eTicketNumber: `ET${Date.now().toString().slice(-8)}`,
          checkinTime: '24 hours before departure',
          baggageAllowance: travelClass === 'economy' ? '23kg' : '32kg',
          seatSelection: 'Available during check-in',
          specialMeals: 'Request during check-in'
        }
      };

      return NextResponse.json({
        success: true,
        message: 'Flight booked successfully',
        booking
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error booking flight:', error);
    return NextResponse.json(
      { error: 'Failed to book flight' },
      { status: 500 }
    );
  }
}