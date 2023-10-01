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

        // 방에 기존에 입장한 사람인지 확인
        const rooms_result = client
          .db()
          .collection('rooms')
          .find({
            chatId: new ObjectId(roomId),
          });
        const roomInfo = await rooms_result.toArray();

        if (roomInfo[0].memberList.some((member: string) => member === email))
          return;

        // // 방에 처음 입장한 사람인 경우
        // const now_time = new Date().toISOString();

        // const chatsCollection = client.db().collection(`chats-${roomId}`);
        // const chats_result = await chatsCollection.insertOne({
        //   createdAt: now_time,
        //   SenderId: '[system]',
        //   content: `${email}님이 입장하셨습니다.`,
        // });

        // io.to(roomId).emit('join', {
        //   _id: chats_result.insertedId,
        //   createdAt: now_time,
        //   SenderId: '[system]',
        //   content: `${email}님이 입장하셨습니다.`,
        // });
      });

      socket.on('message', (roomId, message) => {
        io.to(roomId).emit('message', message);
      });

      socket.on('disconnect', () => {
        console.log('A client disconnected.');
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default handler;
