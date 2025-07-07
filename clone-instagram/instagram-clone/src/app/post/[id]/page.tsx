"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Post, Comment } from '@/types/api';

// Mock post data - in a real app this would come from an API
const mockPost = {
  id: '1',
  user: {
    username: 'barry.braun36',
    displayName: 'Barry Braun',
    profileImage: 'https://i.pravatar.cc/150?img=5',
    verified: false,
  },
  images: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=800&fit=crop',
  ],
  location: 'Uptonbury, Belarus',
  caption: 'Varietas sum vociferor accusator thymbra vito tantillus verecundia corroboro velit. Uredo sortitus sperno pauper caecus attonbitus ter deduco.',
  likes: 4339,
  isLiked: false,
  createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  comments: [
    {
      id: '1',
      user: {
        username: 'adventure_seeker',
        displayName: 'Adventure Seeker',
        profileImage: 'https://i.pravatar.cc/150?img=1',
      },
      text: 'Absolutely stunning! The colors in this shot are incredible 📸✨',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      likes: 12,
      isLiked: false,
    },
    {
      id: '2',
      user: {
        username: 'nature_lover99',
        displayName: 'Nature Lover',
        profileImage: 'https://i.pravatar.cc/150?img=2',
      },
      text: 'This takes my breath away! Where exactly was this taken? 🌄',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      likes: 8,
      isLiked: true,
    },
    {
      id: '3',
      user: {
        username: 'photogeek',
        displayName: 'Photo Geek',
        profileImage: 'https://i.pravatar.cc/150?img=3',
      },
      text: 'The composition and lighting are perfect! What camera settings did you use?',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 15,
      isLiked: false,
    },
    {
      id: '4',
      user: {
        username: 'wanderlust_soul',
        displayName: 'Wanderlust Soul',
        profileImage: 'https://i.pravatar.cc/150?img=4',
      },
      text: 'Adding this to my travel bucket list! Thanks for sharing 🗺️',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      likes: 6,
      isLiked: false,
    },
    {
      id: '5',
      user: {
        username: 'barry.braun36',
        displayName: 'Barry Braun',
        profileImage: 'https://i.pravatar.cc/150?img=5',
      },
      text: 'Thank you all for the kind words! This was taken during golden hour with a Canon EOS R5. The location is truly magical ✨',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      likes: 23,
      isLiked: false,
    }
  ]
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState(mockPost);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [loading, setLoading] = useState(false);

  // Fetch comments when component mounts
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/posts/${params.id}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        // Keep using mock comments as fallback
      }
    };

    fetchComments();
  }, [params.id]);

  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const toggleCommentLike = (commentId: string) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
          }
        : comment
    ));
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const newCommentData = await response.json();
      
      // Add the new comment to the beginning of the comments list
      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
      toast.success('Comment posted successfully!');
      
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === post.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? post.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-4 p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-1"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <span className="font-semibold">Post</span>
        </div>

        <div className="lg:flex lg:h-screen lg:max-h-[calc(100vh-4rem)]">
          {/* Image section */}
          <div className="lg:flex-1 lg:bg-black lg:flex lg:items-center lg:justify-center relative">
            <div className="relative w-full aspect-square lg:aspect-auto lg:h-full lg:max-w-2xl">
              <Image
                src={post.images[currentImageIndex]}
                alt="Post image"
                fill
                className="object-cover lg:object-contain"
                priority
              />

              {/* Image navigation */}
              {post.images.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {currentImageIndex < post.images.length - 1 && (
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Image indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                    {post.images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content section */}
          <div className="lg:w-96 lg:border-l flex flex-col">
            {/* Post header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.user.profileImage} />
                  <AvatarFallback>{post.user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">{post.user.username}</span>
                    {post.user.verified && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {post.location && (
                    <p className="text-xs text-muted-foreground">{post.location}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="p-1">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>

            {/* Comments section */}
            <div className="flex-1 overflow-y-auto">
              {/* Original post caption */}
              <div className="p-4 border-b">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={post.user.profileImage} />
                    <AvatarFallback>{post.user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{post.user.username}</span>{' '}
                      {post.caption}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comments list */}
              <div className="space-y-4 p-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.user.profileImage} />
                      <AvatarFallback>{comment.user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{comment.user.username}</span>{' '}
                        {comment.text}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                        </p>
                        {comment.likes > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {comment.likes} {comment.likes === 1 ? 'like' : 'likes'}
                          </p>
                        )}
                        <button className="text-xs text-muted-foreground hover:text-foreground">
                          Reply
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCommentLike(comment.id)}
                      className="flex-shrink-0 p-1"
                    >
                      <Heart
                        className={`w-3 h-3 ${
                          comment.isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions and comment input */}
            <div className="border-t">
              {/* Action buttons */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <button onClick={toggleLike}>
                    <Heart
                      className={`w-6 h-6 ${
                        isLiked ? 'fill-red-500 text-red-500' : 'text-foreground'
                      }`}
                    />
                  </button>
                  <button>
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <button>
                    <Send className="w-6 h-6" />
                  </button>
                </div>
                <button>
                  <Bookmark className="w-6 h-6" />
                </button>
              </div>

              {/* Likes count */}
              <div className="px-4 pb-2">
                <p className="text-sm font-semibold">
                  {likesCount.toLocaleString()} likes
                </p>
              </div>

              {/* Comment input */}
              <form onSubmit={handleSubmitComment} className="flex items-center gap-3 p-4 border-t">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src="https://i.pravatar.cc/150?img=10" />
                  <AvatarFallback>CU</AvatarFallback>
                </Avatar>
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 border-none bg-transparent px-0 focus-visible:ring-0"
                />
                {newComment.trim() && (
                  <Button 
                    type="submit" 
                    variant="ghost" 
                    size="sm" 
                    disabled={loading}
                    className="text-blue-500 hover:text-blue-600 font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Posting...' : 'Post'}
                  </Button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}