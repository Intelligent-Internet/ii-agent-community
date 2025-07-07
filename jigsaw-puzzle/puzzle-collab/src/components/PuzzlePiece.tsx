// Individual puzzle piece component with drag and drop functionality

'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzlePiece as PuzzlePieceType, Point } from '@/types/puzzle';
import {
  getMousePosition,
  getTouchPosition,
  isWithinSnapDistance,
  getSnapPosition,
  constrainPosition,
  throttle,
} from '@/lib/dragUtils';

interface PuzzlePieceProps {
  piece: PuzzlePieceType;
  puzzleImageUrl: string;
  onPieceMove: (pieceId: string, x: number, y: number) => void;
  onPiecePickup: (pieceId: string) => void;
  onPieceDrop: (pieceId: string, x: number, y: number) => void;
  isCurrentPlayer?: boolean;
  containerBounds?: { width: number; height: number };
  scale?: number;
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  piece,
  puzzleImageUrl,
  onPieceMove,
  onPiecePickup,
  onPieceDrop,
  isCurrentPlayer = true,
  containerBounds = { width: 1200, height: 800 },
  scale = 1,
}) => {
  const pieceRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [position, setPosition] = useState<Point>({
    x: piece.currentX,
    y: piece.currentY,
  });

  // Update position when piece prop changes (from other players)
  useEffect(() => {
    if (!isDragging) {
      setPosition({ x: piece.currentX, y: piece.currentY });
    }
  }, [piece.currentX, piece.currentY, isDragging]);

  // Throttled move handler for better performance
  const throttledOnPieceMove = useCallback(
    throttle((pieceId: string, x: number, y: number) => {
      onPieceMove(pieceId, x, y);
    }, 50),
    [onPieceMove]
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!isCurrentPlayer || piece.isLocked) return;

      event.preventDefault();
      event.stopPropagation();

      const element = pieceRef.current;
      if (!element) return;

      const mousePos = getMousePosition(event, element.parentElement!);
      const offset = {
        x: mousePos.x - position.x,
        y: mousePos.y - position.y,
      };

      setIsDragging(true);
      setDragOffset(offset);
      onPiecePickup(piece.id);

      // Add global mouse move and up listeners
      const handleMouseMove = (e: MouseEvent) => {
        if (!element.parentElement) return;

        const newMousePos = getMousePosition(e, element.parentElement);
        const newPosition = constrainPosition(
          {
            x: newMousePos.x - offset.x,
            y: newMousePos.y - offset.y,
          },
          containerBounds
        );

        setPosition(newPosition);
        throttledOnPieceMove(piece.id, newPosition.x, newPosition.y);
      };

      const handleMouseUp = (e: MouseEvent) => {
        setIsDragging(false);

        if (!element.parentElement) return;

        const finalMousePos = getMousePosition(e, element.parentElement);
        const finalPosition = constrainPosition(
          {
            x: finalMousePos.x - offset.x,
            y: finalMousePos.y - offset.y,
          },
          containerBounds
        );

        // Check if piece should snap to correct position
        if (isWithinSnapDistance(piece, finalPosition)) {
          const snapPos = getSnapPosition(piece);
          setPosition(snapPos);
          onPieceDrop(piece.id, snapPos.x, snapPos.y);
        } else {
          setPosition(finalPosition);
          onPieceDrop(piece.id, finalPosition.x, finalPosition.y);
        }

        // Remove global listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [
      isCurrentPlayer,
      piece,
      position,
      onPiecePickup,
      onPieceDrop,
      throttledOnPieceMove,
      containerBounds,
    ]
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!isCurrentPlayer || piece.isLocked) return;

      event.preventDefault();
      event.stopPropagation();

      const element = pieceRef.current;
      if (!element) return;

      const touchPos = getTouchPosition(event, element.parentElement!);
      const offset = {
        x: touchPos.x - position.x,
        y: touchPos.y - position.y,
      };

      setIsDragging(true);
      setDragOffset(offset);
      onPiecePickup(piece.id);

      // Add global touch move and end listeners
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (!element.parentElement) return;

        const newTouchPos = getTouchPosition(e, element.parentElement);
        const newPosition = constrainPosition(
          {
            x: newTouchPos.x - offset.x,
            y: newTouchPos.y - offset.y,
          },
          containerBounds
        );

        setPosition(newPosition);
        throttledOnPieceMove(piece.id, newPosition.x, newPosition.y);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        setIsDragging(false);

        if (!element.parentElement) return;

        const finalTouchPos = getTouchPosition(e, element.parentElement);
        const finalPosition = constrainPosition(
          {
            x: finalTouchPos.x - offset.x,
            y: finalTouchPos.y - offset.y,
          },
          containerBounds
        );

        // Check if piece should snap to correct position
        if (isWithinSnapDistance(piece, finalPosition)) {
          const snapPos = getSnapPosition(piece);
          setPosition(snapPos);
          onPieceDrop(piece.id, snapPos.x, snapPos.y);
        } else {
          setPosition(finalPosition);
          onPieceDrop(piece.id, finalPosition.x, finalPosition.y);
        }

        // Remove global listeners
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    },
    [
      isCurrentPlayer,
      piece,
      position,
      onPiecePickup,
      onPieceDrop,
      throttledOnPieceMove,
      containerBounds,
    ]
  );

  // Calculate piece dimensions
  const pieceWidth = 100; // Base piece width
  const pieceHeight = 100; // Base piece height

  // Calculate clip path for the puzzle piece shape
  const clipPath = `path("${piece.shape.path}")`;

  return (
    <motion.div
      ref={pieceRef}
      className={`
        absolute cursor-pointer select-none
        ${isDragging ? 'z-50' : piece.isPlaced ? 'z-10' : 'z-20'}
        ${piece.isLocked && !isDragging ? 'opacity-50' : 'opacity-100'}
        ${isCurrentPlayer ? 'hover:brightness-110' : 'pointer-events-none'}
      `}
      style={{
        left: position.x,
        top: position.y,
        width: pieceWidth,
        height: pieceHeight,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      animate={{
        x: 0,
        y: 0,
        scale: isDragging ? 1.05 : 1,
        rotate: isDragging ? 1 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Piece background with image */}
      <div
        className="w-full h-full relative overflow-hidden"
        style={{
          clipPath,
          backgroundImage: `url(${puzzleImageUrl})`,
          backgroundPosition: `-${piece.correctX}px -${piece.correctY}px`,
          backgroundSize: `${containerBounds.width}px ${containerBounds.height}px`,
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Piece border/outline */}
        <div
          className={`
            absolute inset-0 border-2 rounded-sm
            ${piece.isPlaced ? 'border-green-400' : 'border-gray-300'}
            ${isDragging ? 'border-blue-400 shadow-lg' : ''}
            ${piece.isLocked ? 'border-red-400' : ''}
          `}
          style={{ clipPath }}
        />

        {/* Lock indicator */}
        <AnimatePresence>
          {piece.isLocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
            >
              <svg
                className="w-2 h-2 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Placement indicator */}
        <AnimatePresence>
          {piece.isPlaced && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute top-1 left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
            >
              <svg
                className="w-2 h-2 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};