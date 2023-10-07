import { NextApiResponseServerIO } from '@/types/chat';
import { NextApiRequest } from 'next';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db';
import path from 'path';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ message: 'Not authenticated!' });
    return;
  }

  const client = await connectToDatabase();
  // 유저 프로필이미지 가져오기
  if (req.method === 'GET') {
    const profilesCollection = client.db().collection('profiles');
    const profileResult = await profilesCollection.findOne({
      userId: session?.user?.email,
    });
    res.status(200).json(profileResult?.image);
    // 유저 프로필이미지 업데이트
  } else if (req.method === 'POST') {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath);
    }

    // 기존 이미지 삭제
    const profilesCollection = client.db().collection('profiles');
    const profileResult = await profilesCollection.findOne({
      userId: session?.user?.email,
    });
    if (profileResult?.image) {
      const deletePath = path.join(process.cwd(), profileResult?.image);
      fs.unlinkSync(deletePath);
    }

    // 새 이미지 업로드
    const usersCollection = client.db().collection('users');
    const UserResult = await usersCollection.findOne({
      email: session?.user?.email,
    });
    const roomFolderPath = path.join(uploadsPath, String(UserResult?._id));
    if (!fs.existsSync(roomFolderPath)) {
      fs.mkdirSync(roomFolderPath);
    }

    let new_filename;
    const now_time = Date.now();
    const readFile = (req: NextApiRequest, saveLocally: boolean = true) => {
      const options: formidable.Options = {};

      if (saveLocally) {
        options.uploadDir = roomFolderPath;
        options.filename = (name, ext, path, form) => {
          new_filename = now_time.toString() + '_' + path.originalFilename;
          return new_filename;
        };
      }

      return new Promise<{
        fields: formidable.Fields;
        files: formidable.Files;
      }>((resolve, rejects) => {
        const form = formidable(options);

        form.parse(req, (err, fields, files) => {
          if (err) {
            rejects(err);
          }
          resolve({ fields, files });
        });
      });
    };

    const data = await readFile(req, true);

    const completePath = path.join(roomFolderPath, new_filename!);
    const relativePath = path.relative(process.cwd(), completePath);

    await client
      .db()
      .collection(`profiles`)
      .updateOne(
        {
          userId: session?.user?.email,
        },
        {
          $set: {
            image: relativePath,
          },
        }
      );

    const result = await client
      .db()
      .collection(`rooms`)
      .find({
        memberList: session?.user?.email,
      });

    const rooms = await result.toArray();
    rooms.forEach((room) => {
      res.socket.server.io.to(String(room.chatId)).emit('profileImage', {});
    });

    return res.status(201).json({ message: 'OK' });
  }
}

export default handler;
