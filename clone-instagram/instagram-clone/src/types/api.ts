// API Types based on OpenAPI specification

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  caption?: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'carousel';
  location?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  duration?: number;
  expiresAt: string;
  viewsCount: number;
  isViewed: boolean;
  user: User;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likesCount: number;
  isLiked: boolean;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'post';
  mediaUrl?: string;
  isRead: boolean;
  sender: User;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'post';
  message: string;
  isRead: boolean;
  actionUserId?: string;
  actionUser?: User;
  relatedPostId?: string;
  relatedPost?: Post;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PostsResponse {
  posts: Post[];
  pagination: PaginationMeta;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: PaginationMeta;
}

export interface MessagesResponse {
  messages: Message[];
  pagination: PaginationMeta;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination?: PaginationMeta;
}

export interface UploadResponse {
  url: string;
  filename: string;
}

// Request types for forms
export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  profileImage?: string;
  isPrivate?: boolean;
}

export interface CreatePostRequest {
  caption?: string;
  files: File[];
  location?: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface SendMessageRequest {
  content: string;
  messageType?: 'text' | 'image' | 'video' | 'post';
  mediaUrl?: string;
}

export interface CreateStoryRequest {
  file: File;
  duration?: number;
}