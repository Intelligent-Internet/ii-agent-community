'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Settings,
  CreditCard,
  Globe,
  Heart,
  Utensils,
  Accessibility,
  Bell,
  Shield,
  Calendar,
  MapPin,
  DollarSign,
  Plane,
  Hotel,
  Save,
  Loader,
  Edit
} from 'lucide-react';
import Link from 'next/link';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

interface UserProfile {
  email: string;
  name: string;
  joinedAt: string;
  preferences?: {
    preferred_currency: string;
    budget_range: string;
    travel_style: string;
    interests: string[];
    dietary_restrictions: string;
    accessibility_needs: string;
    notification_settings: {
      email: boolean;
      push: boolean;
    };
  };
  stats: {
    total_bookings: number;
    hotel_bookings: number;
    flight_bookings: number;
    total_spent: number;
    total_itineraries: number;
  };
}

const interestOptions = [
  'Adventure Sports', 'Architecture', 'Art & Museums', 'Beaches', 'Culture & History',
  'Food & Dining', 'Local Markets', 'Music & Entertainment', 'Nature & Wildlife',
  'Nightlife', 'Photography', 'Religious Sites', 'Shopping', 'Wellness & Spa'
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    preferences: {
      preferred_currency: 'USD',
      budget_range: '',
      travel_style: '',
      interests: [] as string[],
      dietary_restrictions: '',
      accessibility_needs: '',
      notification_settings: {
        email: true,
        push: false
      }
    }
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setProfile(data.profile);
      
      // Set form data
      setFormData({
        name: data.profile.name || '',
        preferences: {
          preferred_currency: data.profile.preferences?.preferred_currency || 'USD',
          budget_range: data.profile.preferences?.budget_range || '',
          travel_style: data.profile.preferences?.travel_style || '',
          interests: data.profile.preferences?.interests || [],
          dietary_restrictions: data.profile.preferences?.dietary_restrictions || '',
          accessibility_needs: data.profile.preferences?.accessibility_needs || '',
          notification_settings: data.profile.preferences?.notification_settings || {
            email: true,
            push: false
          }
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile(); // Refresh the profile data
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        interests: prev.preferences.interests.includes(interest)
          ? prev.preferences.interests.filter(i => i !== interest)
          : [...prev.preferences.interests, interest]
      }
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-8 h-8 animate-spin mx-auto text-white" />
          <p className="text-white/70">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-['Nunito_Sans']">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-white/70">Manage your account settings and preferences</p>
            </div>
          </div>
          
          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div variants={fadeInUp}>
              <Card className="glass-effect border-white/10">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-white/5 border-white/10"
                          placeholder="Your full name"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold mb-1">{profile.name}</h2>
                      <p className="text-white/70 mb-4">{profile.email}</p>
                    </>
                  )}
                  
                  <div className="text-sm text-white/50">
                    Member since {format(new Date(profile.joinedAt), 'MMMM yyyy')}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={fadeInUp}>
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Travel Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{profile.stats.total_itineraries}</div>
                      <div className="text-xs text-white/70">Itineraries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{profile.stats.total_bookings}</div>
                      <div className="text-xs text-white/70">Bookings</div>
                    </div>
                  </div>
                  
                  <Separator className="bg-white/10" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hotel className="w-4 h-4 text-blue-400" />
                        <span className="text-sm">Hotels</span>
                      </div>
                      <span className="font-semibold">{profile.stats.hotel_bookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-green-400" />
                        <span className="text-sm">Flights</span>
                      </div>
                      <span className="font-semibold">{profile.stats.flight_bookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm">Total Spent</span>
                      </div>
                      <span className="font-semibold">${profile.stats.total_spent}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Travel Preferences */}
            <motion.div variants={fadeInUp}>
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Travel Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Preferred Currency</Label>
                      <Select 
                        value={formData.preferences.preferred_currency} 
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, preferred_currency: value }
                        }))}
                        disabled={!editing}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                          <SelectItem value="AUD">AUD (A$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="budget">Budget Range</Label>
                      <Select 
                        value={formData.preferences.budget_range} 
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, budget_range: value }
                        }))}
                        disabled={!editing}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="budget">Budget ($50-150/day)</SelectItem>
                          <SelectItem value="mid-range">Mid-range ($150-300/day)</SelectItem>
                          <SelectItem value="luxury">Luxury ($300+/day)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="travelStyle">Travel Style</Label>
                    <Select 
                      value={formData.preferences.travel_style} 
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, travel_style: value }
                      }))}
                      disabled={!editing}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Select travel style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo Travel</SelectItem>
                        <SelectItem value="couple">Couple</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="group">Group of Friends</SelectItem>
                        <SelectItem value="business">Business Travel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Interests</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {interestOptions.map((interest) => (
                        <div
                          key={interest}
                          className={`cursor-pointer ${editing ? '' : 'pointer-events-none'}`}
                          onClick={() => editing && toggleInterest(interest)}
                        >
                          <Badge
                            variant={formData.preferences.interests.includes(interest) ? "default" : "outline"}
                            className={`w-full justify-center text-xs ${
                              formData.preferences.interests.includes(interest)
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                : "bg-white/5 text-white/70 border-white/20"
                            }`}
                          >
                            {interest}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Special Requirements */}
            <motion.div variants={fadeInUp}>
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Special Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="dietary">Dietary Restrictions</Label>
                    <Textarea
                      id="dietary"
                      value={formData.preferences.dietary_restrictions}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, dietary_restrictions: e.target.value }
                      }))}
                      placeholder="e.g., Vegetarian, Gluten-free, Nut allergies..."
                      className="bg-white/5 border-white/10"
                      disabled={!editing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="accessibility">Accessibility Needs</Label>
                    <Textarea
                      id="accessibility"
                      value={formData.preferences.accessibility_needs}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, accessibility_needs: e.target.value }
                      }))}
                      placeholder="e.g., Wheelchair accessible, Visual assistance..."
                      className="bg-white/5 border-white/10"
                      disabled={!editing}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notification Settings */}
            <motion.div variants={fadeInUp}>
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-white/70">Receive booking confirmations and travel updates</p>
                    </div>
                    <Switch
                      checked={formData.preferences.notification_settings.email}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notification_settings: {
                            ...prev.preferences.notification_settings,
                            email: checked
                          }
                        }
                      }))}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-white/70">Get instant updates on your mobile device</p>
                    </div>
                    <Switch
                      checked={formData.preferences.notification_settings.push}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notification_settings: {
                            ...prev.preferences.notification_settings,
                            push: checked
                          }
                        }
                      }))}
                      disabled={!editing}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}