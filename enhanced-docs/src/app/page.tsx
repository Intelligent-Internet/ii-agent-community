'use client';

import { useState } from 'react';
import { DocumentList } from '@/components/DocumentList';
import { DocumentEditor } from '@/components/DocumentEditor';
import { Document } from '@/lib/documents';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';

export default function Home() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const handleSelectDocument = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleBackToList = () => {
    setSelectedDocument(null);
  };

  const handleDocumentUpdate = (updatedDocument: Document) => {
    setSelectedDocument(updatedDocument);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-right" richColors />
      
      {selectedDocument ? (
        <DocumentEditor
          document={selectedDocument}
          onBack={handleBackToList}
          onDocumentUpdate={handleDocumentUpdate}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="container mx-auto px-6 py-12"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Enhanced Docs
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A collaborative document editor with AI-powered features. 
              Create, edit, and enhance your documents with the power of artificial intelligence.
            </p>
          </motion.div>
          
          <DocumentList onSelectDocument={handleSelectDocument} />
        </motion.div>
      )}
    </div>
  );
}
