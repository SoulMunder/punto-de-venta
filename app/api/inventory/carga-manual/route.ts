import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)

let clientPromise: Promise<MongoClient>

if (!global._mongoClientPromise) {
  global._mongoClientPromise = client.connect()
}

clientPromise = global._mongoClientPromise

export async function POST(req: Request) {
  try {
    const { codigo, cantidad, branch } = await req.json() // <-- recibimos branch

    if (!codigo || !cantidad || !branch) {
      return NextResponse.json(
        { error: "Código, cantidad y sucursal son obligatorios" },
        { status: 400 }
      )
    }

    // ✅ Usa conexión persistente
    const mongoClient = await clientPromise
    const trupperDB = mongoClient.db(process.env.TRUPPER_DB_NAME)
    const systemDB = mongoClient.db(process.env.SYSTEM_COLLECTION_NAME)

    // 🔍 Buscar producto por código
    const producto = await trupperDB
      .collection("products")
      .findOne({ codigo: Number(codigo) })

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // 🧮 Actualizar inventario existente o crear uno nuevo
    const result = await systemDB.collection("inventory").updateOne(
      { codigo: Number(codigo), branch }, // <-- filtro incluye branch
      {
        $inc: { cantidad: Number(cantidad) },
        $set: { updatedAt: new Date() },
        $setOnInsert: {
          _id: new ObjectId(),
          createdAt: new Date(),
          branch, // <-- guardamos la sucursal
        },
      },
      { upsert: true }
    )

    return NextResponse.json({
      message: result.upsertedCount
        ? "Producto agregado por primera vez al inventario"
        : "Stock actualizado correctamente",
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId,
    })
  } catch (error) {
    console.error("❌ Error al agregar al inventario:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
