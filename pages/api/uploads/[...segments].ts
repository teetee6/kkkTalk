import { NextApiResponseServerIO } from '@/types/chat';
import { NextApiRequest } from 'next';
import fs from 'fs';
import path from 'path';

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  try {
    const segments = req.query.segments as Array<string>;
    const imageFilePath = path.join(process.cwd(), 'uploads', ...segments);

    const imageBuffer = fs.readFileSync(imageFilePath);

    res.setHeader('Content-Type', 'image/*');

    res.status(200).end(imageBuffer, 'binary');
  } catch (error) {
    console.error(error);
    res.status(404).end('Image not found');
  }
}

export default handler;
