'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Calendar, Trash2, Edit, Share2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Document } from '@/lib/documents';

interface DocumentListProps {
  onSelectDocument: (document: Document) => void;
}

export function DocumentList({ onSelectDocument }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const createDocument = async () => {
    if (!newDocTitle.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newDocTitle.trim(),
          content: '',
        }),
      });

      if (!response.ok) throw new Error('Failed to create document');
      
      const newDoc = await response.json();
      setDocuments([newDoc, ...documents]);
      setIsCreateModalOpen(false);
      setNewDocTitle('');
      toast.success('Document created successfully!');
      onSelectDocument(newDoc);
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document');
    }
  };

  const deleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');
      
      setDocuments(documents.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const shareDocument = async (document: Document) => {
    const shareUrl = `${window.location.origin}/document/${document.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Document link copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = window.document.createElement('textarea');
      textArea.value = shareUrl;
      window.document.body.appendChild(textArea);
      textArea.select();
      window.document.execCommand('copy');
      window.document.body.removeChild(textArea);
      toast.success('Document link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Documents</h1>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Enter document title..."
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createDocument();
                  }
                }}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createDocument}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((document, index) => (
          <motion.div
            key={document.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group"
              onClick={() => onSelectDocument(document)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <span className="truncate">{document.title}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareDocument(document);
                      }}
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      title="Share document"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteDocument(document.id, e)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div 
                    className="text-sm text-gray-600 line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: document.content || '<p class="text-gray-400 italic">Empty document</p>' 
                    }}
                  />
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Updated {formatDate(document.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {documents.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-6">Create your first document to get started</p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Document
          </Button>
        </motion.div>
      )}
    </div>
  );
}