import { NextApiRequest, NextApiResponse } from 'next';
import { hashPassword } from '../../../lib/auth';
import { connectToDatabase } from '../../../lib/db';
import path from 'path';
import fs from 'fs';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return;
  }

  const data = req.body;

  const { email, password } = data;

  if (
    !email ||
    !email.includes('@') ||
    !password ||
    password.trim().length < 7
  ) {
    res.status(422).json({
      message:
        'Invalid input - password should also be at least 7 characters long.',
    });
    return;
  }

  const client = await connectToDatabase();

  const db = client.db();

  const existingUser = await db.collection('users').findOne({ email: email });

  if (existingUser) {
    res.status(422).json({ message: 'User exists already!' });
    return;
  }

  const hashedPassword = await hashPassword(password);

  // 유저 이미지 생성
  const result = await db.collection('users').insertOne({
    email: email,
    password: hashedPassword,
  });

  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
  }
  const roomFolderPath = path.join(uploadsPath, String(result.insertedId));
  if (!fs.existsSync(roomFolderPath)) {
    fs.mkdirSync(roomFolderPath);
  }

  // 프로젝트폴더/public/assets/user.png 파일을 프로젝트폴더/uploads/유저아이디/user.png 로 복사
  const src = path.join(process.cwd(), 'public', 'assets', 'user.png');
  const dest = path.join(roomFolderPath, 'user.png');
  fs.copyFileSync(src, dest);

  await db.collection('profiles').insertOne({
    userId: email,
    image: `uploads/${String(result.insertedId)}/user.png`,
  });

  res.status(201).json({ message: 'Created user!' });
}

export default handler;
