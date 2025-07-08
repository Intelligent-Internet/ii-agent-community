import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new ServerIO(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join-document', (documentId: string) => {
        socket.join(documentId);
        console.log(`User ${socket.id} joined document ${documentId}`);
      });

      socket.on('leave-document', (documentId: string) => {
        socket.leave(documentId);
        console.log(`User ${socket.id} left document ${documentId}`);
      });

      socket.on('document-change', (data: { documentId: string; content: string }) => {
        socket.to(data.documentId).emit('document-update', data);
      });

      socket.on('cursor-position', (data: { documentId: string; position: any; user: string }) => {
        socket.to(data.documentId).emit('cursor-update', data);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }
  res.end();
};

export default SocketHandler;