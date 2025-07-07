'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { 
  Globe, 
  Calendar as CalendarIcon, 
  MapPin, 
  Sparkles, 
  ArrowLeft,
  DollarSign,
  Users,
  Heart,
  Plus,
  X,
  Loader
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

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

const interestOptions = [
  'Food & Dining', 'History & Culture', 'Art & Museums', 'Nature & Outdoors',
  'Adventure Sports', 'Nightlife', 'Shopping', 'Architecture', 'Photography',
  'Local Markets', 'Beaches', 'Mountains', 'Wildlife', 'Music & Festivals',
  'Religious Sites', 'Gardens & Parks', 'Street Art', 'Local Transportation'
];

export default function CreateTripPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    budget: '',
    travelStyle: '',
    additionalRequirements: '',
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.destination || !formData.startDate || !formData.endDate || !formData.budget) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.endDate <= formData.startDate) {
        toast.error('End date must be after start date');
        return;
      }

      const requestData = {
        destination: formData.destination,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        budget: formData.budget,
        travelStyle: formData.travelStyle,
        interests: selectedInterests,
        additionalRequirements: formData.additionalRequirements,
      };

      const response = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate itinerary');
      }

      toast.success('🎉 Your personalized itinerary is ready!');
      router.push(`/itinerary/${data.itinerary.id}`);
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create trip');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-border/20 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <ArrowLeft className="w-5 h-5" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">TripGenius</span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {session.user?.name}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-2xl mx-auto space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">
              Plan Your Perfect Adventure
            </h1>
            <p className="text-xl text-muted-foreground">
              Tell us about your dream trip and let our AI create a personalized itinerary just for you
            </p>
          </motion.div>

          {/* Form */}
          <motion.div variants={fadeInUp}>
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Destination */}
                  <motion.div variants={fadeInUp} className="space-y-2">
                    <Label htmlFor="destination" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Where do you want to go? *
                    </Label>
                    <Input
                      id="destination"
                      placeholder="e.g., Paris, Tokyo, New York, Bali"
                      value={formData.destination}
                      onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                      className="bg-white/5 border-white/10"
                      required
                    />
                  </motion.div>

                  {/* Dates */}
                  <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Start Date *
                      </Label>
                      <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-white/5 border-white/10"
                          >
                            {formData.startDate ? (
                              format(formData.startDate, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.startDate}
                            onSelect={(date) => {
                              setFormData(prev => ({ ...prev, startDate: date }));
                              setIsStartDateOpen(false);
                            }}
                            disabled={(date) =>
                              date < new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        End Date *
                      </Label>
                      <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-white/5 border-white/10"
                          >
                            {formData.endDate ? (
                              format(formData.endDate, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.endDate}
                            onSelect={(date) => {
                              setFormData(prev => ({ ...prev, endDate: date }));
                              setIsEndDateOpen(false);
                            }}
                            disabled={(date) =>
                              date < new Date() || 
                              date < new Date('1900-01-01') ||
                              (formData.startDate && date <= formData.startDate)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </motion.div>

                  {/* Budget and Travel Style */}
                  <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Budget Level *
                      </Label>
                      <Select value={formData.budget} onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="budget">Budget (Under $100/day)</SelectItem>
                          <SelectItem value="mid-range">Mid-range ($100-300/day)</SelectItem>
                          <SelectItem value="luxury">Luxury ($300+/day)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Travel Style
                      </Label>
                      <Select value={formData.travelStyle} onValueChange={(value) => setFormData(prev => ({ ...prev, travelStyle: value }))}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="How do you like to travel?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo Travel</SelectItem>
                          <SelectItem value="couple">Couple</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="group">Group of Friends</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>

                  {/* Interests */}
                  <motion.div variants={fadeInUp} className="space-y-4">
                    <Label className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      What interests you? (Select all that apply)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {interestOptions.map((interest) => (
                        <Badge
                          key={interest}
                          variant={selectedInterests.includes(interest) ? "default" : "outline"}
                          className={`cursor-pointer transition-all duration-200 ${
                            selectedInterests.includes(interest)
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                              : 'bg-white/5 border-white/20 hover:bg-white/10'
                          }`}
                          onClick={() => handleInterestToggle(interest)}
                        >
                          {interest}
                          {selectedInterests.includes(interest) && (
                            <X className="w-3 h-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>

                  {/* Additional Requirements */}
                  <motion.div variants={fadeInUp} className="space-y-2">
                    <Label htmlFor="requirements">
                      Any special requirements or preferences?
                    </Label>
                    <Textarea
                      id="requirements"
                      placeholder="e.g., vegetarian restaurants, wheelchair accessible places, avoid crowds, prefer morning activities..."
                      value={formData.additionalRequirements}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalRequirements: e.target.value }))}
                      className="bg-white/5 border-white/10 resize-none"
                      rows={3}
                    />
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div variants={fadeInUp}>
                    <Button
                      type="submit"
                      className="w-full travel-gradient text-lg py-6"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 animate-spin" />
                          Creating Your Perfect Itinerary...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate My Trip with AI
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Cards */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-effect border-white/10 text-center p-4">
              <CardContent className="space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-purple-400" />
                <h3 className="font-semibold">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI creates personalized itineraries based on your preferences
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10 text-center p-4">
              <CardContent className="space-y-2">
                <MapPin className="w-8 h-8 mx-auto text-blue-400" />
                <h3 className="font-semibold">Local Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Discover hidden gems and local favorites at your destination
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10 text-center p-4">
              <CardContent className="space-y-2">
                <DollarSign className="w-8 h-8 mx-auto text-green-400" />
                <h3 className="font-semibold">Budget-Friendly</h3>
                <p className="text-sm text-muted-foreground">
                  Get recommendations that fit perfectly within your budget
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}