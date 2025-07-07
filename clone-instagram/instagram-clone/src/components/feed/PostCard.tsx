"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Post } from "@/types/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment?: (postId: string) => void; // Make optional since we'll use navigation
}

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleLike = () => {
    onLike(post.id);
  };

  const handleComment = () => {
    // Navigate to post detail page instead of callback
    router.push(`/post/${post.id}`);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev < post.mediaUrls.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : post.mediaUrls.length - 1
    );
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.user.profileImage} />
              <AvatarFallback>
                {post.user.displayName?.charAt(0) || post.user.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{post.user.username}</p>
                {post.user.isVerified && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    ✓
                  </Badge>
                )}
              </div>
              {post.location && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{post.location}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Post Media */}
        <div className="relative">
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
            {post.mediaUrls.length > 0 && (
              <img
                src={post.mediaUrls[currentImageIndex]}
                alt={`Post by ${post.user.username}`}
                className="w-full h-full object-cover"
                onDoubleClick={handleLike}
              />
            )}
          </div>
          
          {/* Carousel Controls */}
          {post.mediaUrls.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity"
              >
                ←
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity"
              >
                →
              </button>
              
              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                {post.mediaUrls.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      index === currentImageIndex
                        ? "bg-white"
                        : "bg-white bg-opacity-50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Post Actions */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto"
                onClick={handleLike}
              >
                <Heart 
                  className={cn(
                    "h-6 w-6 transition-colors",
                    post.isLiked 
                      ? "fill-red-500 text-red-500" 
                      : "text-gray-900 dark:text-gray-100"
                  )} 
                />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto"
                onClick={handleComment}
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                <Send className="h-6 w-6" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="p-0 h-auto">
              <Bookmark className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="space-y-1">
            <p className="font-semibold text-sm">
              {post.likesCount.toLocaleString()} likes
            </p>
            
            {post.caption && (
              <p className="text-sm">
                <span className="font-semibold">{post.user.username}</span>{" "}
                {post.caption}
              </p>
            )}
            
            {post.commentsCount > 0 && (
              <button 
                onClick={handleComment}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View all {post.commentsCount} comments
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}