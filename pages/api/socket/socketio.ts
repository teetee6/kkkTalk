import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/chat';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';
import Redis from 'ioredis';

const redis = new Redis();

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function getAllData() {
  const keys = await redis.keys('*'); // 모든 키 가져오기

  const data: any = {};
  for (const key of keys) {
    const value = await redis.get(key); // 각 키에 대한 값을 가져오기
    data[key] = value;
  }

  return data;
}

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
        await redis.set(socket.id, email);
        const storedEmail = await redis.get(socket.id);
        console.log('-->[login]Redis Data Set', storedEmail, ':', socket.id);

        getAllData()
          .then((result) => {
            console.log('All Redis Data:', result);
          })
          .catch((error) => {
            console.error('Error:', error);
          });
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

      socket.on('disconnect', async () => {
        const email = await redis.get(socket.id);
        if (email) {
          await redis.del(socket.id);
          console.log('-->[disconnect]Redis Data Deleted');
        }
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default handler;
