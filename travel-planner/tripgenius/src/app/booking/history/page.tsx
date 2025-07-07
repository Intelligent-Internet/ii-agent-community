'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Hotel,
  Plane,
  Calendar,
  DollarSign,
  User,
  Filter,
  Search,
  Loader,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Download,
  Eye
} from 'lucide-react';
import Link from 'next/link';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

interface Booking {
  id: string;
  type: 'hotel' | 'flight';
  reference: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  totalAmount: number;
  bookingData: any;
  createdAt: string;
  updatedAt: string;
}

export default function BookingHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchBookings();
    }
  }, [session, filters]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);

      const response = await fetch(`/api/booking/history?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      let filteredBookings = data.bookings;

      // Apply search filter locally
      if (filters.search) {
        filteredBookings = filteredBookings.filter((booking: Booking) =>
          booking.reference.toLowerCase().includes(filters.search.toLowerCase()) ||
          booking.bookingData?.hotelName?.toLowerCase().includes(filters.search.toLowerCase()) ||
          booking.bookingData?.airline?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setBookings(filteredBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'hotel':
        return <Hotel className="w-5 h-5 text-blue-400" />;
      case 'flight':
        return <Plane className="w-5 h-5 text-green-400" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getBookingDetails = (booking: Booking) => {
    switch (booking.type) {
      case 'hotel':
        return {
          title: booking.bookingData?.hotelName || 'Hotel Booking',
          subtitle: `${booking.bookingData?.checkIn} - ${booking.bookingData?.checkOut}`,
          location: booking.bookingData?.location || '',
          details: `${booking.bookingData?.nights} night${booking.bookingData?.nights > 1 ? 's' : ''} • ${booking.bookingData?.guests} guest${booking.bookingData?.guests > 1 ? 's' : ''}`
        };
      case 'flight':
        return {
          title: booking.bookingData?.airline || 'Flight Booking',
          subtitle: booking.bookingData?.flightNumber || '',
          location: `${booking.bookingData?.origin} → ${booking.bookingData?.destination}`,
          details: `${booking.bookingData?.passengers} passenger${booking.bookingData?.passengers > 1 ? 's' : ''} • ${booking.bookingData?.travelClass}`
        };
      default:
        return {
          title: 'Booking',
          subtitle: booking.reference,
          location: '',
          details: ''
        };
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
            <h1 className="text-3xl font-bold">Booking History</h1>
            <p className="text-white/70">View and manage your travel bookings</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeInUp} className="mb-8">
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="w-40 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="hotel">Hotels</SelectItem>
                    <SelectItem value="flight">Flights</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-40 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                    <Input
                      placeholder="Search by reference, hotel, airline..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <motion.div variants={fadeInUp}>
            <Card className="glass-effect border-white/10">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
                <p className="text-white/70 mb-6">You haven't made any bookings yet or no bookings match your filters.</p>
                <div className="flex gap-4 justify-center">
                  <Link href="/booking/hotels">
                    <Button variant="outline">Book Hotels</Button>
                  </Link>
                  <Link href="/booking/flights">
                    <Button variant="outline">Book Flights</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} className="space-y-4">
            {bookings.map((booking) => {
              const details = getBookingDetails(booking);
              return (
                <Card key={booking.id} className="glass-effect border-white/10 hover:bg-white/5 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getBookingIcon(booking.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{details.title}</h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <p className="text-sm text-white/70 mb-1">{details.subtitle}</p>
                          
                          {details.location && (
                            <p className="text-sm text-white/60 mb-2">{details.location}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-white/50">
                            <span>Ref: {booking.reference}</span>
                            <span>•</span>
                            <span>Booked: {format(new Date(booking.createdAt), 'MMM d, yyyy')}</span>
                            {details.details && (
                              <>
                                <span>•</span>
                                <span>{details.details}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">${booking.totalAmount}</div>
                          <div className="text-xs text-white/50 capitalize">{booking.type}</div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Summary Stats */}
        {!loading && bookings.length > 0 && (
          <motion.div variants={fadeInUp} className="mt-8">
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="font-semibold">{bookings.length}</p>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4 text-center">
                  <Hotel className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm text-muted-foreground">Hotel Bookings</p>
                  <p className="font-semibold">{bookings.filter(b => b.type === 'hotel').length}</p>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4 text-center">
                  <Plane className="w-6 h-6 mx-auto mb-2 text-green-400" />
                  <p className="text-sm text-muted-foreground">Flight Bookings</p>
                  <p className="font-semibold">{bookings.filter(b => b.type === 'flight').length}</p>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="font-semibold">${bookings.reduce((sum, b) => sum + b.totalAmount, 0)}</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}