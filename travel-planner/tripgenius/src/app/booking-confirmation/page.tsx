'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Hotel,
  Plane,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Download,
  Share2,
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  Shield
} from 'lucide-react';
import Link from 'next/link';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function BookingConfirmationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const bookingType = searchParams.get('type'); // 'hotel' or 'flight'
  const bookingId = searchParams.get('id');
  const confirmationNumber = searchParams.get('confirmation');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !confirmationNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="glass-effect border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Booking Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The booking confirmation you're looking for could not be found.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getBookingIcon = () => {
    return bookingType === 'hotel' ? <Hotel className="w-8 h-8" /> : <Plane className="w-8 h-8" />;
  };

  const getBookingTitle = () => {
    return bookingType === 'hotel' ? 'Hotel Booking Confirmed' : 'Flight Booking Confirmed';
  };

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Booking Confirmed</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Secure</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="max-w-2xl mx-auto space-y-8"
        >
          {/* Success Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-white">
              {getBookingTitle()}
            </h1>
            <p className="text-muted-foreground">
              Your booking has been successfully confirmed. You'll receive a confirmation email shortly.
            </p>
          </div>

          {/* Confirmation Details */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getBookingIcon()}
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Confirmation Number */}
              <div className="text-center p-6 bg-white/5 rounded-lg border border-white/10">
                <div className="text-sm text-muted-foreground mb-2">Confirmation Number</div>
                <div className="text-2xl font-mono font-bold text-white tracking-wider">
                  {confirmationNumber}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Save this number for your records
                </div>
              </div>

              {/* Booking Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Confirmed
                </Badge>
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment</span>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <CreditCard className="w-3 h-3 mr-1" />
                  Paid
                </Badge>
              </div>

              {/* Booking Date */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Booked On</span>
                <span className="text-white">{new Date().toLocaleDateString()}</span>
              </div>

              {/* Demo Notice */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-300 mb-1">Demo Booking</h4>
                    <p className="text-sm text-yellow-200/80">
                      This is a demonstration booking. No actual reservation has been made and no payment has been processed.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Confirmation Email</h4>
                    <p className="text-sm text-muted-foreground">
                      You'll receive a detailed confirmation email with all booking information.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Customer Support</h4>
                    <p className="text-sm text-muted-foreground">
                      Need help? Contact our 24/7 customer support team.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Check-in Reminders</h4>
                    <p className="text-sm text-muted-foreground">
                      We'll send you check-in reminders and important updates.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Confirmation
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share Booking
            </Button>
            <Button className="flex-1 travel-gradient" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}