import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!
if (!uri) throw new Error("⚠️ Faltan variables de entorno para MongoDB")

// 🔹 Reutilizamos un solo cliente global (no se cierra nunca)
const globalForMongo = global as unknown as { _mongoClientPromise?: Promise<MongoClient> }

let clientPromise: Promise<MongoClient>

if (!globalForMongo._mongoClientPromise) {
  const client = new MongoClient(uri)
  globalForMongo._mongoClientPromise = client.connect()
}

clientPromise = globalForMongo._mongoClientPromise

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")
    const searchTerm = searchParams.get("searchTerm")?.trim() || ""

    const client = await clientPromise

    const inventoryDb = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const trupperDb = client.db(process.env.TRUPPER_DB_NAME)

    const inventoryCollection = inventoryDb.collection("inventory")
    const productsCollection = trupperDb.collection("products")

    // --- Filtro de búsqueda ---
    const productFilter =
      searchTerm.length > 0
        ? {
            $or: [
              { codigo: { $regex: searchTerm, $options: "i" } },
              { descripcion: { $regex: searchTerm, $options: "i" } },
            ],
          }
        : {}

    // 1️⃣ Obtener productos filtrados
    const filteredProductCodes =
      searchTerm.length > 0
        ? (
            await productsCollection
              .find(productFilter, { projection: { codigo: 1 } })
              .toArray()
          ).map((p) => p.codigo)
        : []

    // 2️⃣ Filtro de inventario
    const inventoryFilter =
      searchTerm.length > 0 ? { codigo: { $in: filteredProductCodes } } : {}

    // 3️⃣ Total
    const total = await inventoryCollection.countDocuments(inventoryFilter)

    // 4️⃣ Paginado
    const inventoryDocs = await inventoryCollection
      .find(inventoryFilter)
      .skip(offset)
      .limit(limit)
      .toArray()

    // 5️⃣ Productos relacionados
    const inventoryCodes = inventoryDocs.map((doc) => doc.codigo).filter(Boolean)
    const productsArray = await productsCollection
      .find({ codigo: { $in: inventoryCodes } })
      .toArray()

    const productMap: Record<string, any> = {}
    for (const p of productsArray) productMap[p.codigo] = p

    // 6️⃣ Combinar inventario + producto
    const data = inventoryDocs.map((inv) => ({
      ...inv,
      product: productMap[inv.codigo] || null,
    }))

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error("❌ Error al obtener inventario:", error)
    return NextResponse.json({ error: "Error al obtener inventario" }, { status: 500 })
  }
}
