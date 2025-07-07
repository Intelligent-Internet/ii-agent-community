// Utilities for drag and drop functionality

import { PuzzlePiece, Point } from '@/types/puzzle';

export interface DragState {
  isDragging: boolean;
  dragOffset: Point;
  startPosition: Point;
}

export const getMousePosition = (
  event: React.MouseEvent | MouseEvent,
  element: HTMLElement
): Point => {
  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

export const getTouchPosition = (
  event: React.TouchEvent | TouchEvent,
  element: HTMLElement
): Point => {
  const rect = element.getBoundingClientRect();
  const touch = event.touches[0] || event.changedTouches[0];
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
};

export const calculateSnapDistance = (
  piece: PuzzlePiece,
  currentPosition: Point
): number => {
  const dx = currentPosition.x - piece.correctX;
  const dy = currentPosition.y - piece.correctY;
  return Math.sqrt(dx * dx + dy * dy);
};

export const isWithinSnapDistance = (
  piece: PuzzlePiece,
  currentPosition: Point,
  snapThreshold: number = 30
): boolean => {
  return calculateSnapDistance(piece, currentPosition) <= snapThreshold;
};

export const getSnapPosition = (piece: PuzzlePiece): Point => {
  return {
    x: piece.correctX,
    y: piece.correctY,
  };
};

export const constrainPosition = (
  position: Point,
  bounds: { width: number; height: number; margin?: number }
): Point => {
  const margin = bounds.margin || 0;
  return {
    x: Math.max(margin, Math.min(bounds.width - margin, position.x)),
    y: Math.max(margin, Math.min(bounds.height - margin, position.y)),
  };
};

export const getBoundingBoxFromPieces = (pieces: PuzzlePiece[]) => {
  if (pieces.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const positions = pieces.map(piece => ({
    x: piece.correctX,
    y: piece.correctY,
  }));

  const minX = Math.min(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxX = Math.max(...positions.map(p => p.x));
  const maxY = Math.max(...positions.map(p => p.y));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const isPointInPath = (point: Point, pathElement: SVGPathElement): boolean => {
  try {
    const svg = pathElement.ownerSVGElement;
    if (!svg) return false;

    const svgPoint = svg.createSVGPoint();
    svgPoint.x = point.x;
    svgPoint.y = point.y;

    return pathElement.isPointInFill(svgPoint);
  } catch (error) {
    console.warn('Error checking point in path:', error);
    return false;
  }
};

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
};