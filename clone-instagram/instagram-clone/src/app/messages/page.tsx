"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation, Message } from "@/types/api";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Send, Search, Edit, MoreHorizontal, Phone, Video } from "lucide-react";

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversation');
  const { user } = useAuthStore();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations);
      
      // If no conversation is selected and there are conversations, select the first one
      if (!conversationId && data.conversations.length > 0) {
        router.push(`/messages?conversation=${data.conversations[0].id}`);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const [messagesResponse, conversationResponse] = await Promise.all([
        fetch(`/api/conversations/${convId}/messages?limit=50`),
        fetch('/api/conversations')
      ]);
      
      if (!messagesResponse.ok) {
        throw new Error('Failed to fetch messages');
      }

      const messagesData = await messagesResponse.json();
      setMessages(messagesData.messages);
      
      if (conversationResponse.ok) {
        const conversationsData = await conversationResponse.json();
        const conversation = conversationsData.conversations.find((c: Conversation) => c.id === convId);
        setCurrentConversation(conversation || null);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || isSending) return;

    try {
      setIsSending(true);
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const message = await response.json();
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      
      // Update conversation last message
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="h-[600px] flex">
            {/* Sidebar skeleton */}
            <div className="w-80 border-r p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat area skeleton */}
            <div className="flex-1 p-4">
              <div className="animate-pulse text-center">Loading...</div>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="h-[600px] flex border rounded-lg overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-80 border-r flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{user?.username}</h2>
                <Button variant="ghost" size="sm">
                  <Edit className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search" className="pl-10" />
              </div>
            </div>
            
            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const otherUser = conversation.participants.find(p => p.id !== user?.id);
                    const isActive = conversationId === conversation.id;
                    
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => router.push(`/messages?conversation=${conversation.id}`)}
                        className={`w-full p-3 text-left hover:bg-muted rounded-lg transition-colors ${
                          isActive ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={otherUser?.profileImage} />
                              <AvatarFallback>
                                {otherUser?.displayName?.charAt(0) || otherUser?.username?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {conversation.unreadCount > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0"
                              >
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{otherUser?.username}</p>
                            {conversation.lastMessage && (
                              <p className="text-xs text-muted-foreground truncate">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                            {conversation.updatedAt && (
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const otherUser = currentConversation.participants.find(p => p.id !== user?.id);
                      return (
                        <>
                          <Avatar>
                            <AvatarImage src={otherUser?.profileImage} />
                            <AvatarFallback>
                              {otherUser?.displayName?.charAt(0) || otherUser?.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{otherUser?.username}</p>
                            <p className="text-xs text-muted-foreground">Active now</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.senderId === user?.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-blue-500 text-white'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-muted-foreground'}`}>
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isSending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* No Conversation Selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                    <Send className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-light mb-2">Your Messages</h3>
                  <p className="text-muted-foreground mb-4">
                    Send private photos and messages to a friend or group
                  </p>
                  <Button>Send Message</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}