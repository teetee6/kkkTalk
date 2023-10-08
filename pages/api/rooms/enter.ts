import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { NextApiResponseServerIO } from '@/types/chat';

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ message: 'Not authenticated!' });
      return;
    }

    const client = await connectToDatabase();

    try {
      const roomsCollection = client.db().collection('rooms');
      const chatsCollection = client.db().collection('chats');

      // 방번호 가져오기
      const chatsDocument = await chatsCollection.findOne({
        _id: new ObjectId(req.body.roomId),
      });

      // 방에 이미 입장했는지 확인
      const room = await roomsCollection.findOne({
        chatId: chatsDocument?._id,
        memberList: session.user!.email,
      });

      if (room) {
        // 이미 방에 입장한 경우
        res.status(200).json({ message: 'Already in the room' });
      } else {
        // 방에 처음 입장한 경우
        await roomsCollection.updateOne(
          { chatId: chatsDocument?._id },
          {
            $addToSet: { memberList: session.user!.email },
          },
          { upsert: true } // 업서트 옵션을 사용하여 문서를 생성하도록 설정
        );

        // 방에 처음 입장한 사람인 경우
        const now_time = new Date().toISOString();

        const chatsCollection = client
          .db()
          .collection(`chats-${req.body.roomId}`);
        const chats_result = await chatsCollection.insertOne({
          createdAt: now_time,
          SenderId: '[system]',
          content: `${session.user!.email}님이 입장하셨습니다.`,
          chatId: req.body.roomId,
        });

        res.socket.server.io.to(req.body.roomId).emit('joinleaveMessage', {
          _id: chats_result.insertedId,
          createdAt: now_time,
          SenderId: '[system]',
          content: `${session.user!.email}님이 입장하셨습니다.`,
          chatId: req.body.roomId,
        });

        res
          .status(201)
          .json({ message: 'Entered the room for the first time' });
      }
    } catch (error) {
      console.error('Error saving chat message:', error);
      res.status(500).json({ message: 'Failed to save chat message' });
    } finally {
      // client.close();
    }
  }
}

export default handler;
