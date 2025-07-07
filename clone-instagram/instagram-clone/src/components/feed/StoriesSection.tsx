"use client";

import { useRouter } from "next/navigation";
import { Story } from "@/types/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StoriesSectionProps {
  stories: Story[];
}

export default function StoriesSection({ stories }: StoriesSectionProps) {
  const router = useRouter();
  
  if (stories.length === 0) {
    return null;
  }

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = {
        user: story.user,
        stories: [],
        hasUnviewed: false,
      };
    }
    acc[story.userId].stories.push(story);
    if (!story.isViewed) {
      acc[story.userId].hasUnviewed = true;
    }
    return acc;
  }, {} as Record<string, { user: any; stories: Story[]; hasUnviewed: boolean }>);

  const userStories = Object.values(groupedStories);

  const handleStoryClick = (userId: string) => {
    router.push(`/stories?user=${userId}`);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {userStories.map(({ user, stories, hasUnviewed }) => (
        <button
          key={user.id}
          onClick={() => handleStoryClick(user.id)}
          className="flex flex-col items-center gap-1 min-w-0 flex-shrink-0"
        >
          <div className="relative">
            <div 
              className={cn(
                "w-16 h-16 rounded-full p-0.5",
                hasUnviewed
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                  : "bg-gray-300"
              )}
            >
              <Avatar className="w-full h-full border-2 border-white">
                <AvatarImage src={user.profileImage} />
                <AvatarFallback>
                  {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Story count indicator */}
            {stories.length > 1 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {stories.length}
              </div>
            )}
          </div>
          
          <span className="text-xs text-muted-foreground max-w-[64px] truncate">
            {user.username}
          </span>
        </button>
      ))}
    </div>
  );
}