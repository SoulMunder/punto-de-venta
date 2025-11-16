import { NextResponse } from "next/server"
import { clientPromise } from "@/lib/mongo" // <-- conexión global reutilizable

export async function GET() {
  try {
    const client = await clientPromise
    const systemDB = client.db(process.env.SYSTEM_COLLECTION_NAME) // ✅ usar la db del sistema
    const collection = systemDB.collection("branches") // colección branches

    // Obtener todos los documentos
    const branches = await collection.find({}).toArray()

    // Convertir ObjectId a string
    const formatted = branches.map(b => ({
      ...b,
      id: b._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("❌ Error al obtener branches:", error)
    return NextResponse.json({ error: "Error al obtener branches" }, { status: 500 })
  }
}
