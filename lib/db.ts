import { MongoClient } from 'mongodb';

const mongodb_info = {
  id: 'teetee6',
  password: 'BFQecQFLw09si1GZ',
  dbName: 'auth-dev',
};

let cachedClient: MongoClient | null = null;

export async function connectToDatabase(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(
    `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PASSWORD}@atlascluster.whlisy6.mongodb.net/${process.env.MONGODB_DBNAME}?retryWrites=true&w=majority`,
    {
      maxPoolSize: 10, // 연결 풀의 크기를 조절합니다. 필요에 따라 조절하세요.
    }
  );

  cachedClient = await client.connect();
  return cachedClient;
}
