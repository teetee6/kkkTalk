import { connectToDatabase } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]';
import { NextApiResponseServerIO } from '@/types/chat';
import { NextApiRequest } from 'next';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'Not authenticated!' });
    return;
  }

  const client = await connectToDatabase();
  // 방 정보 가져오기
  if (req.method === 'GET') {
    try {
      const chatsCollection = client.db().collection('chats');
      const chats = await chatsCollection.findOne({
        _id: new ObjectId(req.query.index as string),
      });

      const roomsCollection = client.db().collection('rooms');
      const rooms = await roomsCollection.findOne({
        chatId: new ObjectId(req.query.index as string),
      });

      // if (rooms?.kickList.includes(session.user!.email)) {
      //   console.log('kicked');
      //   throw new Error('kicked');
      // }

      res.status(200).json({
        _id: chats?._id,
        title: chats?.title,
        owner: chats?.SenderId,
        memberList: rooms?.memberList,
        kickList: rooms?.kickList,
      });
    } catch (error) {
      res
        .status(403)
        .json({ message: error || `Failed to fetch chat messages` });
    }
    // 방 삭제
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
      // 이미지 폴더가 존재하는지 확인
      if (fs.existsSync(roomFolderPath)) {
        fs.rmdirSync(roomFolderPath, { recursive: true });
      }

      await client
        .db()
        .collection('chats')
        .deleteOne({ _id: new ObjectId(req.query.index as string) });

      res.status(200).json({ message: 'OK' });
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
  }
}

export default handler;
