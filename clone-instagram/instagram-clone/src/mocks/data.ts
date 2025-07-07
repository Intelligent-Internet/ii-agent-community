import { faker } from '@faker-js/faker';
import { User, Post, Story, Comment, Message, Conversation, Notification } from '@/types/api';

// Generate mock users
export const generateMockUser = (id?: string): User => ({
  id: id || faker.string.uuid(),
  username: faker.internet.username().toLowerCase(),
  email: faker.internet.email(),
  displayName: faker.person.fullName(),
  bio: faker.lorem.sentences(2),
  profileImage: faker.image.avatar(),
  isVerified: faker.datatype.boolean(0.1), // 10% chance of being verified
  followersCount: faker.number.int({ min: 0, max: 10000 }),
  followingCount: faker.number.int({ min: 0, max: 1000 }),
  postsCount: faker.number.int({ min: 0, max: 500 }),
  isPrivate: faker.datatype.boolean(0.2), // 20% chance of private account
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
});

// Generate mock post
export const generateMockPost = (user?: User): Post => {
  const postUser = user || generateMockUser();
  const mediaCount = faker.number.int({ min: 1, max: 5 });
  const mediaUrls = Array.from({ length: mediaCount }, () => 
    faker.image.url({ width: 1080, height: 1080 })
  );
  
  return {
    id: faker.string.uuid(),
    userId: postUser.id,
    caption: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
    mediaUrls,
    mediaType: mediaCount > 1 ? 'carousel' : 'image',
    location: faker.location.city() + ', ' + faker.location.country(),
    likesCount: faker.number.int({ min: 0, max: 5000 }),
    commentsCount: faker.number.int({ min: 0, max: 200 }),
    isLiked: faker.datatype.boolean(0.3),
    user: postUser,
    createdAt: faker.date.recent({ days: 7 }).toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  };
};

// Generate mock story
export const generateMockStory = (user?: User): Story => {
  const storyUser = user || generateMockUser();
  return {
    id: faker.string.uuid(),
    userId: storyUser.id,
    mediaUrl: faker.image.url({ width: 1080, height: 1920 }),
    mediaType: faker.helpers.arrayElement(['image', 'video']),
    duration: faker.number.int({ min: 5, max: 30 }),
    expiresAt: faker.date.future({ days: 1 }).toISOString(),
    viewsCount: faker.number.int({ min: 0, max: 1000 }),
    isViewed: faker.datatype.boolean(0.4),
    user: storyUser,
    createdAt: faker.date.recent({ hours: 12 }).toISOString(),
  };
};

// Generate mock comment
export const generateMockComment = (postId: string, user?: User): Comment => {
  const commentUser = user || generateMockUser();
  return {
    id: faker.string.uuid(),
    postId,
    userId: commentUser.id,
    content: faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })),
    likesCount: faker.number.int({ min: 0, max: 100 }),
    isLiked: faker.datatype.boolean(0.2),
    user: commentUser,
    createdAt: faker.date.recent({ days: 1 }).toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  };
};

// Generate mock message
export const generateMockMessage = (conversationId: string, sender: User): Message => ({
  id: faker.string.uuid(),
  conversationId,
  senderId: sender.id,
  content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
  messageType: faker.helpers.arrayElement(['text', 'image', 'video']),
  mediaUrl: faker.datatype.boolean(0.2) ? faker.image.url() : undefined,
  isRead: faker.datatype.boolean(0.7),
  sender,
  createdAt: faker.date.recent({ days: 1 }).toISOString(),
});

// Generate mock conversation
export const generateMockConversation = (currentUser: User): Conversation => {
  const otherUser = generateMockUser();
  const participants = [currentUser, otherUser];
  const lastMessage = generateMockMessage(faker.string.uuid(), otherUser);
  
  return {
    id: faker.string.uuid(),
    participants,
    lastMessage,
    unreadCount: faker.number.int({ min: 0, max: 5 }),
    updatedAt: lastMessage.createdAt,
  };
};

