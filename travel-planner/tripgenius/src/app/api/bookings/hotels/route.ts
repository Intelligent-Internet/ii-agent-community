import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mock hotel data
const mockHotels = [
  {
    id: 'hotel_gracery_shinjuku',
    name: 'Hotel Gracery Shinjuku',
    location: 'Shinjuku, Tokyo',
    rating: 4.2,
    reviews: 1847,
    pricePerNight: 15000,
    currency: 'JPY',
    amenities: ['Free WiFi', 'Restaurant', 'Air Conditioning', 'Non-smoking rooms'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=500'
    ],
    description: 'Modern hotel in the heart of Shinjuku with easy access to shopping and dining.',
    checkIn: '15:00',
    checkOut: '11:00',
    cancellation: 'Free cancellation until 24 hours before check-in'
  },
  {
    id: 'park_hyatt_tokyo',
    name: 'Park Hyatt Tokyo',
    location: 'Shinjuku, Tokyo',
    rating: 4.7,
    reviews: 2156,
    pricePerNight: 45000,
    currency: 'JPY',
    amenities: ['Free WiFi', 'Spa', 'Fitness Center', 'Pool', 'Restaurant', 'Bar'],
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=500',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500'
    ],
    description: 'Luxury hotel with stunning city views and world-class amenities.',
    checkIn: '15:00',
    checkOut: '12:00',
    cancellation: 'Free cancellation until 48 hours before check-in'
  },
  {
    id: 'shibuya_excel_hotel',
    name: 'Shibuya Excel Hotel Tokyu',
    location: 'Shibuya, Tokyo',
    rating: 4.1,
    reviews: 1432,
    pricePerNight: 18000,
    currency: 'JPY',
    amenities: ['Free WiFi', 'Restaurant', 'Business Center', 'Laundry Service'],
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500'
    ],
    description: 'Contemporary hotel connected to Shibuya Station with excellent accessibility.',
    checkIn: '14:00',
    checkOut: '11:00',
    cancellation: 'Free cancellation until 24 hours before check-in'
  },
  {
    id: 'aman_tokyo',
    name: 'Aman Tokyo',
    location: 'Otemachi, Tokyo',
    rating: 4.8,
    reviews: 892,
    pricePerNight: 85000,
    currency: 'JPY',
    amenities: ['Free WiFi', 'Spa', 'Fitness Center', 'Pool', 'Restaurant', 'Concierge'],
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500'
    ],
    description: 'Ultra-luxury urban sanctuary blending traditional Japanese aesthetics with modern comfort.',
    checkIn: '15:00',
    checkOut: '12:00',
    cancellation: 'Free cancellation until 72 hours before check-in'
  },
  {
    id: 'capsule_hotel_zen',
    name: 'Capsule Hotel Zen Tokyo',
    location: 'Asakusa, Tokyo',
    rating: 3.9,
    reviews: 756,
    pricePerNight: 4500,
    currency: 'JPY',
    amenities: ['Free WiFi', 'Shared Lounge', 'Lockers', 'Vending Machines'],
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500',
      'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?w=500'
    ],
    description: 'Modern capsule hotel offering a unique Japanese accommodation experience.',
    checkIn: '16:00',
    checkOut: '10:00',
    cancellation: 'Free cancellation until 12 hours before check-in'
  },
  {
    id: 'peninsula_tokyo',
    name: 'The Peninsula Tokyo',
    location: 'Marunouchi, Tokyo',
    rating: 4.6,
    reviews: 1693,
    pricePerNight: 55000,
    currency: 'JPY',
    amenities: ['Free WiFi', 'Spa', 'Fitness Center', 'Pool', 'Multiple Restaurants', 'Butler Service'],
    images: [
      'https://images.unsplash.com/photo-1559508551-44bff1de756b?w=500',
      'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=500'
    ],
    description: 'Elegant luxury hotel in the heart of Tokyo\'s business district.',
    checkIn: '15:00',
    checkOut: '12:00',
    cancellation: 'Free cancellation until 48 hours before check-in'
  }
];

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get('destination') || 'Tokyo';
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = parseInt(searchParams.get('guests') || '2');
    const priceRange = searchParams.get('priceRange'); // 'budget', 'mid-range', 'luxury'

    // Filter hotels based on search criteria
    let filteredHotels = mockHotels;

    // Filter by destination (simple contains check)
    if (destination) {
      filteredHotels = filteredHotels.filter(hotel => 
        hotel.location.toLowerCase().includes(destination.toLowerCase())
      );
    }

    // Filter by price range
    if (priceRange) {
      switch (priceRange) {
        case 'budget':
          filteredHotels = filteredHotels.filter(hotel => hotel.pricePerNight <= 10000);
          break;
        case 'mid-range':
          filteredHotels = filteredHotels.filter(hotel => 
            hotel.pricePerNight > 10000 && hotel.pricePerNight <= 30000
          );
          break;
        case 'luxury':
          filteredHotels = filteredHotels.filter(hotel => hotel.pricePerNight > 30000);
          break;
      }
    }

    // Sort by rating (highest first)
    filteredHotels.sort((a, b) => b.rating - a.rating);

    // Calculate total price if dates provided
    let nights = 1;
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Add calculated fields
    const hotelsWithPricing = filteredHotels.map(hotel => ({
      ...hotel,
      totalPrice: hotel.pricePerNight * nights,
      nights,
      pricePerNightUSD: Math.round(hotel.pricePerNight / 150), // Rough JPY to USD conversion
      totalPriceUSD: Math.round((hotel.pricePerNight * nights) / 150)
    }));

    return NextResponse.json({ 
      hotels: hotelsWithPricing,
      searchParams: {
        destination,
        checkIn,
        checkOut,
        guests,
        nights,
        priceRange
      }
    });
  } catch (error) {
    console.error('Hotel Search Error:', error);
    return NextResponse.json(
      { error: 'Failed to search hotels' },
      { status: 500 }
    );
  }
}