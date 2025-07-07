'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isSameDay, differenceInDays } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Star,
  Edit,
  Trash2,
  Plus,
  Share2,
  Download,
  MoreVertical,
  Globe,
  Sparkles,
  Navigation,
  Camera,
  Coffee,
  Plane,
  Hotel,
  Loader,
  GripVertical
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

// Activity type icons
const getActivityIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'sightseeing': return <Globe className="w-4 h-4" />;
    case 'food': return <Coffee className="w-4 h-4" />;
    case 'transportation': return <Navigation className="w-4 h-4" />;
    case 'photography': return <Camera className="w-4 h-4" />;
    case 'accommodation': return <Hotel className="w-4 h-4" />;
    default: return <Star className="w-4 h-4" />;
  }
};

// Activity type colors
const getActivityColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'sightseeing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'food': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'transportation': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'photography': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'accommodation': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

// Get relevant image for activity based on title and category
const getActivityImage = (title: string, category: string): string => {
  const titleLower = title.toLowerCase();
  
  // Transportation images
  if (category.toLowerCase() === 'transportation' || titleLower.includes('airport') || titleLower.includes('narita') || titleLower.includes('train')) {
    return 'https://onb-cdn.b-cdn.net/images-stn-japan/8-Narita_Express1.jpg';
  }
  
  // Food/dining images
  if (category.toLowerCase() === 'food' || titleLower.includes('restaurant') || titleLower.includes('dining') || titleLower.includes('eat')) {
    return 'https://i.guim.co.uk/img/media/2f23ce0d88fbacb2821189865b4797c92bece738/0_63_1300_780/master/1300.jpg?width=1200&quality=85&auto=format&fit=max&s=32dd373f02d7fa7c385150d66cd7870a';
  }
  
  // Shopping/Shibuya images
  if (titleLower.includes('shibuya') || titleLower.includes('shopping') || titleLower.includes('crossing')) {
    return 'https://media.cnn.com/api/v1/images/stellar/prod/190614112030-15-shibuya-crossing-story-only.jpg?q=w_2354,h_1569,x_0,y_0,c_fill';
  }
  
  // Temple/traditional sightseeing
  if (titleLower.includes('temple') || titleLower.includes('asakusa') || titleLower.includes('senso') || titleLower.includes('traditional')) {
    return 'https://res-4.cloudinary.com/jnto/image/upload/w_2064,h_1300,c_fill,f_auto,fl_lossy,q_auto/v1675339920/tokyo/Tokyo_s_id19_18';
  }
  
  // Skytree/modern Tokyo
  if (titleLower.includes('skytree') || titleLower.includes('tower') || titleLower.includes('view') || titleLower.includes('observation')) {
    return 'https://i.redd.it/lktnzcnxea1c1.jpg';
  }
  
  // Default Tokyo skyline for other sightseeing
  if (category.toLowerCase() === 'sightseeing') {
    return 'https://media.istockphoto.com/id/1502444888/photo/aerial-view-of-tokyo-cityscape-with-fuji-mountain-in-japan.jpg?s=612x612&w=0&k=20&c=uR79tqwlXspSvmw3mJYXqHgvfN34zVOgPHyEzpeeCCE=';
  }
  
  // Default image for other activities
  return 'https://www.gotokyo.org/en/new-and-now/new-and-trending/221226/images/221226en_sub006_1.jpg';
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
  aiSuggested: boolean;
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
  createdAt: string;
  updatedAt: string;
}

