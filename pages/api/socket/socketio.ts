import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/chat';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer, createServer } from 'http';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const config = {
  api: {
    bodyParser: false,
  },
};

export const socketMap: { [key: string]: string } = {};

const handler = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const client = await connectToDatabase();
    console.log('New Socket.io server...✅');

    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket/socketio',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('A client connected.');

      socket.on('joinRoom', async (roomId, email) => {
        socket.join(roomId);
      });

      socket.on('leaveRoom', async (roomId, email) => {
        socket.leave(roomId);
      });

      socket.on('message', (roomId, message) => {
        io.to(roomId).emit('message', message);
      });

      socket.on('disconnect', () => {});
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default handler;
