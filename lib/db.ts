import { MongoClient } from 'mongodb';

let cachedClient: MongoClient | null = null;

export async function connectToDatabase(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(
    `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PASSWORD}@atlascluster.whlisy6.mongodb.net/${process.env.MONGODB_DBNAME}?retryWrites=true&w=majority`,
    {
      maxPoolSize: 10,
    }
  );

  cachedClient = await client.connect();
  return cachedClient;
}
