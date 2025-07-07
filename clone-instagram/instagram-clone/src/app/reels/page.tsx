"use client";

import { useState } from 'react';
import { Play, Pause, Heart, MessageCircle, Send, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

// Mock reels data
const mockReels = [
  {
    id: 1,
    user: {
      username: 'adventure_seeker',
      displayName: 'Adventure Seeker',
      profileImage: 'https://i.pravatar.cc/150?img=1',
      verified: true,
    },
    videoUrl: '/videos/reel1.mp4', // In a real app, this would be actual video URLs
    description: 'Amazing sunset at the Grand Canyon! 🌅 #nature #sunset #travel',
    likes: 15420,
    comments: 892,
    shares: 234,
    music: 'Original Audio - Adventure Seeker',
    isLiked: false,
  },
  {
    id: 2,
    user: {
      username: 'foodie_explorer',
      displayName: 'Foodie Explorer',
      profileImage: 'https://i.pravatar.cc/150?img=2',
      verified: false,
    },
    videoUrl: '/videos/reel2.mp4',
    description: 'Perfect pasta recipe that will blow your mind! 🍝✨ #cooking #pasta #foodie',
    likes: 8756,
    comments: 445,
    shares: 189,
    music: 'Cooking Vibes - FoodieBeats',
    isLiked: true,
  },
  {
    id: 3,
    user: {
      username: 'fitness_guru',
      displayName: 'Fitness Guru',
      profileImage: 'https://i.pravatar.cc/150?img=3',
      verified: true,
    },
    videoUrl: '/videos/reel3.mp4',
    description: '30-day transformation challenge! Who\'s joining? 💪 #fitness #transformation #motivation',
    likes: 23107,
    comments: 1205,
    shares: 567,
    music: 'Workout Beats - GymTunes',
    isLiked: false,
  },
];

export default function ReelsPage() {
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [reels, setReels] = useState(mockReels);

  const currentReel = reels[currentReelIndex];

  const toggleLike = () => {
    setReels(prev => prev.map((reel, index) => 
      index === currentReelIndex 
        ? { 
            ...reel, 
            isLiked: !reel.isLiked,
            likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1
          }
        : reel
    ));
  };

  const goToNextReel = () => {
    if (currentReelIndex < reels.length - 1) {
      setCurrentReelIndex(currentReelIndex + 1);
    }
  };

  const goToPrevReel = () => {
    if (currentReelIndex > 0) {
      setCurrentReelIndex(currentReelIndex - 1);
    }
  };

  return (
    <div className="flex-1 bg-black">
      {/* Mobile-first vertical reels viewer */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* Video placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <Play className="w-12 h-12" />
            </div>
            <p className="text-lg font-medium">Reel {currentReelIndex + 1} of {reels.length}</p>
            <p className="text-sm text-white/70 mt-2">{currentReel.description}</p>
          </div>
        </div>

        {/* Navigation indicators */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {reels.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-6 rounded-full transition-colors ${
                index === currentReelIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* User info and controls overlay */}
        <div className="absolute inset-0 flex">
          {/* Left side - user info and description */}
          <div className="flex-1 flex flex-col justify-end p-4 text-white">
            {/* User info */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 border-2 border-white">
                <AvatarImage src={currentReel.user.profileImage} />
                <AvatarFallback>{currentReel.user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{currentReel.user.username}</span>
                  {currentReel.user.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="mt-1 h-6 px-2 text-xs bg-transparent border-white text-white hover:bg-white hover:text-black">
                  Follow
                </Button>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm mb-2 max-w-xs">{currentReel.description}</p>

            {/* Music info */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs text-white/80 flex-1 truncate">{currentReel.music}</span>
            </div>
          </div>

          {/* Right side - action buttons */}
          <div className="flex flex-col items-center justify-end gap-6 p-4">
            {/* Like button */}
            <button onClick={toggleLike} className="flex flex-col items-center gap-1">
              <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm">
                <Heart 
                  className={`w-6 h-6 ${currentReel.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                />
              </div>
              <span className="text-white text-xs font-medium">
                {currentReel.likes.toLocaleString()}
              </span>
            </button>

            {/* Comment button */}
            <button className="flex flex-col items-center gap-1">
              <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">
                {currentReel.comments.toLocaleString()}
              </span>
            </button>

            {/* Share button */}
            <button className="flex flex-col items-center gap-1">
              <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm">
                <Send className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">
                {currentReel.shares.toLocaleString()}
              </span>
            </button>

            {/* More options */}
            <button className="flex flex-col items-center gap-1">
              <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm">
                <MoreHorizontal className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="absolute inset-y-0 left-0 w-1/3 cursor-pointer" onClick={goToPrevReel} />
        <div className="absolute inset-y-0 right-0 w-1/3 cursor-pointer" onClick={goToNextReel} />

        {/* Top controls */}
        <div className="absolute top-4 left-4 right-16 flex items-center justify-between">
          <h1 className="text-white font-semibold">Reels</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-2 rounded-full bg-black/20 backdrop-blur-sm"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-1">
            {reels.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-0.5 rounded-full transition-colors ${
                  index === currentReelIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}