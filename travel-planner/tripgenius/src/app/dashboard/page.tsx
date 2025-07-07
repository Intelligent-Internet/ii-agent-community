'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Plus, 
  MapPin, 
  Calendar, 
  Star, 
  Sparkles,
  Clock,
  DollarSign,
  Loader,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Get destination image based on location
const getDestinationImage = (destination: string): string => {
  const destinationLower = destination.toLowerCase();
  
  // Tokyo images
  if (destinationLower.includes('tokyo')) {
    return 'https://media.istockphoto.com/id/1502444888/photo/aerial-view-of-tokyo-cityscape-with-fuji-mountain-in-japan.jpg?s=612x612&w=0&k=20&c=uR79tqwlXspSvmw3mJYXqHgvfN34zVOgPHyEzpeeCCE=';
  }
  
  // Paris images
  if (destinationLower.includes('paris')) {
    return 'https://cdn.britannica.com/98/243598-138-6e31d62a/Overview-Eiffel-Tower-Paris-France.jpg';
  }
  
  // New York images
  if (destinationLower.includes('new york') || destinationLower.includes('nyc')) {
    return 'https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay-New.jpg';
  }
  
  // London images
  if (destinationLower.includes('london')) {
    return 'https://cdn.britannica.com/84/73184-050-05ED59CB/Clocks-face-Clock-Tower-London-England.jpg';
  }
  
  // Bali images
  if (destinationLower.includes('bali')) {
    return 'https://media.timeout.com/images/105240890/750/562/image.jpg';
  }
  
  // Default travel image
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
};

interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  cost: number;
}

interface Itinerary {
  id: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  status: string;
  aiGenerated: boolean;
  activities: Activity[];
  _count: {
    activities: number;
    bookings: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) router.push('/auth/signin');
    else fetchItineraries();
  }, [session, status, router]);

  const fetchItineraries = async () => {
    try {
      const response = await fetch('/api/itineraries');
      const data = await response.json();
      
      if (response.ok) {
        setItineraries(data.itineraries);
      } else {
        console.error('Failed to fetch itineraries:', data.error);
      }
    } catch (error) {
      console.error('Error fetching itineraries:', error);
    } finally {
      setLoading(false);
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
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">TripGenius</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome back, {session.user?.name}!
            </span>
            <Button variant="outline" onClick={() => router.push('/auth/signout')}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">
              Ready for Your Next Adventure?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start planning your perfect trip with AI-powered recommendations
              and seamless booking experiences.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card 
                className="glass-effect hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                onClick={() => router.push('/create-trip')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Create New Trip</h3>
                  <p className="text-muted-foreground text-sm">
                    Let AI plan your perfect itinerary
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-effect hover:bg-white/5 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Explore Destinations</h3>
                  <p className="text-muted-foreground text-sm">
                    Discover amazing places to visit
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-effect hover:bg-white/5 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">My Itineraries</h3>
                  <p className="text-muted-foreground text-sm">
                    View and manage your trips
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activity / Empty State */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Your Itineraries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
                    <p className="text-muted-foreground">Loading your trips...</p>
                  </div>
                ) : itineraries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No trips planned yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start your travel journey by creating your first AI-powered itinerary
                    </p>
                    <Button 
                      className="travel-gradient"
                      onClick={() => router.push('/create-trip')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Plan Your First Trip
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itineraries.map((itinerary, index) => (
                      <motion.div
                        key={itinerary.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card 
                          className="glass-effect hover:bg-white/5 transition-all duration-300 group cursor-pointer overflow-hidden"
                          onClick={() => router.push(`/itinerary/${itinerary.id}`)}
                        >
                          <CardContent className="p-0">
                            <div className="flex">
                              {/* Destination Image */}
                              <div className="relative w-48 h-32 flex-shrink-0">
                                <img
                                  src={getDestinationImage(itinerary.destination)}
                                  alt={itinerary.destination}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
                                <div className="absolute bottom-2 left-2">
                                  <Badge className="bg-black/60 text-white backdrop-blur-sm">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {itinerary.destination}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 p-6">
                                <div className="flex items-start justify-between h-full">
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <div>
                                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                                          {itinerary.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                          {itinerary.description}
                                        </p>
                                      </div>
                                    </div>
                                
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(parseISO(itinerary.startDate), 'MMM d')} - {format(parseISO(itinerary.endDate), 'MMM d')}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {differenceInDays(parseISO(itinerary.endDate), parseISO(itinerary.startDate)) + 1} days
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3" />
                                        {itinerary._count.activities} activities
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="capitalize text-xs">
                                        {itinerary.status}
                                      </Badge>
                                      {itinerary.aiGenerated && (
                                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                                          <Sparkles className="w-3 h-3 mr-1" />
                                          AI Generated
                                        </Badge>
                                      )}
                                      {itinerary.activities.length > 0 && (
                                        <div className="flex -space-x-2 ml-2">
                                          {itinerary.activities.slice(0, 3).map((activity, i) => (
                                            <div
                                              key={activity.id}
                                              className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-background flex items-center justify-center text-xs font-semibold text-white"
                                              title={activity.title}
                                            >
                                              {i + 1}
                                            </div>
                                          ))}
                                          {itinerary._count.activities > 3 && (
                                            <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-background flex items-center justify-center text-xs font-semibold text-white">
                                              +{itinerary._count.activities - 3}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">
                                      Created {format(parseISO(itinerary.createdAt), 'MMM d')}
                                    </p>
                                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Badge variant="outline" className="text-xs">
                                        View Details →
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      className="w-full glass-effect hover:bg-white/5"
                      onClick={() => router.push('/create-trip')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Another Trip
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}