import { NextApiResponseServerIO } from '@/types/chat';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/db';
import path from 'path';
import { RequestHandler, Request, Response } from 'express';
import formidable from 'formidable';
import fs from 'fs';

// type NextApiRequestWithFormData = NextApiRequest &
//   Request & {
//     files: any[];
//   };

// type NextApiResponseCustom = NextApiResponse &
//   Response &
//   NextApiResponseServerIO;

export const config = {
  api: {
    //next에서는 기본으로 bodyParser가 작동되므로 false로 해준다.
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

    // const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    const uploadsPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath);
    }
    const roomId = req.query.roomId as string;
    const roomFolderPath = path.join(uploadsPath, roomId);
    if (!fs.existsSync(roomFolderPath)) {
      fs.mkdirSync(roomFolderPath);
    }
    // add a new form field with formidable

    let new_filename;
    const now_time = Date.now();
    const readFile = (req: NextApiRequest, saveLocally: boolean = true) => {
      const options: formidable.Options = {};

      if (saveLocally) {
        //true일때 option객체에 path와 filename을 저장
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
          console.log(fields);
          resolve({ fields, files });
        });
      });
    };

    const data = await readFile(req, true);

    // console.log(data.files['image']);

    const completePath = roomFolderPath + '/' + new_filename;
    const relativePath = path.relative(
      // '/Users/teetee6/code_react/kkk_talk/public',
      '/Users/teetee6/code_react/kkk_talk',
      completePath
    );

    console.log(relativePath);

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

/**
 * 

console.log('0');
    // 이미지 업로드를 위한 설정
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        // 'uploads' 폴더가 없으면 생성
        console.log('1');
        const uploadsPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsPath)) {
          fs.mkdirSync(uploadsPath);
        }
        console.log('2');

        // req.query.roomId에 해당하는 폴더 생성
        const roomId = req.query.roomId as string;
        const roomFolderPath = path.join(uploadsPath, roomId);
        if (!fs.existsSync(roomFolderPath)) {
          fs.mkdirSync(roomFolderPath);
        }
        console.log('roomFolderPath', roomFolderPath);

        // 파일을 해당 폴더로 저장
        cb(null, roomFolderPath);
      },
      filename: (req, file, cb) => {
        console.log('4');

        cb(null, Date.now() + '-' + file.originalname);
      },
    });

    const upload = multer({ storage }).single('image');

    console.log('upload: ', upload);

    upload(req, res, async (err) => {
      res.status(200).json({ message: 'OK' });

      try {
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading image' });
      }
    });

 * 
 */

// const mongoUri = 'mongodb://localhost:27017';
// const dbName = 'mydatabase';
// const client = await connectToDatabase();
// const db = client.db(dbName);
// // 이미지 메타데이터 저장
// const imageMeta = {
//   filename: req.file!.filename,
//   originalname: req.file!.originalname,
//   mimetype: req.file!.mimetype,
//   roomId: req.query.roomId,
// };
// const result = await db.collection('images').insertOne(imageMeta);
// res.status(200).json({
//   message: 'Image uploaded and metadata stored',
//   imageId: result.insertedId,
// });
