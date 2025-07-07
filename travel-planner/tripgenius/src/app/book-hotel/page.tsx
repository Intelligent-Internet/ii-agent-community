'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Star,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  Search,
  Filter,
  ChevronDown,
  Check,
  CreditCard,
  Shield,
  Clock,
  Phone,
  Mail,
  Loader,
  Hotel,
  Heart,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  pricePerNightUSD: number;
  totalPrice: number;
  totalPriceUSD: number;
  currency: string;
  nights: number;
  amenities: string[];
  images: string[];
  description: string;
  checkIn: string;
  checkOut: string;
  cancellation: string;
}

interface SearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  priceRange?: string;
}

const getAmenityIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case 'free wifi': return <Wifi className="w-4 h-4" />;
    case 'restaurant': return <Coffee className="w-4 h-4" />;
    case 'fitness center': return <Dumbbell className="w-4 h-4" />;
    case 'pool': return <Waves className="w-4 h-4" />;
    case 'parking': return <Car className="w-4 h-4" />;
    default: return <Check className="w-4 h-4" />;
  }
};

export default function BookHotelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchData, setSearchData] = useState<SearchParams | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [guestDetails, setGuestDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: ''
  });

  // Search form state
  const [searchForm, setSearchForm] = useState({
    destination: searchParams.get('destination') || 'Tokyo',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests') || '2'),
    priceRange: searchParams.get('priceRange') || ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session) {
      searchHotels();
    }
  }, [session, status]);

  const searchHotels = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        destination: searchForm.destination,
        checkIn: searchForm.checkIn,
        checkOut: searchForm.checkOut,
        guests: searchForm.guests.toString(),
        ...(searchForm.priceRange && { priceRange: searchForm.priceRange })
      });

      const response = await fetch(`/api/bookings/hotels?${params}`);
      const data = await response.json();

      if (response.ok) {
        setHotels(data.hotels);
        setSearchData(data.searchParams);
      } else {
        toast.error(data.error || 'Failed to search hotels');
      }
    } catch (error) {
      console.error('Error searching hotels:', error);
      toast.error('Failed to search hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleBookHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setIsBookingDialogOpen(true);
  };

  const confirmBooking = async () => {
    if (!selectedHotel || !guestDetails.firstName || !guestDetails.lastName || !guestDetails.email) {
      toast.error('Please fill in all required guest details');
      return;
    }

    try {
      setIsBooking(true);
      
      const response = await fetch('/api/bookings/hotels/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: selectedHotel.id,
          hotelName: selectedHotel.name,
          location: selectedHotel.location,
          checkIn: searchForm.checkIn,
          checkOut: searchForm.checkOut,
          guests: searchForm.guests,
          rooms: 1,
          pricePerNight: selectedHotel.pricePerNight,
          totalPrice: selectedHotel.totalPrice,
          currency: selectedHotel.currency,
          guestDetails
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Hotel booked successfully!');
        setIsBookingDialogOpen(false);
        
        // Redirect to booking confirmation page
        router.push(`/booking-confirmation?type=hotel&id=${data.booking.id}&confirmation=${data.booking.confirmationNumber}`);
      } else {
        toast.error(data.error || 'Failed to book hotel');
      }
    } catch (error) {
      console.error('Error booking hotel:', error);
      toast.error('Failed to book hotel');
    } finally {
      setIsBooking(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-border/20 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center space-x-2 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Book Hotels</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Secure Booking</span>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="border-b border-border/20 bg-background/40 backdrop-blur-md">
        <div className="container py-6">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="flex flex-wrap gap-4 items-end"
          >
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="Where are you staying?"
                value={searchForm.destination}
                onChange={(e) => setSearchForm(prev => ({ ...prev, destination: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            
            <div>
              <Label htmlFor="checkIn">Check In</Label>
              <Input
                id="checkIn"
                type="date"
                value={searchForm.checkIn}
                onChange={(e) => setSearchForm(prev => ({ ...prev, checkIn: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            
            <div>
              <Label htmlFor="checkOut">Check Out</Label>
              <Input
                id="checkOut"
                type="date"
                value={searchForm.checkOut}
                onChange={(e) => setSearchForm(prev => ({ ...prev, checkOut: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            
            <div>
              <Label htmlFor="guests">Guests</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                max="10"
                value={searchForm.guests}
                onChange={(e) => setSearchForm(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                className="bg-white/5 border-white/10 w-20"
              />
            </div>
            
            <Button onClick={searchHotels} className="travel-gradient" disabled={loading}>
              {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* Search Results Header */}
          {searchData && (
            <motion.div variants={fadeInUp} className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white">
                Hotels in {searchData.destination}
              </h1>
              <p className="text-muted-foreground">
                {searchData.checkIn && searchData.checkOut && (
                  <>
                    {format(parseISO(searchData.checkIn), 'MMM d')} - {format(parseISO(searchData.checkOut), 'MMM d, yyyy')}
                    {' • '}
                    {searchData.nights} {searchData.nights === 1 ? 'night' : 'nights'}
                    {' • '}
                    {searchData.guests} {searchData.guests === 1 ? 'guest' : 'guests'}
                  </>
                )}
              </p>
              {hotels.length > 0 && (
                <Badge variant="outline">
                  {hotels.length} hotels found
                </Badge>
              )}
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
              <p className="text-muted-foreground">Searching for the best hotels...</p>
            </div>
          )}

          {/* Hotel Results */}
          {!loading && hotels.length > 0 && (
            <motion.div variants={fadeInUp} className="space-y-6">
              <AnimatePresence>
                {hotels.map((hotel, index) => (
                  <motion.div
                    key={hotel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-effect border-white/10 hover:bg-white/5 transition-all duration-300">
                      <CardContent className="p-0">
                        <div className="md:flex">
                          {/* Hotel Image */}
                          <div className="md:w-1/3 relative">
                            <div className="aspect-video md:aspect-square relative overflow-hidden rounded-l-lg">
                              <img
                                src={hotel.images[0]}
                                alt={hotel.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              />
                              <div className="absolute top-4 right-4 flex gap-2">
                                <Button size="sm" variant="ghost" className="bg-black/50 hover:bg-black/70">
                                  <Heart className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="bg-black/50 hover:bg-black/70">
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Hotel Details */}
                          <div className="md:w-2/3 p-6 flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-xl font-semibold text-white mb-1">
                                    {hotel.name}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4" />
                                    {hotel.location}
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">{hotel.rating}</span>
                                    <span className="text-sm text-muted-foreground">
                                      ({hotel.reviews} reviews)
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-muted-foreground text-sm">
                                {hotel.description}
                              </p>
                              
                              {/* Amenities */}
                              <div className="flex flex-wrap gap-2">
                                {hotel.amenities.slice(0, 4).map((amenity) => (
                                  <Badge key={amenity} variant="outline" className="text-xs">
                                    {getAmenityIcon(amenity)}
                                    <span className="ml-1">{amenity}</span>
                                  </Badge>
                                ))}
                                {hotel.amenities.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{hotel.amenities.length - 4} more
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Cancellation Policy */}
                              <div className="flex items-center gap-2 text-sm text-green-400">
                                <Check className="w-4 h-4" />
                                {hotel.cancellation}
                              </div>
                            </div>
                            
                            {/* Pricing and Booking */}
                            <div className="flex items-end justify-between mt-6 pt-4 border-t border-white/10">
                              <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">
                                  {hotel.nights} {hotel.nights === 1 ? 'night' : 'nights'} total
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-white">
                                    ¥{hotel.totalPrice.toLocaleString()}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    (${hotel.totalPriceUSD})
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ¥{hotel.pricePerNight.toLocaleString()} per night
                                </div>
                              </div>
                              
                              <Button 
                                onClick={() => handleBookHotel(hotel)}
                                className="travel-gradient"
                              >
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && hotels.length === 0 && searchData && (
            <div className="text-center py-12">
              <Hotel className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No hotels found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or choosing a different destination.
              </p>
              <Button onClick={searchHotels} variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Search Again
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="glass-effect border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              Complete Your Booking
            </DialogTitle>
          </DialogHeader>
          
          {selectedHotel && (
            <div className="space-y-6">
              {/* Hotel Summary */}
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={selectedHotel.images[0]}
                      alt={selectedHotel.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{selectedHotel.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{selectedHotel.location}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {searchForm.checkIn} to {searchForm.checkOut}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {searchForm.guests} guests
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">¥{selectedHotel.totalPrice.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{selectedHotel.nights} nights</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Guest Details Form */}
              <div className="space-y-4">
                <h4 className="font-semibold">Guest Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={guestDetails.firstName}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={guestDetails.lastName}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, lastName: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={guestDetails.email}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={guestDetails.phone}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Input
                    id="specialRequests"
                    placeholder="Any special requests or requirements..."
                    value={guestDetails.specialRequests}
                    onChange={(e) => setGuestDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              
              {/* Payment Info */}
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <CreditCard className="w-4 h-4" />
                    Payment will be processed securely
                  </div>
                  <div className="text-sm text-muted-foreground">
                    This is a demo booking. No actual payment will be charged.
                  </div>
                </CardContent>
              </Card>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsBookingDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmBooking}
                  disabled={isBooking}
                  className="flex-1 travel-gradient"
                >
                  {isBooking ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}