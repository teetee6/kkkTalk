import { NextApiResponseServerIO } from '@/types/chat';
import { NextApiRequest } from 'next';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { socketMap } from '@/utils/socketMap';

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'Not authenticated!' });
    return;
  }

  const kickedEmail = req.query.email as string;
  const client = await connectToDatabase();

  const dbSession = client.startSession();
  try {
    await dbSession.withTransaction(async () => {
      const roomsCollection = client.db().collection('rooms');

      // rooms collection에서 memberList에서 해당 유저 삭제
      await roomsCollection.updateOne(
        { chatId: new ObjectId(req.body.chatId) },
        {
          $pull: { memberList: kickedEmail },
        },
        { session: dbSession }
      );

      // rooms Collection의 kickList 배열에 해당 유저 추가
      await roomsCollection.updateOne(
        { chatId: new ObjectId(req.body.chatId) },
        {
          $addToSet: { kickList: kickedEmail },
        },
        { session: dbSession }
      );
    });
    dbSession.endSession();
  } catch (error) {
    // 트랜잭션 실패 시 에러 처리
    console.error('트랜잭션 실패:', error);
    dbSession.endSession();
  }

  // 해당 유저 kick하기
  console.log('--->', socketMap[kickedEmail]);
  res.socket.server.io.to(socketMap[kickedEmail]).emit('kicked');

  res.status(200).json({ message: 'success' });
}

export default handler;
