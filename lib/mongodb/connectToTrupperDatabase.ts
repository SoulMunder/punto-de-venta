import type { Db } from "mongodb";
import { clientPromise } from "@/lib/mongo";

const TRUPPER_DB_NAME = process.env.TRUPPER_DB_NAME!;

export async function connectToTrupperDatabase(): Promise<Db> {
  const client = await clientPromise;   // usa la conexión global persistente
  const db = client.db(TRUPPER_DB_NAME);

  return db;
}
