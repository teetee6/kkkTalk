import { NextApiResponseServerIO } from '@/types/chat';
import { NextApiRequest } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/db';
import fs from 'fs';
import path from 'path';

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'Not authenticated!' });
    return;
  }
  const client = await connectToDatabase();
  const profilesCollection = client.db().collection('profiles');
  const profileResult = await profilesCollection.findOne({
    userId: req.query.email,
  });
  // 유저 프로필이미지 가져오기
  try {
    const imageFilePath = path.join(process.cwd(), profileResult?.image);

    console.log(imageFilePath);
    const imageBuffer = fs.readFileSync(imageFilePath);

    res.setHeader('Content-Type', 'image/*');

    res.status(200).end(imageBuffer, 'binary');
  } catch (error) {
    console.error(error);
    res.status(404).end('Image not found');
  }
}
export default handler;
