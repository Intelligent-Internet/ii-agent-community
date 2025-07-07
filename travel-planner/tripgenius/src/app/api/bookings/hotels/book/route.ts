import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      itineraryId,
      hotelId,
      hotelName,
      location,
      checkIn,
      checkOut,
      guests,
      rooms,
      pricePerNight,
      totalPrice,
      currency,
      guestDetails
    } = await request.json();

    // Validate required fields
    if (!hotelId || !hotelName || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required booking information' },
        { status: 400 }
      );
    }

    // Generate booking confirmation number
    const confirmationNumber = `HTL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create booking record
    const booking = await db.booking.create({
      data: {
        userId: session.user.id,
        itineraryId: itineraryId || null,
        type: 'HOTEL',
        status: 'CONFIRMED',
        confirmationNumber,
        providerBookingId: hotelId,
        
        // Store booking details as JSON
        details: {
          hotelId,
          hotelName,
          location,
          checkIn,
          checkOut,
          guests: guests || 2,
          rooms: rooms || 1,
          pricePerNight,
          totalPrice,
          currency: currency || 'JPY',
          guestDetails: guestDetails || {},
          bookedAt: new Date().toISOString()
        },
        
        totalAmount: totalPrice,
        currency: currency || 'JPY',
        bookingDate: new Date(checkIn),
        
        // Mock payment info
        paymentStatus: 'PAID',
        paymentMethod: 'CREDIT_CARD'
      }
    });

    // Simulate booking confirmation email (in real app, this would send actual email)
    console.log(`✅ Hotel booking confirmed: ${confirmationNumber} for ${hotelName}`);

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationNumber,
        status: booking.status,
        details: booking.details,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        createdAt: booking.createdAt
      },
      message: 'Hotel booking confirmed successfully!'
    });

  } catch (error) {
    console.error('Hotel Booking Error:', error);
    return NextResponse.json(
      { error: 'Failed to book hotel' },
      { status: 500 }
    );
  }
}