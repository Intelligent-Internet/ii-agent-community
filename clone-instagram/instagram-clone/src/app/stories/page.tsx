"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { Story } from "@/types/api";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Heart, Send, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function StoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user');
  
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserStories(userId);
    } else {
      fetchAllStories();
    }
  }, [userId]);

  useEffect(() => {
    if (stories.length === 0) return;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + 2; // 5 seconds total (100 / 2 = 50 intervals of 100ms)
        });
      }
    }, 100);

    return () => clearInterval(timer);
  }, [currentStoryIndex, stories.length, isPaused]);

  const fetchUserStories = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      const data = await response.json();
      const userStories = data.stories.filter((story: Story) => story.userId === userId);
      setStories(userStories);
    } catch (error) {
      console.error('Error fetching user stories:', error);
      toast.error('Failed to load stories');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllStories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      const data = await response.json();
      setStories(data.stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      router.push('/');
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleStoryClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const centerX = rect.width / 2;

    if (clickX < centerX) {
      prevStory();
    } else {
      nextStory();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <p className="text-lg mb-4">No stories available</p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentStoryIndex];

  return (
    <AuthGuard requireAuth={true}>
      <div className="fixed inset-0 bg-black z-50">
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white bg-opacity-30 rounded">
              <div
                className="h-full bg-white rounded transition-all duration-100"
                style={{
                  width: index < currentStoryIndex ? '100%' : 
                         index === currentStoryIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 text-white">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentStory.user.profileImage} />
              <AvatarFallback>
                {currentStory.user.displayName?.charAt(0) || currentStory.user.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{currentStory.user.username}</p>
              <p className="text-xs opacity-75">
                {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-5 w-5 text-white" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <X className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Navigation arrows */}
        {currentStoryIndex > 0 && (
          <button
            onClick={prevStory}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white opacity-50 hover:opacity-100"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}
        
        {currentStoryIndex < stories.length - 1 && (
          <button
            onClick={nextStory}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white opacity-50 hover:opacity-100"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}

        {/* Story content */}
        <div
          className="h-full flex items-center justify-center cursor-pointer"
          onClick={handleStoryClick}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {currentStory.mediaType === 'image' ? (
            <img
              src={currentStory.mediaUrl}
              alt={`Story by ${currentStory.user.username}`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <video
              src={currentStory.mediaUrl}
              className="max-h-full max-w-full object-contain"
              autoPlay
              muted
              onEnded={nextStory}
            />
          )}
        </div>

        {/* Bottom actions */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-black bg-opacity-50 rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Send message"
                className="w-full bg-transparent text-white placeholder-gray-300 outline-none text-sm"
              />
            </div>
            <Button variant="ghost" size="sm">
              <Heart className="h-5 w-5 text-white" />
            </Button>
            <Button variant="ghost" size="sm">
              <Send className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Story info */}
        <div className="absolute bottom-16 left-4 right-4 text-white text-center z-10">
          <p className="text-sm opacity-75">
            {currentStoryIndex + 1} of {stories.length}
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}