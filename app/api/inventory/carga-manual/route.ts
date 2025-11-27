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
    const { codigo, cantidad, branch, createdBy } = await req.json()

    if (!codigo || !cantidad || !branch) {
      return NextResponse.json(
        { error: "Código, cantidad y sucursal son obligatorios" },
        { status: 400 }
      )
    }

    const mongoClient = await clientPromise
    const trupperDB = mongoClient.db(process.env.TRUPPER_DB_NAME)
    const systemDB = mongoClient.db(process.env.SYSTEM_COLLECTION_NAME)

    // 🔍 Buscar producto
    const producto = await trupperDB
      .collection("products")
      .findOne({ codigo: Number(codigo) })

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // 🔄 Actualizar o crear inventario
    const result = await systemDB.collection("inventory").updateOne(
      { codigo: Number(codigo), branch },
      {
        $inc: { cantidad: Number(cantidad) },
        $set: { updatedAt: new Date() },
        $setOnInsert: {
          _id: new ObjectId(),
          createdAt: new Date(),
          branch,
        },
      },
      { upsert: true }
    )

    // 📌 Registrar movimiento en la colección logs
    await systemDB.collection("inventory_logs").insertOne({
      _id: new ObjectId(),
      codigo: Number(codigo),
      cantidad: Number(cantidad),
      tipo: "Entrada",                 // entrada al inventario
      motivo: "Compra de carga manual",    // motivo predefinido
      createdAt: new Date(),
      createdBy: createdBy,   // 👈 AQUI guardas al usuario real
    })

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
