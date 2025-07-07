import { http, HttpResponse } from 'msw';
import { mockDb } from './data';
import { AuthResponse, ApiError } from '@/types/api';
import { generateUUID } from '@/lib/uuid';

const API_BASE = '/api';

export const handlers = [
  // Authentication endpoints
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as any;
    const { username, email, password, displayName } = body;

    // Check if user already exists
    if (mockDb.searchUsers(username).length > 0) {
      return HttpResponse.json(
        { error: 'Conflict', message: 'Username already exists' } as ApiError,
        { status: 409 }
      );
    }

    const user = {
      id: generateUUID(),
      username,
      email,
      displayName,
      bio: '',
      profileImage: '',
      isVerified: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const response: AuthResponse = {
      user,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as any;
    const { email, password } = body;

    // Mock authentication - accept demo credentials or any credentials for demo
    let user = mockDb.getCurrentUser();
    
    // If no current user is set or login with demo credentials, set the demo user
    if (!user || email === 'user@example.com') {
      const demoUser = mockDb.getUserById('current-user');
      if (demoUser) {
        mockDb.setCurrentUser('current-user');
        user = demoUser;
      } else {
        return HttpResponse.json(
          { error: 'Unauthorized', message: 'Invalid credentials' } as ApiError,
          { status: 401 }
        );
      }
    }

    const response: AuthResponse = {
      user,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    return HttpResponse.json(response);
  }),

  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json({
      accessToken: 'new-mock-access-token',
    });
  }),

  // User endpoints
  http.get(`${API_BASE}/users/profile`, () => {
    const user = mockDb.getCurrentUser();
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' } as ApiError,
        { status: 401 }
      );
    }
    return HttpResponse.json(user);
  }),

  http.put(`${API_BASE}/users/profile`, async ({ request }) => {
    const user = mockDb.getCurrentUser();
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' } as ApiError,
        { status: 401 }
      );
    }

    const updates = await request.json() as any;
    const updatedUser = mockDb.updateUser(user.id, updates);
    
    if (!updatedUser) {
      return HttpResponse.json(
        { error: 'Internal Server Error', message: 'Failed to update user profile' } as ApiError,
        { status: 500 }
      );
    }
    
    return HttpResponse.json(updatedUser);
  }),

  http.get(`${API_BASE}/users/:userId`, ({ params }) => {
    const user = mockDb.getUserById(params.userId as string);
    if (!user) {
      return HttpResponse.json(
        { error: 'Not Found', message: 'User not found' } as ApiError,
        { status: 404 }
      );
    }
    return HttpResponse.json(user);
  }),

  http.post(`${API_BASE}/users/:userId/follow`, ({ params }) => {
    return HttpResponse.json({ message: `Following user ${params.userId}` });
  }),

  http.delete(`${API_BASE}/users/:userId/follow`, ({ params }) => {
    return HttpResponse.json({ message: `Unfollowed user ${params.userId}` });
  }),

  // User posts endpoint
  http.get(`${API_BASE}/users/:userId/posts`, ({ params, request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');

    const result = mockDb.getUserPosts(params.userId as string, page, limit);
    return HttpResponse.json(result);
  }),

  // Post endpoints
  http.get(`${API_BASE}/posts`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const result = mockDb.getFeedPosts(page, limit);
    return HttpResponse.json(result);
  }),

  http.post(`${API_BASE}/posts`, async ({ request }) => {
    // Mock post creation with real file handling
    const formData = await request.formData();
    const caption = formData.get('caption') as string;
    const location = formData.get('location') as string;
    const files = formData.getAll('files') as File[];
    
    const user = mockDb.getCurrentUser();
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' } as ApiError,
        { status: 401 }
      );
    }

    // Process uploaded files to create viewable URLs
    let mediaUrls: string[] = [];
    let mediaType: 'image' | 'video' | 'carousel' = 'image';

    if (files && files.length > 0) {
      // Convert files to blob URLs for display
      mediaUrls = files.map(file => {
        return URL.createObjectURL(file);
      });
      
      // Determine media type
      if (files.length > 1) {
        mediaType = 'carousel';
      } else if (files[0].type.startsWith('video/')) {
        mediaType = 'video';
      } else {
        mediaType = 'image';
      }
    } else {
      // Text-only post - use a placeholder or no media
      mediaUrls = ['https://picsum.photos/1080/1080']; // Fallback for text posts
    }

    const newPost = {
      id: generateUUID(),
      userId: user.id,
      caption: caption || '',
      mediaUrls,
      mediaType,
      location: location || '',
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save the post to the mock database
    mockDb.addPost(newPost);

    return HttpResponse.json(newPost, { status: 201 });
  }),

  http.get(`${API_BASE}/posts/:postId`, ({ params }) => {
    const post = mockDb.getPostById(params.postId as string);
    if (!post) {
      return HttpResponse.json(
        { error: 'Not Found', message: 'Post not found' } as ApiError,
        { status: 404 }
      );
    }
    return HttpResponse.json(post);
  }),

  http.delete(`${API_BASE}/posts/:postId`, ({ params }) => {
    return HttpResponse.json({ message: 'Post deleted successfully' });
  }),

  http.post(`${API_BASE}/posts/:postId/like`, ({ params }) => {
    mockDb.likePost(params.postId as string);
    const post = mockDb.getPostById(params.postId as string);
    return HttpResponse.json({
      message: post?.isLiked ? 'Post liked' : 'Post unliked',
      likesCount: post?.likesCount || 0,
    });
  }),

  http.delete(`${API_BASE}/posts/:postId/like`, ({ params }) => {
    mockDb.likePost(params.postId as string);
    const post = mockDb.getPostById(params.postId as string);
    return HttpResponse.json({
      message: 'Post unliked',
      likesCount: post?.likesCount || 0,
    });
  }),

  // Comment endpoints
  http.get(`${API_BASE}/posts/:postId/comments`, ({ request, params }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = mockDb.getPostComments(params.postId as string, page, limit);
    return HttpResponse.json(result);
  }),

  http.post(`${API_BASE}/posts/:postId/comments`, async ({ request, params }) => {
    const body = await request.json() as any;
    const { content } = body;

    try {
      const comment = mockDb.addComment(params.postId as string, content);
      return HttpResponse.json(comment, { status: 201 });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' } as ApiError,
        { status: 401 }
      );
    }
  }),

  // Stories endpoints
  http.get(`${API_BASE}/stories`, () => {
    const stories = mockDb.getStoriesFeed();
    return HttpResponse.json({ stories });
  }),

  http.post(`${API_BASE}/stories`, async ({ request }) => {
    const user = mockDb.getCurrentUser();
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' } as ApiError,
        { status: 401 }
      );
    }

    const newStory = {
      id: generateUUID(),
      userId: user.id,
      mediaUrl: 'https://picsum.photos/1080/1920', // Mock uploaded media
      mediaType: 'image' as const,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      viewsCount: 0,
      isViewed: false,
      user,
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json(newStory, { status: 201 });
  }),

  // Messages endpoints
  http.get(`${API_BASE}/conversations`, () => {
    const conversations = mockDb.getConversations();
    return HttpResponse.json({ conversations });
  }),

  http.get(`${API_BASE}/conversations/:conversationId/messages`, ({ request, params }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const result = mockDb.getConversationMessages(params.conversationId as string, page, limit);
    return HttpResponse.json(result);
  }),

  http.post(`${API_BASE}/conversations/:conversationId/messages`, async ({ request, params }) => {
    const body = await request.json() as any;
    const { content, messageType = 'text' } = body;

    const user = mockDb.getCurrentUser();
    if (!user) {
      return HttpResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' } as ApiError,
        { status: 401 }
      );
    }

    const newMessage = {
      id: generateUUID(),
      conversationId: params.conversationId as string,
      senderId: user.id,
      content,
      messageType,
      isRead: false,
      sender: user,
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json(newMessage, { status: 201 });
  }),

  // Explore endpoints
  http.get(`${API_BASE}/explore/posts`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = mockDb.getExplorePosts(page, limit);
    return HttpResponse.json(result);
  }),

  http.get(`${API_BASE}/explore/users`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const users = mockDb.searchUsers(query, limit);
    return HttpResponse.json({ users });
  }),

  // Search endpoints
  http.get(`${API_BASE}/search/users`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const users = mockDb.searchUsers(query, limit);
    return HttpResponse.json({ users });
  }),

  http.get(`${API_BASE}/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const users = mockDb.searchUsers(query, limit);
    const posts = mockDb.searchPosts(query, limit);
    
    return HttpResponse.json({ 
      users,
      posts,
      query 
    });
  }),

  // Notifications endpoints
  http.get(`${API_BASE}/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

    const result = mockDb.getNotifications(page, limit, unreadOnly);
    return HttpResponse.json(result);
  }),

  http.put(`${API_BASE}/notifications/:notificationId/read`, ({ params }) => {
    mockDb.markNotificationAsRead(params.notificationId as string);
    return HttpResponse.json({ message: 'Notification marked as read' });
  }),

  // File upload endpoint
  http.post(`${API_BASE}/upload`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return HttpResponse.json(
        { error: 'Bad Request', message: 'No file provided' } as ApiError,
        { status: 400 }
      );
    }

    // Mock file upload response
    const mockUrl = `https://picsum.photos/1080/1080?random=${Date.now()}`;
    return HttpResponse.json({
      url: mockUrl,
      filename: file.name,
    });
  }),
];