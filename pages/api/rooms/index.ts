import { connectToDatabase } from '@/lib/db';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { NextApiResponseServerIO } from '@/types/chat';

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  // 방 목록 가져오기
  if (req.method === 'GET') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ message: 'Not authenticated!' });
      return;
    }

    const client = await connectToDatabase();
    try {
      const { page, pageSize } = req.query;
      const pageNumber = Number(page);
      const pageSizeNumber = Number(pageSize);

      const chatsCollection = client.db().collection('chats');
      // const chats = await chatsCollection.find().toArray();
      const chats = await chatsCollection
        .find()
        .sort({ createdAt: -1 }) // createdAt 필드를 내림차순으로 정렬
        .skip((pageNumber - 1) * pageSizeNumber) // 건너뛸 문서 수 계산
        .limit(pageSizeNumber) // 반환할 문서 수 설정
        .toArray();
      // const totalRoomsCount = await chatsCollection.countDocuments();

      res.status(200).json(
        chats
        // totalRoomsCount,
      );
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    } finally {
      // client.close();
    }
  }
  // 방 만들기
  else if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ message: 'Not authenticated!' });
      return;
    }

    const client = await connectToDatabase();
    try {
      const now_time = new Date().toISOString();
      const chatsCollection = client.db().collection('chats');
      const result = await chatsCollection.insertOne({
        createdAt: now_time,
        SenderId: session.user!.email,
        title: req.body.title,
      });
      res.socket.server.io.emit('newRoom', {
        _id: result.insertedId,
        createdAt: now_time,
        SenderId: session.user!.email,
        title: req.body.title,
      });
      res.status(200).json({ message: 'OK' });
    } catch (error) {
      console.error('Error saving chat message:', error);
      res.status(500).json({ message: 'Failed to save chat message' });
    } finally {
      // client.close();
    }
  }
}

export default handler;
