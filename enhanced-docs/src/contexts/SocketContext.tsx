'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface CursorPosition {
  position: number;
  selection?: {
    from: number;
    to: number;
  };
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinDocument: (documentId: string, userId: string) => void;
  leaveDocument: (documentId: string, userId: string) => void;
  sendDocumentUpdate: (documentId: string, content: string, title?: string) => void;
  sendCursorUpdate: (documentId: string, userId: string, cursor: CursorPosition) => void;
  onDocumentUpdate: (callback: (data: any) => void) => () => void;
  onUserJoined: (callback: (data: any) => void) => () => void;
  onUserLeft: (callback: (data: any) => void) => () => void;
  onUserCount: (callback: (data: any) => void) => () => void;
  onCursorUpdate: (callback: (data: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(typeof window !== 'undefined' ? window.location.origin : '', {
      path: '/api/socket',
      addTrailingSlash: false,
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  const joinDocument = (documentId: string, userId: string) => {
    if (socket) {
      socket.emit('join-document', { documentId, userId });
    }
  };

  const leaveDocument = (documentId: string, userId: string) => {
    if (socket) {
      socket.emit('leave-document', { documentId, userId });
    }
  };

  const sendDocumentUpdate = (documentId: string, content: string, title?: string) => {
    if (socket) {
      const { getUserId } = require('@/utils/userUtils');
      socket.emit('document-update', {
        documentId,
        content,
        title,
        userId: getUserId(),
        timestamp: Date.now()
      });
    }
  };

  const sendCursorUpdate = (documentId: string, userId: string, cursor: CursorPosition) => {
    if (socket) {
      socket.emit('cursor-update', {
        documentId,
        userId,
        cursor
      });
    }
  };

  const onDocumentUpdate = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('document-updated', callback);
      return () => socket.off('document-updated', callback);
    }
    return () => {};
  };

  const onUserJoined = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-joined', callback);
      return () => socket.off('user-joined', callback);
    }
    return () => {};
  };

  const onUserLeft = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-left', callback);
      return () => socket.off('user-left', callback);
    }
    return () => {};
  };

  const onUserCount = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-count', callback);
      return () => socket.off('user-count', callback);
    }
    return () => {};
  };

  const onCursorUpdate = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('cursor-updated', callback);
      return () => socket.off('cursor-updated', callback);
    }
    return () => {};
  };



  const value: SocketContextType = {
    socket,
    isConnected,
    joinDocument,
    leaveDocument,
    sendDocumentUpdate,
    sendCursorUpdate,
    onDocumentUpdate,
    onUserJoined,
    onUserLeft,
    onUserCount,
    onCursorUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};