"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Post } from "@/types/api";
import { toast } from "sonner";
import { Search, Heart, MessageCircle, X, History } from "lucide-react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<User[]>([]);

  useEffect(() => {
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('search-history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    
    // Load recent searches
    fetchRecentSearches();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    } else {
      setUserResults([]);
      setPostResults([]);
    }
  }, [searchQuery]);

  const fetchRecentSearches = async () => {
    try {
      const response = await fetch('/api/explore/users?query=&limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentSearches(data.users.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching recent searches:', error);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      
      const [usersResponse, postsResponse] = await Promise.all([
        fetch(`/api/search/users?query=${encodeURIComponent(searchQuery)}&limit=20`),
        fetch(`/api/search?query=${encodeURIComponent(searchQuery)}&limit=20`)
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUserResults(usersData.users);
      }

      if (postsResponse.ok) {
        const searchData = await postsResponse.json();
        setPostResults(searchData.posts || []);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Add to search history
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('search-history', JSON.stringify(newHistory));
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search-history');
  };

  const removeFromHistory = (query: string) => {
    const newHistory = searchHistory.filter(item => item !== query);
    setSearchHistory(newHistory);
    localStorage.setItem('search-history', JSON.stringify(newHistory));
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
      
      // Update the user in results
      setUserResults(prev => 
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

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-6">
          {/* Search Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Search</h1>
            <p className="text-muted-foreground">Find people and content</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users, posts, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Content */}
          {!searchQuery ? (
            /* No Search Query - Show Recent and History */
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Recent</h2>
                  <div className="space-y-2">
                    {recentSearches.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer"
                        onClick={() => handleSearch(user.username)}
                      >
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Recent searches</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearchHistory}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {searchHistory.map((query, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 hover:bg-muted rounded-lg"
                      >
                        <button
                          onClick={() => handleSearch(query)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <History className="h-4 w-4 text-muted-foreground" />
                          <span>{query}</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromHistory(query)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Search Results */
            <div className="space-y-4">
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Searching...</p>
                </div>
              ) : (
                <Tabs defaultValue="users" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users">
                      Users ({userResults.length})
                    </TabsTrigger>
                    <TabsTrigger value="posts">
                      Posts ({postResults.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="users" className="mt-4">
                    {userResults.length > 0 ? (
                      <div className="space-y-2">
                        {userResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
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
                            <Button size="sm" onClick={() => handleFollow(user.id)}>
                              Follow
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No users found for "{searchQuery}"</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="posts" className="mt-4">
                    {postResults.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1 md:gap-4">
                        {postResults.map((post) => (
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
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No posts found for "{searchQuery}"</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
}