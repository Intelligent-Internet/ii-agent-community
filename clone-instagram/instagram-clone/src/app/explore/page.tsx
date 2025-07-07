"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Post, User } from "@/types/api";
import { toast } from "sonner";
import { Search, Heart, MessageCircle } from "lucide-react";

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchExploreData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchExploreData = async () => {
    try {
      setIsLoading(true);
      
      const [postsResponse, usersResponse] = await Promise.all([
        fetch('/api/explore/posts?limit=20'),
        fetch('/api/explore/users?query=&limit=5') // Get some suggested users
      ]);

      if (!postsResponse.ok || !usersResponse.ok) {
        throw new Error('Failed to fetch explore data');
      }

      const postsData = await postsResponse.json();
      const usersData = await usersResponse.json();

      setPosts(postsData.posts);
      setSuggestedUsers(usersData.users);
    } catch (error) {
      console.error('Error fetching explore data:', error);
      toast.error('Failed to load explore content');
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const response = await fetch(`/api/explore/users?query=${encodeURIComponent(searchQuery)}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.users);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to follow user');
      }

      toast.success('User followed successfully');
      
      // Update the user in suggested users or search results
      setSuggestedUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, followersCount: user.followersCount + 1 }
            : user
        )
      );
      
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, followersCount: user.followersCount + 1 }
            : user
        )
      );
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="space-y-6">
            {/* Search skeleton */}
            <div className="relative">
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            
            {/* Suggested users skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse mx-auto mb-3" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Explore</h1>
            <p className="text-muted-foreground">Discover new people and content</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Search Results</h2>
              {isSearching ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <UserCard key={user.id} user={user} onFollow={handleFollow} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>
          )}

          {/* Suggested Users */}
          {!searchQuery && suggestedUsers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Suggested for you</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {suggestedUsers.map((user) => (
                  <Card key={user.id} className="text-center">
                    <CardContent className="p-4">
                      <Avatar className="w-16 h-16 mx-auto mb-3">
                        <AvatarImage src={user.profileImage} />
                        <AvatarFallback>
                          {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-center gap-1">
                          <p className="font-semibold text-sm">{user.username}</p>
                          {user.isVerified && (
                            <Badge variant="secondary" className="h-4 px-1 text-xs">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.followersCount} followers
                        </p>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleFollow(user.id)}
                      >
                        Follow
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Explore Posts Grid */}
          {!searchQuery && posts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Explore Posts</h2>
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {posts.map((post) => (
                  <div key={post.id} className="aspect-square relative group cursor-pointer">
                    <img
                      src={post.mediaUrls[0]}
                      alt={`Post by ${post.user.username}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <Heart className="h-5 w-5 fill-current" />
                          <span className="font-semibold">{post.likesCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-5 w-5 fill-current" />
                          <span className="font-semibold">{post.commentsCount}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Multi-image indicator */}
                    {post.mediaUrls.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        1/{post.mediaUrls.length}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

function UserCard({ user, onFollow }: { user: User; onFollow: (userId: string) => void }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.profileImage} />
          <AvatarFallback>
            {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-1">
            <p className="font-semibold text-sm">{user.username}</p>
            {user.isVerified && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                ✓
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{user.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {user.followersCount} followers
          </p>
        </div>
      </div>
      <Button size="sm" onClick={() => onFollow(user.id)}>
        Follow
      </Button>
    </div>
  );
}