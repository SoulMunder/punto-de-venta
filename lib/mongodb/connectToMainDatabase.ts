import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const SYSTEM_COLLECTION_NAME = process.env.SYSTEM_COLLECTION_NAME!;

let cachedDb: Db | null = null;

export async function connectToMainDatabase(): Promise<Db> {
    if (cachedDb && cachedDb.databaseName === SYSTEM_COLLECTION_NAME) {
        return cachedDb;
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(SYSTEM_COLLECTION_NAME);
    cachedDb = db;
    console.log(`Conectado a MongoDB: ${db.databaseName}`);
    return db;
}