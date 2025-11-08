import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const TRUPPER_DB_NAME = process.env.TRUPPER_DB_NAME!;

let cachedDb: Db | null = null;

export async function connectToTrupperDatabase(): Promise<Db> {
    if (cachedDb && cachedDb.databaseName === TRUPPER_DB_NAME) {
        return cachedDb;
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(TRUPPER_DB_NAME);
    cachedDb = db;
    console.log(`Conectado a MongoDB: ${db.databaseName}`);
    return db;
}