'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Sparkles, 
  FileText, 
  Expand, 
  Minimize, 
  CheckCircle, 
  X, 
  Loader2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface AIEnhancementBarProps {
  selectedText: string;
  onEnhance: (enhancedText: string) => void;
  onClose: () => void;
}

export function AIEnhancementBar({ selectedText, onEnhance, onClose }: AIEnhancementBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const enhanceText = async (action: string) => {
    setIsLoading(true);
    setLoadingAction(action);

    try {
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: selectedText,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance text');
      }

      const data = await response.json();
      onEnhance(data.enhancedText);
      toast.success(`Text ${action}d successfully!`);
    } catch (error) {
      console.error('Error enhancing text:', error);
      toast.error('Failed to enhance text. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const actions = [
    {
      id: 'improve',
      label: 'Improve',
      icon: Sparkles,
      description: 'Make the text better and more engaging',
      color: 'text-purple-600',
    },
    {
      id: 'summarize',
      label: 'Summarize',
      icon: Minimize,
      description: 'Create a concise summary',
      color: 'text-blue-600',
    },
    {
      id: 'expand',
      label: 'Expand',
      icon: Expand,
      description: 'Add more details and context',
      color: 'text-green-600',
    },
    {
      id: 'simplify',
      label: 'Simplify',
      icon: FileText,
      description: 'Make it easier to understand',
      color: 'text-orange-600',
    },
    {
      id: 'correct',
      label: 'Correct',
      icon: CheckCircle,
      description: 'Fix grammar and spelling',
      color: 'text-red-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <Card className="p-2 shadow-lg border-2 border-purple-200 bg-white/95 backdrop-blur-sm">
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {actions.map((action) => (
              <Tooltip key={action.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => enhanceText(action.id)}
                    disabled={isLoading}
                    className="h-8 px-2 hover:bg-purple-50 transition-colors"
                  >
                    {isLoading && loadingAction === action.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <action.icon className={`h-4 w-4 ${action.color}`} />
                    )}
                    <span className="ml-1 text-xs font-medium">{action.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{action.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </Card>
    </motion.div>
  );
}