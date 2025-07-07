"use client";

import { useEffect, useState } from "react";
import { Post, Story } from "@/types/api";
import { toast } from "sonner";
import PostCard from "./PostCard";
import StoriesSection from "./StoriesSection";

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch posts and stories concurrently
      const [postsResponse, storiesResponse] = await Promise.all([
        fetch('/api/posts?page=1&limit=10'),
        fetch('/api/stories')
      ]);

      if (!postsResponse.ok || !storiesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const postsData = await postsResponse.json();
      const storiesData = await storiesResponse.json();

      setPosts(postsData.posts);
      setStories(storiesData.stories);
      setHasMore(postsData.pagination.page < postsData.pagination.totalPages);
      setPage(2);
    } catch (error) {
      console.error('Error fetching feed data:', error);
      toast.error('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!hasMore || isLoading) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/posts?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch more posts');
      }

      const data = await response.json();
      setPosts(prev => [...prev, ...data.posts]);
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more posts:', error);
      toast.error('Failed to load more posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const data = await response.json();

      // Update the post in the local state
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, isLiked: !post.isLiked, likesCount: data.likesCount }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleComment = (postId: string) => {
    // For now, just scroll to comments or open comment modal
    // This will be expanded when we add comment functionality
    console.log('Comment on post:', postId);
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Stories skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-0">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Posts skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg bg-white shadow-sm">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="flex gap-4">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stories Section */}
      <StoriesSection stories={stories} />

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={loadMorePosts}
            disabled={isLoading}
            className="px-6 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more posts'}
          </button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>You're all caught up!</p>
        </div>
      )}
    </div>
  );
}