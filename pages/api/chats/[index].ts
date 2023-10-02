import { connectToDatabase } from '@/lib/db';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { Router } from 'next/router';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import { NextApiResponseServerIO } from '@/types/chat';

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'Not authenticated!' });
    return;
  }

  const client = await connectToDatabase();

  // 채팅 보내기
  if (req.method === 'POST') {
    try {
      const now_time = new Date().toISOString();
      const chatsCollection = client
        .db()
        .collection(`chats-${req.query.index}`);
      const result = await chatsCollection.insertOne({
        createdAt: now_time,
        SenderId: session.user!.email,
        content: req.body.chat,
      });

      res.socket.server.io.to(`${req.query.index}`).emit('message', {
        _id: result.insertedId,
        createdAt: now_time,
        SenderId: session.user!.email,
        content: req.body.chat,
      });
      res.status(200).json({ message: 'OK' });
    } catch (error) {
      console.error('Error saving chat message:', error);
      res.status(500).json({ message: 'Failed to save chat message' });
    } finally {
    }
  }

  // 채팅 가져오기
  else if (req.method === 'GET') {
    try {
      const chatsCollection = client
        .db()
        .collection(`chats-${req.query.index}`);
      const chats = await chatsCollection.find().toArray();
      res.status(200).json(chats);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    } finally {
    }
  }
}

export default handler;
