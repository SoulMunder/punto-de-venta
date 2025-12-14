import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)

let clientPromise: Promise<MongoClient>
if (!global._mongoClientPromise) {
  global._mongoClientPromise = client.connect()
}
clientPromise = global._mongoClientPromise

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.has("limit") ? parseInt(searchParams.get("limit")!) : 0
    const offset = parseInt(searchParams.get("offset") || "0")
    const rawSearch = searchParams.get("searchTerm") || ""
    const decodedSearch = decodeURIComponent(rawSearch).trim()

    const client = await clientPromise
    const inventoryDb = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const trupperDb = client.db(process.env.TRUPPER_DB_NAME)

    const inventoryCollection = inventoryDb.collection("inventory")
    const trupperProducts = trupperDb.collection("products")
    const ownProducts = inventoryDb.collection("own_products")

    // 🚀 SIN BÚSQUEDA: Query directo
    if (!decodedSearch) {
      const [inventoryDocs, total] = await Promise.all([
        inventoryCollection
          .find({})
          .skip(offset)
          .limit(limit > 0 ? limit : 0)
          .toArray(),
        inventoryCollection.countDocuments({})
      ])

      const inventoryCodes = inventoryDocs.map(doc => doc.codigo).filter(Boolean)
      
      const [productsArrayTrupper, productsArrayOwn] = await Promise.all([
        trupperProducts.find({ codigo: { $in: inventoryCodes } }).toArray(),
        ownProducts.find({ codigo: { $in: inventoryCodes } }).toArray()
      ])

      const productMap: Record<string, any> = {}
      productsArrayTrupper.forEach(p => productMap[p.codigo] = { ...p, isOwnProduct: false })
      productsArrayOwn.forEach(p => productMap[p.codigo] = { ...p, isOwnProduct: true })

      const data = inventoryDocs.map(inv => ({
        ...inv,
        product: productMap[inv.codigo] || null
      }))

      return NextResponse.json({ data, total })
    }

    // 🔍 CON BÚSQUEDA OPTIMIZADA
    const isNumeric = /^\d+$/.test(decodedSearch)
    
    // ⚡ BÚSQUEDA POR CÓDIGO (más rápida)
    if (isNumeric) {
      const numericCode = Number(decodedSearch)
      
      const [inventoryDocs, total] = await Promise.all([
        inventoryCollection
          .find({ codigo: numericCode })
          .skip(offset)
          .limit(limit > 0 ? limit : 0)
          .toArray(),
        inventoryCollection.countDocuments({ codigo: numericCode })
      ])

      if (inventoryDocs.length > 0) {
        const [productsArrayTrupper, productsArrayOwn] = await Promise.all([
          trupperProducts.find({ codigo: numericCode }).toArray(),
          ownProducts.find({ codigo: numericCode }).toArray()
        ])

        const productMap: Record<string, any> = {}
        productsArrayTrupper.forEach(p => productMap[p.codigo] = { ...p, isOwnProduct: false })
        productsArrayOwn.forEach(p => productMap[p.codigo] = { ...p, isOwnProduct: true })

        const data = inventoryDocs.map(inv => ({
          ...inv,
          product: productMap[inv.codigo] || null
        }))

        return NextResponse.json({ data, total })
      }
    }

    // 📝 BÚSQUEDA POR TEXTO (usando regex optimizado)
    const safeRegex = new RegExp(
      "^" + decodedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    )

    const filtro: any = {
      $or: [
        { descripcion: { $regex: safeRegex } },
        { ean: { $regex: safeRegex } },
        { codigo: { $regex: safeRegex } }
      ]
    }

    // Buscar códigos en paralelo (con límite para evitar sobrecarga)
    const [trupperArray, ownArray] = await Promise.all([
      trupperProducts.find(filtro, { 
        projection: { codigo: 1 },
        limit: 1000 // Limitar resultados
      }).toArray(),
      ownProducts.find(filtro, { 
        projection: { codigo: 1 },
        limit: 1000
      }).toArray()
    ])

    const allProductCodes = [
      ...new Set([
        ...trupperArray.map(p => p.codigo),
        ...ownArray.map(p => p.codigo)
      ])
    ]

    if (allProductCodes.length === 0) {
      return NextResponse.json({ data: [], total: 0 })
    }

    // Filtrar inventario
    const inventoryFilter = { codigo: { $in: allProductCodes } }

    const [inventoryDocs, total] = await Promise.all([
      inventoryCollection
        .find(inventoryFilter)
        .skip(offset)
        .limit(limit > 0 ? limit : 0)
        .toArray(),
      inventoryCollection.countDocuments(inventoryFilter)
    ])

    // Traer productos relacionados
    const inventoryCodes = inventoryDocs.map(doc => doc.codigo).filter(Boolean)

    const [productsArrayTrupper, productsArrayOwn] = await Promise.all([
      trupperProducts.find({ codigo: { $in: inventoryCodes } }).toArray(),
      ownProducts.find({ codigo: { $in: inventoryCodes } }).toArray()
    ])

    const productMap: Record<string, any> = {}
    productsArrayTrupper.forEach(p => productMap[p.codigo] = { ...p, isOwnProduct: false })
    productsArrayOwn.forEach(p => productMap[p.codigo] = { ...p, isOwnProduct: true })

    const data = inventoryDocs.map(inv => ({
      ...inv,
      product: productMap[inv.codigo] || null
    }))

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error("❌ Error al obtener inventario:", error)
    return NextResponse.json(
      { error: "Error al obtener inventario" },
      { status: 500 }
    )
  }
}
{/*

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

*/}