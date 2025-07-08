'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2, Copy, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

export function AIGenerationModal({ isOpen, onClose, onInsert }: AIGenerationModalProps) {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard shortcuts disabled for now due to SSR issues
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.ctrlKey && e.key === 'm') {
  //       e.preventDefault();
  //       if (!isOpen) {
  //         onClose(); // This will actually open the modal due to the parent component logic
  //       }
  //     }
  //   };

  //   if (typeof window !== 'undefined') {
  //     document.addEventListener('keydown', handleKeyDown);
  //   }
    
  //   return () => {
  //     if (typeof window !== 'undefined') {
  //       document.removeEventListener('keydown', handleKeyDown);
  //     }
  //   };
  // }, [isOpen, onClose]);

  const generateText = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          context: context.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate text');
      }

      const data = await response.json();
      setGeneratedText(data.generatedText);
      toast.success('Text generated successfully!');
    } catch (error) {
      console.error('Error generating text:', error);
      toast.error('Failed to generate text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (generatedText) {
      onInsert(generatedText);
      onClose();
      setPrompt('');
      setContext('');
      setGeneratedText('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    toast.success('Text copied to clipboard!');
  };

  const handleClose = () => {
    onClose();
    setPrompt('');
    setContext('');
    setGeneratedText('');
  };

  const promptSuggestions = [
    'Write a professional email introduction',
    'Create a summary of key points',
    'Draft a project proposal outline',
    'Write a creative story beginning',
    'Compose a technical explanation',
    'Generate a list of ideas',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI Text Generation
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 flex-1 overflow-hidden">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                What would you like to generate?
              </label>
              <Textarea
                placeholder="Describe what you want to write about..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') {
                    generateText();
                  }
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Context (optional)
              </label>
              <Input
                placeholder="Provide additional context..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Quick suggestions:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {promptSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPrompt(suggestion)}
                    className="text-left p-2 text-sm bg-gray-50 hover:bg-purple-50 rounded-md transition-colors border border-gray-200 hover:border-purple-200"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>

            <Button
              onClick={generateText}
              disabled={isLoading || !prompt.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Text
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Press Ctrl+Enter to generate quickly
            </p>
          </div>

          {/* Output Section */}
          <div className="flex flex-col space-y-4 overflow-hidden">
            <label className="text-sm font-medium text-gray-700 block flex-shrink-0">
              Generated Text:
            </label>
            
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                  >
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                      <p className="text-gray-600">Generating your text...</p>
                    </div>
                  </motion.div>
                ) : generatedText ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full flex flex-col"
                  >
                    <Card className="flex-1 overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                      <div className="p-4 h-full overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-gray-800">
                            {generatedText}
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    <div className="flex gap-2 mt-4 flex-shrink-0">
                      <Button
                        onClick={handleInsert}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Insert into Document
                      </Button>
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="border-purple-200 hover:bg-purple-50"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                >
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Generated text will appear here</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}