// Sortable Activity Item Component
function SortableActivityItem({ 
  activity, 
  onEdit, 
  onDelete, 
  isDragging: globalIsDragging 
}: { 
  activity: Activity; 
  onEdit: (activity: Activity) => void; 
  onDelete: (id: string) => void;
  isDragging: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: activity.id,
    data: {
      type: 'activity',
      activity
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: 0 }}
      className={`${isDragging ? 'z-50' : ''}`}
    >
      <Card className={`glass-effect border-white/10 hover:bg-white/5 transition-all duration-300 group overflow-hidden ${isDragging ? 'shadow-2xl border-purple-500/50' : ''}`}>
        <CardContent className="p-0">
          <div className="flex">
            {/* Drag Handle */}
            <div 
              className="flex items-center justify-center w-8 bg-white/5 hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing border-r border-white/10"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4 text-white/60" />
            </div>
            
            {/* Activity Image */}
            <div className="relative w-32 h-24 flex-shrink-0">
              <img
                src={getActivityImage(activity.title, activity.category)}
                alt={activity.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://www.gotokyo.org/en/new-and-now/new-and-trending/221226/images/221226en_sub006_1.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
              <div className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center ${getActivityColor(activity.category)}`}>
                {getActivityIcon(activity.category)}
              </div>
            </div>
            
            {/* Activity Content */}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between h-full">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{activity.title}</h4>
                    {activity.aiSuggested && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.startTime} - {activity.endTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activity.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${activity.cost}
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="capitalize text-xs w-fit">
                    {activity.category}
                  </Badge>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onEdit(activity)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                    onClick={() => onDelete(activity.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Droppable Day Container Component
function DroppableDay({ 
  day, 
  activities, 
  onEdit, 
  onDelete, 
  isDragging 
}: { 
  day: string; 
  activities: Activity[]; 
  onEdit: (activity: Activity) => void; 
  onDelete: (id: string) => void;
  isDragging: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: `day-${day}`,
    data: {
      type: 'day',
      day
    }
  });

  return (
    <div ref={setNodeRef} className="space-y-3 min-h-[100px]">
      <SortableContext items={activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
        <AnimatePresence>
          {activities.map((activity) => (
            <SortableActivityItem
              key={activity.id}
              activity={activity}
              onEdit={onEdit}
              onDelete={onDelete}
              isDragging={isDragging}
            />
          ))}
        </AnimatePresence>
      </SortableContext>
      
      {activities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-white/10 rounded-lg bg-white/5">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No activities planned for this day</p>
          <p className="text-xs mt-1">Drag activities here or add new ones</p>
          <Button size="sm" variant="outline" className="mt-2">
            <Plus className="w-4 h-4 mr-2" />
            Add Activity
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ItineraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchItinerary = async () => {
    try {
      const response = await fetch(`/api/itineraries/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch itinerary');
      }

      setItinerary(data.itinerary);
      
      // Set first day as selected by default
      if (data.itinerary.activities.length > 0) {
        const firstDay = data.itinerary.activities[0].date;
        setSelectedDay(firstDay);
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load itinerary');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && session) {
      fetchItinerary();
    }
  }, [id, session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-8 h-8 animate-spin mx-auto text-white" />
          <p className="text-white/70">Loading your amazing itinerary...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Itinerary not found</h1>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!over || active.id === over.id) {
      return;
    }

    // Find the source activity
    const activeActivity = itinerary.activities.find(a => a.id === active.id);
    if (!activeActivity) return;

    // Extract day and position from drop target
    const overData = over.data.current;
    let targetDay: string;
    let targetPosition: number;

    if (overData?.type === 'activity') {
      // Dropped on another activity
      const targetActivity = itinerary.activities.find(a => a.id === over.id);
      if (!targetActivity) return;
      
      targetDay = targetActivity.date;
      const activitiesInDay = itinerary.activities.filter(a => a.date === targetDay);
      targetPosition = activitiesInDay.findIndex(a => a.id === over.id);
    } else if (overData?.type === 'day') {
      // Dropped on an empty day
      targetDay = overData.day;
      targetPosition = 0;
    } else {
      return;
    }

    // Update activities array
    const updatedActivities = [...itinerary.activities];
    const activeIndex = updatedActivities.findIndex(a => a.id === active.id);
    
    // Update the activity's date
    updatedActivities[activeIndex] = {
      ...updatedActivities[activeIndex],
      date: targetDay
    };

    // Reorder activities within the target day
    const activitiesInTargetDay = updatedActivities.filter(a => a.date === targetDay);
    const activitiesNotInTargetDay = updatedActivities.filter(a => a.date !== targetDay);
    
    // Remove the moved activity from its current position
    const activityToMove = activitiesInTargetDay.find(a => a.id === active.id);
    const otherActivitiesInDay = activitiesInTargetDay.filter(a => a.id !== active.id);
    
    // Insert at the target position
    if (activityToMove) {
      otherActivitiesInDay.splice(targetPosition, 0, activityToMove);
    }

    const finalActivities = [...activitiesNotInTargetDay, ...otherActivitiesInDay];

    // Update local state
    setItinerary({
      ...itinerary,
      activities: finalActivities
    });

    // Save to backend
    try {
      const response = await fetch(`/api/itineraries/${id}/activities/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activities: finalActivities.map((activity, index) => ({
            id: activity.id,
            date: activity.date,
            order: index
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update activity order');
      }

      toast.success('Activity order updated');
    } catch (error) {
      console.error('Error updating activity order:', error);
      toast.error('Failed to update activity order');
      // Revert changes
      fetchItinerary();
    }
  };

  // Group activities by day
  const groupedActivities = itinerary.activities.reduce((acc, activity) => {
    const date = activity.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  const days = Object.keys(groupedActivities).sort();
  const totalDays = differenceInDays(parseISO(itinerary.endDate), parseISO(itinerary.startDate)) + 1;
  const totalCost = itinerary.activities.reduce((sum, activity) => sum + activity.cost, 0);

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
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">TripGenius</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Itinerary
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {itinerary.aiGenerated && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {itinerary.status}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold text-white">
              {itinerary.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {itinerary.description}
            </p>
          </motion.div>

          {/* Trip Stats */}
          <motion.div variants={fadeInUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4 text-center">
                  <MapPin className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-semibold">{itinerary.destination}</p>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-green-400" />
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{totalDays} Days</p>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="font-semibold">${totalCost}</p>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4 text-center">
                  <Star className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm text-muted-foreground">Activities</p>
                  <p className="font-semibold">{itinerary.activities.length}</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Interactive Map */}
          <motion.div variants={fadeInUp}>
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Activity Locations
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Explore all your planned activities on the map
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative">
                  <div className="h-80 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-b-lg overflow-hidden">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.827853253896!2d139.69171531526186!3d35.68948948019315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188b5a9b01ff1b%3A0xe8de16b0c6c5d8b6!2sTokyo%2C%20Japan!5e0!3m2!1sen!2sus!4v1623456789012!5m2!1sen!2sus"
                      width="100%"
                      height="320"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="filter brightness-110 contrast-110 saturate-110"
                    />
                  </div>
                  
                  {/* Map Overlay with Activity Markers */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 pointer-events-auto">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Key Locations
                      </h4>
                      <div className="space-y-2 text-sm">
                        {/* Sample locations from common Tokyo attractions */}
                        <div className="flex items-center gap-2 text-white/80">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          Shibuya Crossing
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Senso-ji Temple
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          Tokyo Skytree
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          Narita Airport
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 pointer-events-auto">
                      <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <Navigation className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timeline with Drag & Drop */}
          <motion.div variants={fadeInUp}>
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Your Itinerary Timeline
                  {isDragging && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs ml-2">
                      <GripVertical className="w-3 h-3 mr-1" />
                      Dragging
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag activities to reorder them or move between days
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <Tabs value={selectedDay} onValueChange={setSelectedDay}>
                    {/* Day Selector */}
                    <TabsList className="grid w-full grid-cols-auto bg-white/5" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                      {days.map((day, index) => (
                        <TabsTrigger key={day} value={day} className="text-sm">
                          Day {index + 1}
                          <br />
                          <span className="text-xs opacity-70">
                            {format(parseISO(day), 'MMM d')}
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* Day Content */}
                    {days.map((day) => (
                      <TabsContent key={day} value={day} className="space-y-4 mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                            {format(parseISO(day), 'EEEE, MMMM d, yyyy')}
                          </h3>
                          <Button size="sm" variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Activity
                          </Button>
                        </div>

                        <DroppableDay
                          day={day}
                          activities={groupedActivities[day] || []}
                          onEdit={(activity) => {
                            setEditingActivity(activity);
                            setIsEditDialogOpen(true);
                          }}
                          onDelete={(id) => {
                            // Add delete functionality here
                            console.log('Delete activity:', id);
                          }}
                          isDragging={isDragging}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>

                  <DragOverlay>
                    {activeId ? (
                      <SortableActivityItem
                        activity={itinerary.activities.find(a => a.id === activeId)!}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        isDragging={true}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp}>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="glass-effect border-white/10 hover:bg-white/5 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Hotel className="w-8 h-8 mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-2">Book Hotels</h3>
                  <p className="text-sm text-muted-foreground">Find and book accommodations</p>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-white/10 hover:bg-white/5 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Plane className="w-8 h-8 mx-auto mb-4 text-green-400 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-2">Book Flights</h3>
                  <p className="text-sm text-muted-foreground">Search and book flights</p>
                </CardContent>
              </Card>
              
              <Card className="glass-effect border-white/10 hover:bg-white/5 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Navigation className="w-8 h-8 mx-auto mb-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-2">Get Directions</h3>
                  <p className="text-sm text-muted-foreground">Navigate between activities</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Edit Activity Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-effect border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          
          {editingActivity && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  defaultValue={editingActivity.title}
                  className="bg-white/5 border-white/10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue={editingActivity.description}
                  className="bg-white/5 border-white/10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    defaultValue={editingActivity.startTime}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    defaultValue={editingActivity.endTime}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="travel-gradient">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}