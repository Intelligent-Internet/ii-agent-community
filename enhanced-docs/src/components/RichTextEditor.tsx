'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Highlighter,
  Palette,
  Sparkles,
  Undo,
  Redo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AIEnhancementBar } from './AIEnhancementBar';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  documentId: string;
  onCursorChange?: (position: number, selection?: { from: number; to: number }) => void;
}

export function RichTextEditor({ content, onChange, documentId, onCursorChange }: RichTextEditorProps) {
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showAIBar, setShowAIBar] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Color,
      TextStyle,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      
      // Send cursor position to other users
      if (onCursorChange) {
        const cursorPosition = from;
        const selection = from !== to ? { from, to } : undefined;
        onCursorChange(cursorPosition, selection);
      }
      
      if (text.trim().length > 0) {
        setSelectedText(text);
        
        // Get selection coordinates
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        
        setSelectionPosition({
          x: (start.left + end.left) / 2,
          y: start.top - 60
        });
        setShowAIBar(true);
      } else {
        setShowAIBar(false);
        setSelectedText('');
        setSelectionPosition(null);
      }
    },
  });

  const handleAIEnhancement = useCallback((enhancedText: string) => {
    if (editor && selectedText) {
      const { from, to } = editor.state.selection;
      editor.chain().focus().deleteRange({ from, to }).insertContent(enhancedText).run();
      setShowAIBar(false);
    }
  }, [editor, selectedText]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080'
  ];

  return (
    <div className="w-full">
      {/* Toolbar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200 p-4 bg-white sticky top-0 z-10 shadow-sm"
      >
        <TooltipProvider>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Text Formatting */}
            <div className="flex gap-1 border-r pr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive('bold') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive('italic') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Italic</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive('underline') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                  >
                    <UnderlineIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Underline</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive('strike') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Strikethrough</TooltipContent>
              </Tooltip>
            </div>

            {/* Text Alignment */}
            <div className="flex gap-1 border-r pr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Align Left</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Align Center</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Align Right</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                  >
                    <AlignJustify className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Justify</TooltipContent>
              </Tooltip>
            </div>

            {/* Highlight and Color */}
            <div className="flex gap-1 border-r pr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive('highlight') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                  >
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Highlight</TooltipContent>
              </Tooltip>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="grid grid-cols-6 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => editor.chain().focus().setColor(color).run()}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </motion.div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="prose prose-lg max-w-none p-8 min-h-[600px] focus:outline-none"
        />

        {/* AI Enhancement Bar */}
        <AnimatePresence>
          {showAIBar && selectionPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              style={{
                position: 'absolute',
                left: selectionPosition.x,
                top: selectionPosition.y,
                transform: 'translateX(-50%)',
                zIndex: 50,
              }}
            >
              <AIEnhancementBar
                selectedText={selectedText}
                onEnhance={handleAIEnhancement}
                onClose={() => setShowAIBar(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}