import { NextResponse } from "next/server"
import { clientPromise } from "@/lib/mongo" // <-- conexión persistente

// ---------------- GET ----------------
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(process.env.TRUPPER_DB_NAME)
    const collection = db.collection("products")

    const products = await collection.find({}).toArray()

    const formatted = products.map((p) => ({
      ...p,
      id: p._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("❌ Error al obtener productos:", error)
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
  }
}

// ---------------- POST ----------------
export async function POST(req: Request) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.TRUPPER_DB_NAME)
    const collection = db.collection("products")

    const data = await req.json()
    const result = await collection.insertOne(data)

    return NextResponse.json({ ...data, id: result.insertedId.toString() })
  } catch (error) {
    console.error("❌ Error al crear producto:", error)
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}
