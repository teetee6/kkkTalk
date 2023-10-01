import { NextApiResponseServerIO } from '@/types/chat';
import { NextApiRequest } from 'next';
import fs from 'fs';
import path from 'path';

async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  try {
    console.log('hi');
    const segments = req.query.segments as Array<string>;
    const imageFilePath = path.join(process.cwd(), 'uploads', ...segments);

    // 이미지 파일 읽기
    const imageBuffer = fs.readFileSync(imageFilePath);

    console.log(segments);
    // 이미지 MIME 유형에 따라 Content-Type 설정
    res.setHeader('Content-Type', 'image/*'); // 이미지 종류에 따라 변경

    // 이미지 바이너리 데이터 전송
    res.status(200).end(imageBuffer, 'binary');
  } catch (error) {
    console.error(error);
    res.status(404).end('Image not found');
  }
}

export default handler;
