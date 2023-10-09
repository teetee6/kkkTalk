import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/chat';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';
import { socketMap } from '@/utils/socketMap';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
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
      socket.on('login', async (email) => {
        socketMap[socket.id] = email;
        console.log('-->[login]socketMap', socketMap);
      });

      socket.on('joinRoom', async (roomId, email) => {
        socket.join(roomId);
      });

      socket.on('leaveRoom', async (roomId, email) => {
        socket.leave(roomId);
      });

      socket.on('message', (roomId, message) => {
        io.to(roomId).emit('message', message);
      });

      socket.on('disconnect', () => {
        delete socketMap[socket.id];
        console.log('-->[disconnect]socketMap', socketMap);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default handler;
