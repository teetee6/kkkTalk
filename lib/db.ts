import { MongoClient } from 'mongodb';

let cachedClient: MongoClient | null = null;

const deployment_addr = `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PASSWORD}@cluster0.ns4kyuj.mongodb.net/${process.env.MONGODB_DBNAME}?retryWrites=true&w=majority`;
const development_addr = `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PASSWORD}@atlascluster.whlisy6.mongodb.net/${process.env.MONGODB_DBNAME}?retryWrites=true&w=majority`;

export async function connectToDatabase(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(deployment_addr, {
    maxPoolSize: 10,
  });

  cachedClient = await client.connect();
  return cachedClient;
}
