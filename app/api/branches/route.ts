import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

// --- Conexión a MongoDB ---
const client = new MongoClient(process.env.MONGODB_URI!)

export async function GET() {
  try {
    await client.connect()
    const db = client.db("punto-venta-trupper-system")
    const collection = db.collection("branches") // colección branches

    // Obtener todos los documentos sin ordenar
    const branches = await collection.find({}).toArray()

    // Convertir ObjectId a string
    const formatted = branches.map(b => ({
      ...b,
      id: b._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error al obtener branches:", error)
    return NextResponse.json({ error: "Error al obtener branches" }, { status: 500 })
  } finally {
    await client.close()
  }
}
