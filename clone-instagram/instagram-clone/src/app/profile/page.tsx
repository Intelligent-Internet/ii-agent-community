"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth";
import { Settings, Grid3X3, Bookmark, Heart, MessageCircle } from "lucide-react";
import { Post } from "@/types/api";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  // Add a refresh mechanism for when the user navigates back to profile
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        fetchUserData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch both updated user profile and posts in parallel
      const [userResponse, postsResponse] = await Promise.all([
        fetch('/api/users/profile'),
        fetch(`/api/users/${user?.id}/posts?limit=50`)
      ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        updateUser(userData); // Update the auth store with latest user data
      }

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData.posts || []);
      } else {
        console.error('Failed to fetch user posts');
        toast.error('Failed to load posts');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // AuthGuard will handle redirect
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Image */}
            <div className="flex justify-center md:justify-start">
              <Avatar className="h-32 w-32 md:h-40 md:w-40">
                <AvatarImage src={user.profileImage} />
                <AvatarFallback className="text-4xl">
                  {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <h1 className="text-2xl font-light">{user.username}</h1>
                <div className="flex gap-2 justify-center md:justify-start">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/profile/edit')}
                  >
                    Edit profile
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-8 justify-center md:justify-start">
                <div className="text-center">
                  <span className="font-semibold text-lg">{user.postsCount}</span>
                  <p className="text-sm text-muted-foreground">posts</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-lg">{user.followersCount}</span>
                  <p className="text-sm text-muted-foreground">followers</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-lg">{user.followingCount}</span>
                  <p className="text-sm text-muted-foreground">following</p>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <p className="font-semibold">{user.displayName}</p>
                {user.bio && <p className="text-sm">{user.bio}</p>}
                {user.isVerified && (
                  <Badge variant="secondary" className="w-fit">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                POSTS
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                SAVED
              </TabsTrigger>
              <TabsTrigger value="tagged" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                TAGGED
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              {loading ? (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded" />
                  ))}
                </div>
              ) : posts.length > 0 ? (
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="border-2 border-gray-300 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Grid3X3 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-light mb-2">No Posts Yet</h3>
                  <p className="text-muted-foreground">When you share photos and videos, they'll appear on your profile.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-6">
              <div className="text-center py-12">
                <div className="border-2 border-gray-300 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Bookmark className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-light mb-2">No Saved Posts</h3>
                <p className="text-muted-foreground">Save posts you want to see again by tapping the bookmark icon.</p>
              </div>
            </TabsContent>

            <TabsContent value="tagged" className="mt-6">
              <div className="text-center py-12">
                <div className="border-2 border-gray-300 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-light mb-2">No Tagged Posts</h3>
                <p className="text-muted-foreground">When people tag you in photos and videos, they'll appear here.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}