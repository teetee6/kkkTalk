import { NextApiResponseServerIO } from '@/types/chat';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
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
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ message: 'Not authenticated!' });
      return;
    }

    const uploadsPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath);
    }
    const roomId = req.query.roomId as string;
    const roomFolderPath = path.join(uploadsPath, roomId);
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

    const client = await connectToDatabase();
    const result = await client.db().collection(`chats-${roomId}`).insertOne({
      SenderId: session.user!.email,
      content: relativePath,
      createdAt: now_time,
    });

    res.socket.server.io.to(`${roomId}`).emit('message', {
      _id: result.insertedId,
      createdAt: now_time,
      SenderId: session.user!.email,
      content: relativePath,
    });

    return res.status(201).json({ message: 'OK' });
  }
}

export default handler;
