import { NextApiResponseServerIO } from '@/types/chat';
import { NextApiRequest } from 'next';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'Not authenticated!' });
    return;
  }

  const roomId = req.query.index;
  const client = await connectToDatabase();
  const room = await client
    .db()
    .collection('rooms')
    .findOneAndUpdate(
      { chatId: new ObjectId(roomId as string) },
      { $pull: { memberList: session?.user?.email as any } }
    );

  const now_time = new Date().toISOString();

  const chatsCollection = client.db().collection(`chats-${roomId}`);
  const chats_result = await chatsCollection.insertOne({
    createdAt: now_time,
    SenderId: '[system]',
    content: `${session.user!.email}님이 퇴장하셨습니다.`,
  });

  res.socket.server.io.to(roomId!).emit('joinleaveMessage', {
    _id: chats_result.insertedId,
    createdAt: now_time,
    SenderId: '[system]',
    content: `${session.user!.email}님이 퇴장하셨습니다.`,
  });

  res.status(200).json({ message: 'success' });
}
export default handler;
