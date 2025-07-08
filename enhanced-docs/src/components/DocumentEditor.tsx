'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Users, Loader2, Sparkles, Share2, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { RichTextEditor } from './RichTextEditor';
import { AIGenerationModal } from './AIGenerationModal';
import { Document } from '@/lib/documents';
import { useSocket } from '@/contexts/SocketContext';
import { getUserColor, getDarkerColor, getLighterColor } from '@/utils/userColors';
import { getUserId } from '@/utils/userUtils';

interface DocumentEditorProps {
  document: Document;
  onBack: () => void;
  onDocumentUpdate?: (document: Document) => void;
}

interface UserCursor {
  userId: string;
  position: number;
  selection?: {
    from: number;
    to: number;
  };
  color: string;
}

export function DocumentEditor({ document, onBack, onDocumentUpdate }: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [usersList, setUsersList] = useState<string[]>([]);
  const [userCursors, setUserCursors] = useState<UserCursor[]>([]);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isReceivingUpdate, setIsReceivingUpdate] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, 
    joinDocument, 
    leaveDocument, 
    sendDocumentUpdate,
    sendCursorUpdate,
    onDocumentUpdate: onSocketDocumentUpdate,
    onUserCount,
    onCursorUpdate
  } = useSocket();

  // Initialize real-time collaboration
  useEffect(() => {
    if (isConnected) {
      const userId = getUserId();

      // Join the document room
      joinDocument(document.id, userId);

      // Listen for document updates from other users
      const unsubscribeUpdate = onSocketDocumentUpdate((data: any) => {
        setIsReceivingUpdate(true);
        if (data.content !== content) {
          setContent(data.content);
        }
        if (data.title && data.title !== title) {
          setTitle(data.title);
        }
        setTimeout(() => setIsReceivingUpdate(false), 500);
      });

      // Listen for user count updates
      const unsubscribeUserCount = onUserCount((data: any) => {
        setConnectedUsers(data.count);
        if (data.users) {
          setUsersList(data.users);
        }
      });

      // Listen for cursor updates from other users
      const unsubscribeCursor = onCursorUpdate((data: any) => {
        const { userId: cursorUserId, cursor } = data;
        const userColor = getUserColor(cursorUserId);
        
        setUserCursors(prev => {
          const filtered = prev.filter(c => c.userId !== cursorUserId);
          if (cursor) {
            return [...filtered, {
              userId: cursorUserId,
              position: cursor.position,
              selection: cursor.selection,
              color: userColor
            }];
          }
          return filtered;
        });
      });

      return () => {
        leaveDocument(document.id, userId);
        unsubscribeUpdate();
        unsubscribeUserCount();
        unsubscribeCursor();
      };
    }
  }, [document.id, isConnected, joinDocument, leaveDocument, onSocketDocumentUpdate, onUserCount, onCursorUpdate]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (title !== document.title || content !== document.content) {
        saveDocument();
      }
    }, 2000);

    return () => clearTimeout(autoSave);
  }, [title, content, document.title, document.content]);

  // Handle Ctrl+M for AI generation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        setIsAIModalOpen(true);
      }
    };

    if (typeof window !== 'undefined') {
      window.document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  const saveDocument = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) throw new Error('Failed to save document');
      
      const updatedDoc = await response.json();
      onDocumentUpdate?.(updatedDoc);
      setLastSaved(new Date());
      toast.success('Document saved!');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = useCallback((newContent: string) => {
    if (!isReceivingUpdate) {
      setContent(newContent);
      
      // Send real-time updates to other users
      if (isConnected) {
        sendDocumentUpdate(document.id, newContent, title);
      }
    }
  }, [document.id, title, isConnected, isReceivingUpdate, sendDocumentUpdate]);

  const handleAIInsert = (generatedText: string) => {
    // Insert the generated text at the current cursor position
    setContent(prev => prev + `<p>${generatedText}</p>`);
  };

  const formatLastSaved = () => {
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyShareUrl = async () => {
    const shareUrl = `${window.location.origin}/document/${document.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      toast.success('Share link copied to clipboard!');
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleCursorChange = useCallback((position: number, selection?: { from: number; to: number }) => {
    if (isConnected) {
      const userId = getUserId();
      sendCursorUpdate(document.id, userId, { position, selection });
    }
  }, [document.id, isConnected, sendCursorUpdate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
            
            <div className="w-px h-6 bg-gray-300" />
            
            <Input
              value={title}
              onChange={(e) => {
                const newTitle = e.target.value;
                setTitle(newTitle);
                
                // Send real-time title updates
                if (isConnected && !isReceivingUpdate) {
                  sendDocumentUpdate(document.id, content, newTitle);
                }
              }}
              className="text-xl font-semibold border-none shadow-none p-0 h-auto bg-transparent focus-visible:ring-0"
              placeholder="Untitled Document"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{connectedUsers} user{connectedUsers !== 1 ? 's' : ''}</span>
              {isConnected && (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
              )}
            </div>

            <div className="text-sm text-gray-500">
              {isReceivingUpdate ? (
                <span className="text-blue-600">Receiving updates...</span>
              ) : (
                <span>Last saved: {formatLastSaved()}</span>
              )}
            </div>

            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <Button
              onClick={saveDocument}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>

            <Button
              onClick={() => setIsAIModalOpen(true)}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Generate
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Editor */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-5xl mx-auto bg-white shadow-lg mt-8 rounded-lg overflow-hidden"
      >
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          onCursorChange={handleCursorChange}
          documentId={document.id}
        />
      </motion.div>

      {/* AI Generation Modal */}
      <AIGenerationModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onInsert={handleAIInsert}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">Share Document</h3>
            <p className="text-gray-600 mb-4">
              Anyone with this link can view and edit this document.
            </p>
            
            <div className="flex items-center gap-2 mb-4">
              <Input
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/document/${document.id}`}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={copyShareUrl}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {shareUrlCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowShareModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Cursors Visualization - Simplified for now */}
      {userCursors.length > 0 && (
        <div className="fixed bottom-20 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-40">
          <div className="text-xs font-medium text-gray-600 mb-2">Active Users:</div>
          {userCursors.map((cursor) => (
            <div key={cursor.userId} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cursor.color }}
              />
              <span className="text-xs text-gray-700">
                {cursor.userId.replace('user_', 'User ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Floating hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
      >
        Press <kbd className="bg-purple-700 px-1 rounded">Ctrl+M</kbd> for AI generation
      </motion.div>
    </div>
  );
}