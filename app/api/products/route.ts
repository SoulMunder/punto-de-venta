import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!
if (!uri) throw new Error("❌ Faltan variables de entorno: MONGODB_URI")

// 🧠 Reutilizar conexión global (para evitar MongoClientClosedError)
let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!(global as any)._mongoClientPromise) {
  client = new MongoClient(uri)
  ;(global as any)._mongoClientPromise = client.connect()
}

clientPromise = (global as any)._mongoClientPromise

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
