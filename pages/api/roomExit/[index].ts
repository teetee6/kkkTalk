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

  // const roomResult = await client
  //   .db()
  //   .collection('rooms')
  //   .findOne({ chatId: new ObjectId(roomId as string) });

  // // 방에 아무도 없으면 방 삭제
  // if (roomResult && roomResult.memberList.length === 0) {
  //   await client
  //     .db()
  //     .collection('rooms')
  //     .deleteOne({ chatId: new ObjectId(roomId as string) });

  //   await client.db().collection(`chats-${roomId}`).drop();

  //   // 채팅방 이미지 삭제
  //   const uploadsPath = path.join(process.cwd(), 'uploads');
  //   const roomFolderPath = path.join(uploadsPath, roomId as string);
  //   // 이미지 폴더가 존재하는지 확인
  //   if (fs.existsSync(roomFolderPath)) {
  //     fs.rmdirSync(roomFolderPath, { recursive: true });
  //   }

  //   await client
  //     .db()
  //     .collection('chats')
  //     .deleteOne({ _id: new ObjectId(roomId as string) });

  //   res.socket.server.io.emit('removeRoom', roomId);
  // }

  res.status(200).json({ message: 'success' });
}
export default handler;
