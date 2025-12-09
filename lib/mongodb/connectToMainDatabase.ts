import type { Db } from "mongodb";
import { clientPromise } from "@/lib/mongo";

const dbName = process.env.SYSTEM_COLLECTION_NAME!;

export async function connectToMainDatabase(): Promise<Db> {
  const client = await clientPromise;   // <- conexión global persistente
  const db = client.db(dbName);

  return db;
}
