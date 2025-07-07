import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Mock flight data
const mockFlights = [
  {
    id: 'flight-1',
    airline: 'Japan Airlines',
    flightNumber: 'JL012',
    aircraft: 'Boeing 787-9',
    departure: {
      airport: 'JFK',
      city: 'New York',
      time: '14:30',
      date: '2025-07-15',
      terminal: 'Terminal 1'
    },
    arrival: {
      airport: 'NRT',
      city: 'Tokyo',
      time: '18:45+1',
      date: '2025-07-16',
      terminal: 'Terminal 2'
    },
    duration: '14h 15m',
    stops: 0,
    price: {
      economy: 1299,
      premium: 2899,
      business: 4599,
      first: 8999
    },
    amenities: ['WiFi', 'Meal', 'Entertainment', 'Power Outlet'],
    baggage: {
      carry: '10kg',
      checked: '23kg (2 pieces)'
    },
    availability: {
      economy: 12,
      premium: 8,
      business: 4,
      first: 2
    }
  },
  {
    id: 'flight-2',
    airline: 'ANA (All Nippon Airways)',
    flightNumber: 'NH010',
    aircraft: 'Boeing 777-300ER',
    departure: {
      airport: 'JFK',
      city: 'New York',
      time: '11:15',
      date: '2025-07-15',
      terminal: 'Terminal 7'
    },
    arrival: {
      airport: 'NRT',
      city: 'Tokyo',
      time: '14:50+1',
      date: '2025-07-16',
      terminal: 'Terminal 1'
    },
    duration: '13h 35m',
    stops: 0,
    price: {
      economy: 1399,
      premium: 2999,
      business: 4899,
      first: 9299
    },
    amenities: ['WiFi', 'Meal', 'Entertainment', 'Power Outlet', 'Lounge Access'],
    baggage: {
      carry: '10kg',
      checked: '23kg (2 pieces)'
    },
    availability: {
      economy: 18,
      premium: 6,
      business: 3,
      first: 1
    }
  },
  {
    id: 'flight-3',
    airline: 'United Airlines',
    flightNumber: 'UA79',
    aircraft: 'Boeing 777-200',
    departure: {
      airport: 'SFO',
      city: 'San Francisco',
      time: '16:40',
      date: '2025-07-15',
      terminal: 'Terminal 3'
    },
    arrival: {
      airport: 'NRT',
      city: 'Tokyo',
      time: '20:05+1',
      date: '2025-07-16',
      terminal: 'Terminal 1'
    },
    duration: '11h 25m',
    stops: 0,
    price: {
      economy: 999,
      premium: 2299,
      business: 3899,
      first: 7599
    },
    amenities: ['WiFi', 'Meal', 'Entertainment', 'Power Outlet'],
    baggage: {
      carry: '10kg',
      checked: '23kg'
    },
    availability: {
      economy: 25,
      premium: 10,
      business: 6,
      first: 2
    }
  },
  {
    id: 'flight-4',
    airline: 'Delta Air Lines',
    flightNumber: 'DL295',
    aircraft: 'Airbus A350-900',
    departure: {
      airport: 'LAX',
      city: 'Los Angeles',
      time: '13:20',
      date: '2025-07-15',
      terminal: 'Terminal 2'
    },
    arrival: {
      airport: 'NRT',
      city: 'Tokyo',
      time: '18:40+1',
      date: '2025-07-16',
      terminal: 'Terminal 1'
    },
    duration: '12h 20m',
    stops: 0,
    price: {
      economy: 1199,
      premium: 2599,
      business: 4299,
      first: 8199
    },
    amenities: ['WiFi', 'Meal', 'Entertainment', 'Power Outlet', 'Delta One Suite'],
    baggage: {
      carry: '10kg',
      checked: '23kg (2 pieces)'
    },
    availability: {
      economy: 15,
      premium: 8,
      business: 5,
      first: 3
    }
  },
  {
    id: 'flight-5',
    airline: 'Emirates',
    flightNumber: 'EK232',
    aircraft: 'Airbus A380-800',
    departure: {
      airport: 'DXB',
      city: 'Dubai',
      time: '09:45',
      date: '2025-07-15',
      terminal: 'Terminal 3'
    },
    arrival: {
      airport: 'NRT',
      city: 'Tokyo',
      time: '23:55',
      date: '2025-07-15',
      terminal: 'Terminal 2'
    },
    duration: '9h 10m',
    stops: 0,
    price: {
      economy: 899,
      premium: 1999,
      business: 3599,
      first: 6999
    },
    amenities: ['WiFi', 'Meal', 'Entertainment', 'Power Outlet', 'Shower Spa', 'Onboard Lounge'],
    baggage: {
      carry: '7kg',
      checked: '30kg (2 pieces)'
    },
    availability: {
      economy: 30,
      premium: 15,
      business: 8,
      first: 4
    }
  }
];

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
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const departureDate = searchParams.get('departure_date');
    const returnDate = searchParams.get('return_date');
    const passengers = parseInt(searchParams.get('passengers') || '1');
    const travelClass = searchParams.get('class') || 'economy';

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Filter flights based on search criteria (mock logic)
    let filteredFlights = [...mockFlights];

    // Sort flights by price (lowest first)
    filteredFlights.sort((a, b) => a.price[travelClass as keyof typeof a.price] - b.price[travelClass as keyof typeof b.price]);

    const searchResults = {
      searchCriteria: {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        travelClass
      },
      flights: filteredFlights.map(flight => ({
        ...flight,
        selectedPrice: flight.price[travelClass as keyof typeof flight.price],
        selectedClass: travelClass,
        seatsAvailable: flight.availability[travelClass as keyof typeof flight.availability]
      })),
      totalResults: filteredFlights.length,
      searchTime: new Date().toISOString()
    };

    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('Error searching flights:', error);
    return NextResponse.json(
      { error: 'Failed to search flights' },
      { status: 500 }
    );
  }
}