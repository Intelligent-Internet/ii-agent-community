'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DocumentEditor } from '@/components/DocumentEditor';
import { Loader2 } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const documentId = params?.id as string;

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Document not found');
          } else {
            setError('Failed to load document');
          }
          return;
        }

        const doc = await response.json();
        setDocument(doc);
      } catch (err) {
        setError('Failed to load document');
        console.error('Error fetching document:', err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Document not found'}
            </h1>
            <p className="text-gray-600 mb-6">
              The document you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={handleBack}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DocumentEditor
      document={document}
      onBack={handleBack}
    />
  );
}