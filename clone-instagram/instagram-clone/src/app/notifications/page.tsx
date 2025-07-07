"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notification } from "@/types/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, UserPlus, AtSign, Camera } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/notifications?unreadOnly=${filter === 'unread'}&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'mention':
        return <AtSign className="h-5 w-5 text-purple-500" />;
      case 'post':
        return <Camera className="h-5 w-5 text-orange-500" />;
      default:
        return <Heart className="h-5 w-5 text-gray-500" />;
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
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Notifications</h1>
            </div>
            
            {/* Loading skeleton */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
                <div className="w-12 h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="mb-4">
                {unreadCount} unread
              </Badge>
            )}
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <NotificationsList 
                notifications={notifications} 
                onMarkAsRead={markAsRead}
                onFollow={handleFollow}
              />
            </TabsContent>

            <TabsContent value="unread" className="mt-6">
              <NotificationsList 
                notifications={notifications.filter(n => !n.isRead)} 
                onMarkAsRead={markAsRead}
                onFollow={handleFollow}
              />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onFollow: (userId: string) => void;
}

function NotificationsList({ notifications, onMarkAsRead, onFollow }: NotificationsListProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'mention':
        return <AtSign className="h-5 w-5 text-purple-500" />;
      case 'post':
        return <Camera className="h-5 w-5 text-orange-500" />;
      default:
        return <Heart className="h-5 w-5 text-gray-500" />;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center border-2 border-gray-300 rounded-full">
          <Heart className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-light mb-2">No notifications yet</h3>
        <p className="text-muted-foreground">When someone likes, comments or follows you, you'll see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
            !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200' : 'hover:bg-muted'
          }`}
        >
          {/* User Avatar */}
          <div className="relative">
            <Avatar>
              <AvatarImage src={notification.actionUser?.profileImage} />
              <AvatarFallback>
                {notification.actionUser?.displayName?.charAt(0) || 
                 notification.actionUser?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* Notification type icon */}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-background">
              {getNotificationIcon(notification.type)}
            </div>
          </div>

          {/* Notification content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold">{notification.actionUser?.username}</span>{" "}
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
          </div>

          {/* Post thumbnail (if applicable) */}
          {notification.relatedPost && (
            <div className="w-12 h-12 flex-shrink-0">
              <img
                src={notification.relatedPost.mediaUrls[0]}
                alt="Post"
                className="w-full h-full object-cover rounded"
              />
            </div>
          )}

          {/* Action button */}
          <div className="flex items-center gap-2">
            {notification.type === 'follow' && notification.actionUser && (
              <Button
                size="sm"
                onClick={() => onFollow(notification.actionUser!.id)}
              >
                Follow
              </Button>
            )}
            
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                className="text-blue-600 hover:text-blue-800"
              >
                Mark as read
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}