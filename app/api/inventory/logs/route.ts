// app/api/inventoryLogs/route.ts
import { NextResponse } from "next/server";
import { clientPromise, dbName } from "@/lib/mongo";

export async function GET() {
  try {
    const client = await clientPromise;
    const inventoryDb = client.db(dbName);
    const collection = inventoryDb.collection("inventory_logs");

    // Trae todos los documentos tal cual están en la base de datos
    const logs = await collection.find({}).toArray();

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching inventory logs:", error);
    return NextResponse.json({ error: "Error fetching logs" }, { status: 500 });
  }
}
