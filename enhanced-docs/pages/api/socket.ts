import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ExtendedNextApiResponse extends NextApiResponse {
  socket: NextApiResponse['socket'] & {
    server: NetServer & {
      io?: ServerIO;
    };
  };
}

interface DocumentUpdate {
  documentId: string;
  content: string;
  title?: string;
  userId: string;
  timestamp: number;
}

interface UserPresence {
  userId: string;
  documentId: string;
  cursor?: {
    position: number;
    selection?: {
      from: number;
      to: number;
    };
  };
}

const SocketHandler = (req: NextApiRequest, res: ExtendedNextApiResponse) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new ServerIO(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000
    });
    res.socket.server.io = io;

    // Store active users per document
    const documentUsers = new Map<string, Set<string>>();
    const userSockets = new Map<string, string>(); // userId -> socketId
    const socketUsers = new Map<string, string>(); // socketId -> userId

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join document room
      socket.on('join-document', (data: { documentId: string; userId: string }) => {
        const { documentId, userId } = data;
        
        // Clean up any previous user association for this socket
        const previousUserId = socketUsers.get(socket.id);
        if (previousUserId) {
          // Remove from all documents
          for (const [docId, users] of documentUsers.entries()) {
            if (users.has(previousUserId)) {
              users.delete(previousUserId);
              if (users.size === 0) {
                documentUsers.delete(docId);
              } else {
                // Notify remaining users about count update
                io.to(docId).emit('user-count', {
                  count: users.size,
                  users: Array.from(users)
                });
              }
            }
          }
          userSockets.delete(previousUserId);
        }

        // Leave all previous rooms except the socket's own room
        Array.from(socket.rooms).forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });

        // Join new document room
        socket.join(documentId);
        
        // Track user in document
        if (!documentUsers.has(documentId)) {
          documentUsers.set(documentId, new Set());
        }
        
        // Add user to document (remove from other documents first)
        for (const [docId, users] of documentUsers.entries()) {
          if (docId !== documentId && users.has(userId)) {
            users.delete(userId);
            if (users.size === 0) {
              documentUsers.delete(docId);
            } else {
              io.to(docId).emit('user-count', {
                count: users.size,
                users: Array.from(users)
              });
            }
          }
        }
        
        documentUsers.get(documentId)!.add(userId);
        userSockets.set(userId, socket.id);
        socketUsers.set(socket.id, userId);

        const currentCount = documentUsers.get(documentId)!.size;

        // Send current user count to all users in the room
        io.to(documentId).emit('user-count', {
          count: currentCount,
          users: Array.from(documentUsers.get(documentId)!)
        });

        console.log(`User ${userId} joined document ${documentId}, total users: ${currentCount}`);
      });

      // Handle document updates
      socket.on('document-update', (data: DocumentUpdate) => {
        console.log('Document update received:', data.documentId);
        
        // Broadcast to all other users in the document room
        socket.to(data.documentId).emit('document-updated', {
          content: data.content,
          title: data.title,
          userId: data.userId,
          timestamp: data.timestamp
        });
      });

      // Handle cursor/selection updates
      socket.on('cursor-update', (data: UserPresence) => {
        socket.to(data.documentId).emit('cursor-updated', {
          userId: data.userId,
          cursor: data.cursor
        });
      });

      // Handle user disconnect
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        const userId = socketUsers.get(socket.id);
        if (userId) {
          // Remove user from all documents
          for (const [documentId, users] of documentUsers.entries()) {
            if (users.has(userId)) {
              users.delete(userId);
              
              const remainingCount = users.size;
              
              // Notify others about user leaving and send updated count
              io.to(documentId).emit('user-left', {
                userId,
                userCount: remainingCount
              });
              
              // Send updated user count to all remaining users
              io.to(documentId).emit('user-count', {
                count: remainingCount,
                users: Array.from(users)
              });
              
              // Clean up empty document rooms
              if (remainingCount === 0) {
                documentUsers.delete(documentId);
              }
              
              console.log(`User ${userId} left document ${documentId}, remaining users: ${remainingCount}`);
            }
          }
          
          // Clean up mappings
          userSockets.delete(userId);
          socketUsers.delete(socket.id);
        }
      });

      // Handle leave document
      socket.on('leave-document', (data: { documentId: string; userId: string }) => {
        const { documentId, userId } = data;
        
        socket.leave(documentId);
        
        if (documentUsers.has(documentId)) {
          documentUsers.get(documentId)!.delete(userId);
          
          const remainingCount = documentUsers.get(documentId)!.size;
          
          // Notify others about user leaving
          socket.to(documentId).emit('user-left', {
            userId,
            userCount: remainingCount
          });
          
          // Send updated user count
          io.to(documentId).emit('user-count', {
            count: remainingCount,
            users: Array.from(documentUsers.get(documentId)!)
          });
          
          // Clean up empty document rooms
          if (remainingCount === 0) {
            documentUsers.delete(documentId);
          }
          
          // Clean up user mappings
          userSockets.delete(userId);
          socketUsers.delete(socket.id);
        }
      });
    });
  }
  res.end();
};

export default SocketHandler;