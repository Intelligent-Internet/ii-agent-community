'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plane,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Search,
  Loader,
  Check,
  Wifi,
  Coffee,
  Monitor,
  Zap,
  Star,
  Shield,
  CreditCard,
  User,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  aircraft: string;
  departure: {
    airport: string;
    city: string;
    time: string;
    date: string;
    terminal: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    date: string;
    terminal: string;
  };
  duration: string;
  stops: number;
  price: {
    economy: number;
    premium: number;
    business: number;
    first: number;
  };
  amenities: string[];
  baggage: {
    carry: string;
    checked: string;
  };
  selectedPrice: number;
  selectedClass: string;
  seatsAvailable: number;
}

export default function FlightBookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchCriteria, setSearchCriteria] = useState({
    origin: searchParams.get('origin') || 'JFK',
    destination: searchParams.get('destination') || 'NRT',
    departureDate: searchParams.get('departure') || '2025-07-15',
    returnDate: searchParams.get('return') || '',
    passengers: parseInt(searchParams.get('passengers') || '1'),
    travelClass: searchParams.get('class') || 'economy'
  });

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [bookingStep, setBookingStep] = useState<'search' | 'select' | 'passenger' | 'payment' | 'confirmation'>('search');
  const [passengers, setPassengers] = useState([{ firstName: '', lastName: '', email: '', phone: '' }]);
  const [contactInfo, setContactInfo] = useState({ email: '', phone: '' });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  });
  const [booking, setBooking] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    // Initialize passengers array based on count
    const passengerCount = searchCriteria.passengers;
    setPassengers(Array(passengerCount).fill(null).map(() => ({ firstName: '', lastName: '', email: '', phone: '' })));
  }, [searchCriteria.passengers]);

  const searchFlights = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        origin: searchCriteria.origin,
        destination: searchCriteria.destination,
        departure_date: searchCriteria.departureDate,
        passengers: searchCriteria.passengers.toString(),
        class: searchCriteria.travelClass
      });

      if (searchCriteria.returnDate) {
        params.append('return_date', searchCriteria.returnDate);
      }

      const response = await fetch(`/api/booking/flights/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search flights');
      }

      setFlights(data.flights);
      setBookingStep('select');
      toast.success(`Found ${data.flights.length} flights`);
    } catch (error) {
      console.error('Error searching flights:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  };

  const selectFlight = (flight: Flight) => {
    setSelectedFlight(flight);
    setBookingStep('passenger');
  };

  const proceedToPayment = () => {
    // Validate passenger information
    const isValid = passengers.every(p => p.firstName && p.lastName && p.email);
    if (!isValid) {
      toast.error('Please fill in all passenger details');
      return;
    }
    setBookingStep('payment');
  };

  const bookFlight = async () => {
    if (!selectedFlight) return;
    
    setIsBooking(true);
    try {
      const response = await fetch('/api/booking/flights/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightId: selectedFlight.id,
          passengers,
          travelClass: selectedFlight.selectedClass,
          totalPrice: selectedFlight.selectedPrice * searchCriteria.passengers,
          contactInfo,
          paymentInfo
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book flight');
      }

      setBooking(data.booking);
      setBookingStep('confirmation');
      toast.success('Flight booked successfully!');
    } catch (error) {
      console.error('Error booking flight:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to book flight');
    } finally {
      setIsBooking(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'meal': return <Coffee className="w-4 h-4" />;
      case 'entertainment': return <Monitor className="w-4 h-4" />;
      case 'power outlet': return <Zap className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-['Nunito_Sans']">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Book Flights</h1>
            <p className="text-white/70">Find and book your perfect flight</p>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div variants={fadeInUp} className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['search', 'select', 'passenger', 'payment', 'confirmation'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  ['search', 'select', 'passenger', 'payment', 'confirmation'].indexOf(bookingStep) >= index
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/50'
                }`}>
                  {['search', 'select', 'passenger', 'payment', 'confirmation'].indexOf(bookingStep) > index ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 4 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    ['search', 'select', 'passenger', 'payment', 'confirmation'].indexOf(bookingStep) > index
                      ? 'bg-purple-500'
                      : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Search Form */}
        {bookingStep === 'search' && (
          <motion.div variants={fadeInUp}>
            <Card className="glass-effect border-white/10 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Flights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin">From</Label>
                    <Input
                      id="origin"
                      value={searchCriteria.origin}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, origin: e.target.value }))}
                      placeholder="Origin airport (e.g., JFK)"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">To</Label>
                    <Input
                      id="destination"
                      value={searchCriteria.destination}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, destination: e.target.value }))}
                      placeholder="Destination airport (e.g., NRT)"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departure">Departure Date</Label>
                    <Input
                      id="departure"
                      type="date"
                      value={searchCriteria.departureDate}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, departureDate: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="return">Return Date (Optional)</Label>
                    <Input
                      id="return"
                      type="date"
                      value={searchCriteria.returnDate}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, returnDate: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passengers">Passengers</Label>
                    <Select value={searchCriteria.passengers.toString()} onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, passengers: parseInt(value) }))}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} Passenger{num > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="class">Travel Class</Label>
                    <Select value={searchCriteria.travelClass} onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, travelClass: value }))}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">Economy</SelectItem>
                        <SelectItem value="premium">Premium Economy</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="first">First Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={searchFlights} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Searching Flights...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Flights
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Flight Selection */}
        {bookingStep === 'select' && (
          <motion.div variants={fadeInUp} className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Available Flights</h2>
              <Button variant="outline" onClick={() => setBookingStep('search')}>
                Modify Search
              </Button>
            </div>

            {flights.map((flight) => (
              <Card key={flight.id} className="glass-effect border-white/10 hover:bg-white/5 transition-all cursor-pointer" onClick={() => selectFlight(flight)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                        <Plane className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{flight.airline}</h3>
                        <p className="text-sm text-white/70">{flight.flightNumber} • {flight.aircraft}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${flight.selectedPrice}</div>
                      <div className="text-sm text-white/70 capitalize">{flight.selectedClass}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-white/70">Departure</div>
                      <div className="font-semibold">{flight.departure.time}</div>
                      <div className="text-sm">{flight.departure.airport} - {flight.departure.city}</div>
                      <div className="text-xs text-white/70">{flight.departure.terminal}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-white/70">Duration</div>
                      <div className="font-semibold">{flight.duration}</div>
                      <div className="text-sm">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/70">Arrival</div>
                      <div className="font-semibold">{flight.arrival.time}</div>
                      <div className="text-sm">{flight.arrival.airport} - {flight.arrival.city}</div>
                      <div className="text-xs text-white/70">{flight.arrival.terminal}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {flight.amenities.slice(0, 4).map((amenity, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded">
                          {getAmenityIcon(amenity)}
                          {amenity}
                        </div>
                      ))}
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {flight.seatsAvailable} seats left
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Passenger Information */}
        {bookingStep === 'passenger' && selectedFlight && (
          <motion.div variants={fadeInUp} className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Passenger Information</h2>
              <Button variant="outline" onClick={() => setBookingStep('select')}>
                Change Flight
              </Button>
            </div>

            {/* Selected Flight Summary */}
            <Card className="glass-effect border-white/10 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedFlight.airline} {selectedFlight.flightNumber}</h3>
                    <p className="text-sm text-white/70">
                      {selectedFlight.departure.airport} → {selectedFlight.arrival.airport} • {selectedFlight.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">${selectedFlight.selectedPrice * searchCriteria.passengers}</div>
                    <div className="text-sm text-white/70">{searchCriteria.passengers} passenger{searchCriteria.passengers > 1 ? 's' : ''}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passenger Details Forms */}
            <div className="space-y-6">
              {passengers.map((passenger, index) => (
                <Card key={index} className="glass-effect border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5" />
                      Passenger {index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`firstName-${index}`}>First Name</Label>
                        <Input
                          id={`firstName-${index}`}
                          value={passenger.firstName}
                          onChange={(e) => {
                            const newPassengers = [...passengers];
                            newPassengers[index].firstName = e.target.value;
                            setPassengers(newPassengers);
                          }}
                          className="bg-white/5 border-white/10"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`lastName-${index}`}>Last Name</Label>
                        <Input
                          id={`lastName-${index}`}
                          value={passenger.lastName}
                          onChange={(e) => {
                            const newPassengers = [...passengers];
                            newPassengers[index].lastName = e.target.value;
                            setPassengers(newPassengers);
                          }}
                          className="bg-white/5 border-white/10"
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`email-${index}`}>Email</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={passenger.email}
                          onChange={(e) => {
                            const newPassengers = [...passengers];
                            newPassengers[index].email = e.target.value;
                            setPassengers(newPassengers);
                          }}
                          className="bg-white/5 border-white/10"
                          placeholder="Email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`phone-${index}`}>Phone</Label>
                        <Input
                          id={`phone-${index}`}
                          value={passenger.phone}
                          onChange={(e) => {
                            const newPassengers = [...passengers];
                            newPassengers[index].phone = e.target.value;
                            setPassengers(newPassengers);
                          }}
                          className="bg-white/5 border-white/10"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={proceedToPayment} className="w-full">
              Continue to Payment
            </Button>
          </motion.div>
        )}

        {/* Payment */}
        {bookingStep === 'payment' && selectedFlight && (
          <motion.div variants={fadeInUp} className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Payment Information</h2>
              <Button variant="outline" onClick={() => setBookingStep('passenger')}>
                Back to Passengers
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="glass-effect border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="cardHolder">Cardholder Name</Label>
                      <Input
                        id="cardHolder"
                        value={paymentInfo.cardHolder}
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardHolder: e.target.value }))}
                        className="bg-white/5 border-white/10"
                        placeholder="Name on card"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        value={paymentInfo.cardNumber}
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardNumber: e.target.value }))}
                        className="bg-white/5 border-white/10"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          value={paymentInfo.expiryDate}
                          onChange={(e) => setPaymentInfo(prev => ({ ...prev, expiryDate: e.target.value }))}
                          className="bg-white/5 border-white/10"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          value={paymentInfo.cvv}
                          onChange={(e) => setPaymentInfo(prev => ({ ...prev, cvv: e.target.value }))}
                          className="bg-white/5 border-white/10"
                          placeholder="123"
                          maxLength={3}
                        />
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Contact Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactEmail">Email</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            value={contactInfo.email}
                            onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                            className="bg-white/5 border-white/10"
                            placeholder="Email for booking confirmation"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactPhone">Phone</Label>
                          <Input
                            id="contactPhone"
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                            className="bg-white/5 border-white/10"
                            placeholder="Contact phone number"
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={bookFlight} disabled={isBooking} className="w-full">
                      {isBooking ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Complete Booking - ${selectedFlight.selectedPrice * searchCriteria.passengers}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div>
                {/* Booking Summary */}
                <Card className="glass-effect border-white/10">
                  <CardHeader>
                    <CardTitle>Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">{selectedFlight.airline}</h4>
                      <p className="text-sm text-white/70">{selectedFlight.flightNumber}</p>
                    </div>
                    
                    <Separator className="bg-white/10" />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Flight ({searchCriteria.passengers} passenger{searchCriteria.passengers > 1 ? 's' : ''})</span>
                        <span>${selectedFlight.selectedPrice * searchCriteria.passengers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes & Fees</span>
                        <span>Included</span>
                      </div>
                    </div>
                    
                    <Separator className="bg-white/10" />
                    
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${selectedFlight.selectedPrice * searchCriteria.passengers}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* Confirmation */}
        {bookingStep === 'confirmation' && booking && (
          <motion.div variants={fadeInUp} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
              <p className="text-white/70">Your flight has been successfully booked</p>
            </div>

            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Booking Reference</Label>
                    <div className="font-mono text-lg font-bold">{booking.reference}</div>
                  </div>
                  <div>
                    <Label>E-Ticket Number</Label>
                    <div className="font-mono">{booking.confirmationDetails.eTicketNumber}</div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div>
                  <h4 className="font-semibold mb-2">Important Information</h4>
                  <ul className="space-y-1 text-sm text-white/70">
                    <li>• Check-in: {booking.confirmationDetails.checkinTime}</li>
                    <li>• Baggage: {booking.confirmationDetails.baggageAllowance}</li>
                    <li>• Seat selection: {booking.confirmationDetails.seatSelection}</li>
                    <li>• Special meals: {booking.confirmationDetails.specialMeals}</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => router.push('/dashboard')} className="flex-1">
                    Back to Dashboard
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Download Confirmation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}