import { connectToDatabase } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]';
import { NextApiResponseServerIO } from '@/types/chat';
import { NextApiRequest } from 'next';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

/**
 _id: number; //chats
  title: string;   // chats
  owner: string;  //chats
 */

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'Not authenticated!' });
    return;
  }

  const client = await connectToDatabase();
  if (req.method === 'GET') {
    try {
      const chatsCollection = client.db().collection('chats');
      const chats = await chatsCollection
        .find({
          _id: new ObjectId(req.query.index as string),
        })
        .toArray();

      res.status(200).json({
        _id: chats[0]._id,
        title: chats[0].title,
        owner: chats[0].SenderId,
      });
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const chatsCollection = client.db().collection('chats');
      const chats = await chatsCollection
        .find({
          _id: new ObjectId(req.query.index as string),
        })
        .toArray();

      if (chats[0].SenderId !== session.user!.email) {
        res.status(401).json({ message: 'Not authenticated!' });
        return;
      }

      console.log(chats[0]);
      // chats document 삭제
      await chatsCollection.deleteOne({
        _id: new ObjectId(req.query.index as string),
      });
      // chats-채팅방번호 collection 삭제
      await client.db().dropCollection(`chats-${req.query.index}`);
      // rooms collection에서 해당 채팅방 삭제
      await client
        .db()
        .collection('rooms')
        .deleteOne({
          chatId: new ObjectId(req.query.index as string),
        });

      res.socket.server.io
        .to(`${req.query.index}`)
        .emit('removeRoom', req.query.index);

      // 채팅방 이미지 삭제
      const uploadsPath = path.join(process.cwd(), 'uploads');
      const roomFolderPath = path.join(uploadsPath, req.query.index as string);
      fs.rmdirSync(roomFolderPath, { recursive: true });

      res.status(200).json({ message: 'OK' });
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
  }
}

export default handler;
