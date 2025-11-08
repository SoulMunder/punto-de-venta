import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI!
if (!uri) throw new Error("❌ Faltan variables de entorno: MONGODB_URI")

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!(global as any)._mongoClientPromise) {
  client = new MongoClient(uri)
  ;(global as any)._mongoClientPromise = client.connect()
}

clientPromise = (global as any)._mongoClientPromise

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  console.log("🔹 PUT recibido para ID:", params.id); // ✅ imprime el id recibido

  try {
    const client = await clientPromise
    const db = client.db(process.env.TRUPPER_DB_NAME)
    const collection = db.collection("products")

    const data = await req.json()
    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: data }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ ...data, id: params.id })
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error)
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  console.log("🔹 DELETE recibido para ID:", params.id)

  try {
    const client = await clientPromise
    const db = client.db(process.env.TRUPPER_DB_NAME)
    const collection = db.collection("products")

    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Producto eliminado", id: params.id })
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error)
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
  }
}