// Generate mock notification
export const generateMockNotification = (userId: string): Notification => {
  const actionUser = generateMockUser();
  const type = faker.helpers.arrayElement(['like', 'comment', 'follow', 'mention', 'post']);
  
  let message: string;
  switch (type) {
    case 'like':
      message = `${actionUser.displayName} liked your post`;
      break;
    case 'comment':
      message = `${actionUser.displayName} commented on your post`;
      break;
    case 'follow':
      message = `${actionUser.displayName} started following you`;
      break;
    case 'mention':
      message = `${actionUser.displayName} mentioned you in a comment`;
      break;
    case 'post':
      message = `${actionUser.displayName} shared a new post`;
      break;
    default:
      message = `New notification from ${actionUser.displayName}`;
  }
  
  return {
    id: faker.string.uuid(),
    userId,
    type,
    message,
    isRead: faker.datatype.boolean(0.3),
    actionUserId: actionUser.id,
    actionUser,
    relatedPostId: ['like', 'comment', 'mention'].includes(type) ? faker.string.uuid() : undefined,
    createdAt: faker.date.recent({ days: 7 }).toISOString(),
  };
};

// Create mock database
export class MockDatabase {
  private users: User[] = [];
  private posts: Post[] = [];
  private stories: Story[] = [];
  private comments: Map<string, Comment[]> = new Map(); // postId -> comments
  private conversations: Conversation[] = [];
  private notifications: Notification[] = [];
  private currentUserId: string | null = null;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Generate current user
    const currentUser = generateMockUser('current-user');
    currentUser.username = 'current_user';
    currentUser.email = 'user@example.com';
    currentUser.displayName = 'Current User';
    this.users.push(currentUser);
    this.currentUserId = currentUser.id;

    // Generate other users
    for (let i = 0; i < 20; i++) {
      this.users.push(generateMockUser());
    }

    // Generate posts for various users
    for (let i = 0; i < 50; i++) {
      const randomUser = faker.helpers.arrayElement(this.users);
      const post = generateMockPost(randomUser);
      this.posts.push(post);

      // Generate comments for each post
      const commentsCount = faker.number.int({ min: 0, max: 10 });
      const postComments: Comment[] = [];
      for (let j = 0; j < commentsCount; j++) {
        const commentUser = faker.helpers.arrayElement(this.users);
        postComments.push(generateMockComment(post.id, commentUser));
      }
      this.comments.set(post.id, postComments);
    }

    // Generate stories
    for (let i = 0; i < 15; i++) {
      const randomUser = faker.helpers.arrayElement(this.users);
      this.stories.push(generateMockStory(randomUser));
    }

    // Generate conversations for current user
    for (let i = 0; i < 10; i++) {
      this.conversations.push(generateMockConversation(currentUser));
    }

    // Generate notifications for current user
    for (let i = 0; i < 20; i++) {
      this.notifications.push(generateMockNotification(currentUser.id));
    }

    // Sort posts by creation date (newest first)
    this.posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Sort stories by creation date (newest first)
    this.stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // User methods
  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  getCurrentUser(): User | undefined {
    return this.currentUserId ? this.getUserById(this.currentUserId) : undefined;
  }

  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  updateUser(userId: string, updates: Partial<User>): User | undefined {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return undefined;
    }
    
