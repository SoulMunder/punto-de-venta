import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.SYSTEM_COLLECTION_NAME;

const client = new MongoClient(uri);

let clientPromise: Promise<MongoClient>;

declare global {
  // Evita múltiples conexiones en desarrollo
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export { clientPromise, dbName };
