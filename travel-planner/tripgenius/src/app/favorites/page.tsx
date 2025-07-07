'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Heart,
  Calendar,
  MapPin,
  DollarSign,
  Search,
  Loader,
  Eye,
  HeartOff,
  Filter,
  Star,
  Globe,
  Clock,
  Users
} from 'lucide-react';
import Link from 'next/link';

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

interface FavoriteItinerary {
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
  createdAt: string;
  updatedAt: string;
  favoritedAt: string;
  activityCount: number;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [favorites, setFavorites] = useState<FavoriteItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [removingFavorite, setRemovingFavorite] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchFavorites();
    }
  }, [session]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/itineraries/favorites');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch favorites');
      }

      setFavorites(data.favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (itineraryId: string) => {
    setRemovingFavorite(itineraryId);
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/favorite`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove from favorites');
      }

      setFavorites(prev => prev.filter(fav => fav.id !== itineraryId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove from favorites');
    } finally {
      setRemovingFavorite(null);
    }
  };

  const filteredFavorites = favorites.filter(favorite => 
    favorite.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    favorite.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    favorite.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Draft</Badge>;
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-8 h-8 animate-spin mx-auto text-white" />
          <p className="text-white/70">Loading your favorite itineraries...</p>
        </div>
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-400" />
              Favorite Itineraries
            </h1>
            <p className="text-white/70">Your saved travel plans and inspiration</p>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div variants={fadeInUp} className="mb-8">
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                  <Input
                    placeholder="Search favorite itineraries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10"
                  />
                </div>
                <div className="text-sm text-white/70">
                  {filteredFavorites.length} of {favorites.length} itineraries
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Favorites Grid */}
        {filteredFavorites.length === 0 ? (
          <motion.div variants={fadeInUp}>
            <Card className="glass-effect border-white/10">
              <CardContent className="p-12 text-center">
                <Heart className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-semibold mb-2">
                  {favorites.length === 0 ? 'No favorite itineraries yet' : 'No itineraries match your search'}
                </h3>
                <p className="text-white/70 mb-6">
                  {favorites.length === 0 
                    ? 'Start exploring and save your favorite travel plans!'
                    : 'Try adjusting your search terms to find your saved itineraries.'
                  }
                </p>
                {favorites.length === 0 && (
                  <div className="flex gap-4 justify-center">
                    <Link href="/create-trip">
                      <Button>Create New Trip</Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="outline">Browse Itineraries</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredFavorites.map((favorite) => {
                const duration = differenceInDays(parseISO(favorite.endDate), parseISO(favorite.startDate));
                
                return (
                  <motion.div
                    key={favorite.id}
                    variants={fadeInUp}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <Card className="glass-effect border-white/10 hover:bg-white/5 transition-all duration-300 group h-full">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1 line-clamp-1">{favorite.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <MapPin className="w-4 h-4" />
                              {favorite.destination}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFromFavorites(favorite.id)}
                            disabled={removingFavorite === favorite.id}
                          >
                            {removingFavorite === favorite.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <HeartOff className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(favorite.status)}
                          {favorite.aiGenerated && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-sm text-white/70 line-clamp-2">{favorite.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span>{duration + 1} days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-green-400" />
                            <span>{favorite.activityCount} activities</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-yellow-400" />
                            <span>{favorite.currency} {favorite.budget}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <span>{format(parseISO(favorite.favoritedAt), 'MMM d')}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-xs text-white/50">
                            {format(parseISO(favorite.startDate), 'MMM d')} - {format(parseISO(favorite.endDate), 'MMM d, yyyy')}
                          </div>
                          
                          <div className="flex gap-2">
                            <Link href={`/itinerary/${favorite.id}`} className="flex-1">
                              <Button size="sm" className="w-full">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Summary Stats */}
        {favorites.length > 0 && (
          <motion.div variants={fadeInUp} className="mt-12">
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-center">Your Travel Dreams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-400">{favorites.length}</div>
                    <div className="text-sm text-white/70">Favorite Trips</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {favorites.reduce((sum, fav) => sum + fav.activityCount, 0)}
                    </div>
                    <div className="text-sm text-white/70">Total Activities</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {new Set(favorites.map(fav => fav.destination)).size}
                    </div>
                    <div className="text-sm text-white/70">Destinations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {favorites.filter(fav => fav.aiGenerated).length}
                    </div>
                    <div className="text-sm text-white/70">AI Generated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}