    // Merge updates with existing user data
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.users[userIndex];
  }

  searchUsers(query: string, limit: number = 10): User[] {
    return this.users
      .filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  }

  searchPosts(query: string, limit: number = 10): Post[] {
    return this.posts
      .filter(post => 
        post.caption.toLowerCase().includes(query.toLowerCase()) ||
        post.location.toLowerCase().includes(query.toLowerCase()) ||
        post.user.username.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  }

  // Post methods
  getFeedPosts(page: number = 1, limit: number = 10): { posts: Post[], pagination: any } {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const posts = this.posts.slice(startIndex, endIndex);
    
    return {
      posts,
      pagination: {
        page,
        limit,
        total: this.posts.length,
        totalPages: Math.ceil(this.posts.length / limit),
      },
    };
  }

  getPostById(id: string): Post | undefined {
    return this.posts.find(post => post.id === id);
  }

  getUserPosts(userId: string, page: number = 1, limit: number = 12): { posts: Post[], pagination: any } {
    const userPosts = this.posts.filter(post => post.userId === userId);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const posts = userPosts.slice(startIndex, endIndex);
    
    return {
      posts,
      pagination: {
        page,
        limit,
        total: userPosts.length,
        totalPages: Math.ceil(userPosts.length / limit),
      },
    };
  }

  getExplorePosts(page: number = 1, limit: number = 20): { posts: Post[], pagination: any } {
    // For explore, we'll return a shuffled version of posts
    const shuffledPosts = [...this.posts].sort(() => Math.random() - 0.5);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const posts = shuffledPosts.slice(startIndex, endIndex);
    
    return {
      posts,
      pagination: {
        page,
        limit,
        total: this.posts.length,
        totalPages: Math.ceil(this.posts.length / limit),
      },
    };
  }

  addPost(post: Post): void {
    this.posts.unshift(post); // Add to beginning for newest first
    // Sort posts by creation date (newest first)
    this.posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Update user's posts count
    const user = this.getUserById(post.userId);
    if (user) {
      user.postsCount++;
    }
  }

  likePost(postId: string): void {
    const post = this.getPostById(postId);
    if (post) {
      post.isLiked = !post.isLiked;
      post.likesCount += post.isLiked ? 1 : -1;
    }
  }

  // Comment methods
  getPostComments(postId: string, page: number = 1, limit: number = 20): { comments: Comment[], pagination: any } {
    const comments = this.comments.get(postId) || [];
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedComments = comments.slice(startIndex, endIndex);
    
    return {
      comments: paginatedComments,
      pagination: {
        page,
        limit,
        total: comments.length,
        totalPages: Math.ceil(comments.length / limit),
      },
    };
  }

  addComment(postId: string, content: string): Comment {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    const comment = generateMockComment(postId, currentUser);
    comment.content = content;
    
    const postComments = this.comments.get(postId) || [];
    postComments.unshift(comment); // Add to beginning
    this.comments.set(postId, postComments);
    
    // Update post comments count
    const post = this.getPostById(postId);
    if (post) {
      post.commentsCount++;
    }
    
    return comment;
  }

  // Story methods
  getStoriesFeed(): Story[] {
    return this.stories;
  }

  // Conversation methods
  getConversations(): Conversation[] {
    return this.conversations;
  }

  getConversationMessages(conversationId: string, page: number = 1, limit: number = 50): { messages: Message[], pagination: any } {
    // Generate some mock messages for the conversation
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) return { messages: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    
    const messages: Message[] = [];
    for (let i = 0; i < 30; i++) {
      const sender = faker.helpers.arrayElement(conversation.participants);
      messages.push(generateMockMessage(conversationId, sender));
    }
    
    // Sort by creation date (oldest first for chat)
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMessages = messages.slice(startIndex, endIndex);
    
    return {
      messages: paginatedMessages,
      pagination: {
        page,
        limit,
        total: messages.length,
        totalPages: Math.ceil(messages.length / limit),
      },
    };
  }

  // Notification methods
  getNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false): { notifications: Notification[], unreadCount: number, pagination: any } {
    let notifications = this.notifications;
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }
    
    const unreadCount = this.notifications.filter(n => !n.isRead).length;
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = notifications.slice(startIndex, endIndex);
    
    return {
      notifications: paginatedNotifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total: notifications.length,
        totalPages: Math.ceil(notifications.length / limit),
      },
    };
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }
}

export const mockDb = new MockDatabase();