import { NextResponse } from "next/server"
import { clientPromise } from "@/lib/mongo" // <-- conexión persistente global

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.has("limit")
      ? parseInt(searchParams.get("limit")!)
      : 0 // 0 significa “sin límite” para mongo

    const offset = parseInt(searchParams.get("offset") || "0")
    const rawSearch = searchParams.get("searchTerm") || ""
    const decodedSearch = decodeURIComponent(rawSearch).trim()

    const client = await clientPromise
    const inventoryDb = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const trupperDb = client.db(process.env.TRUPPER_DB_NAME)

    const inventoryCollection = inventoryDb.collection("inventory")
    const productsCollection = trupperDb.collection("products")

    // --- Filtro de búsqueda ---
    const filtro: any = {}
    if (decodedSearch) {
      const safeRegex = new RegExp(decodedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")

      filtro.$or = [
        { descripcion: { $regex: safeRegex } },          // búsqueda en descripcion
        { ean: { $regex: safeRegex } },                  // búsqueda en ean
        { codigo: { $eq: Number(decodedSearch) } },      // búsqueda exacta si es número
        { codigo: { $regex: safeRegex.toString() } }     // fallback (solo si código fuera string)
      ]
    }

    // 1️⃣ Obtener productos filtrados
    const filteredProductCodes =
      decodedSearch.length > 0
        ? (
          await productsCollection
            .find(filtro, { projection: { codigo: 1 } })
            .toArray()
        ).map((p) => p.codigo)
        : []

    // 2️⃣ Filtro de inventario
    const inventoryFilter =
      decodedSearch.length > 0 ? { codigo: { $in: filteredProductCodes } } : {}

    // 3️⃣ Total
    const total = await inventoryCollection.countDocuments(inventoryFilter)

    // 4️⃣ Paginado
    // 4️⃣ Paginado
    const cursor = inventoryCollection.find(inventoryFilter)

    // solo aplicar limit si el usuario lo envió explícitamente
    if (limit > 0) cursor.limit(limit)

    // aplicar offset solo si es mayor a 0
    if (offset > 0) cursor.skip(offset)

    const inventoryDocs = await cursor.toArray()

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


export async function DELETE() {
  try {
    const client = await clientPromise
    const inventoryDb = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const inventoryCollection = inventoryDb.collection("inventory")

    // ⚠️ Elimina todos los documentos del inventario
    const result = await inventoryCollection.deleteMany({})

    return NextResponse.json({
      message: `Inventario eliminado correctamente`
    })
  } catch (error) {
    console.error("❌ Error al eliminar inventario:", error)
    return NextResponse.json({ error: "Error al eliminar inventario" }, { status: 500 })
  }
}
