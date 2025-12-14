import { NextResponse } from "next/server"
import { clientPromise } from "@/lib/mongo"
import type { OwnProduct, OwnProductForm } from "@/lib/types"
import { Filter } from "mongodb"

// ==================== POST ====================
export async function POST(req: Request) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const collection = db.collection("own_products")

    const data = (await req.json()) as OwnProductForm

    if (!data.descripcion || !data.precio) {
      return NextResponse.json(
        { error: "Descripción y precio son obligatorios" },
        { status: 400 }
      )
    }

    let codigoNumber: number | null = null
    if (data.codigo !== undefined && data.codigo !== null) {
      codigoNumber = Number(data.codigo)
      if (!Number.isInteger(codigoNumber) || codigoNumber < 0 || codigoNumber > 9999) {
        return NextResponse.json(
          { error: "El código debe ser un número entero de máximo 4 dígitos" },
          { status: 400 }
        )
      }
    }

    const cleanData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => {
        if (typeof v === "string" && v.trim() === "") return [k, null]
        return [k, v]
      })
    ) as OwnProductForm & { imageFile?: string | null }

    const ean = crypto.randomUUID().replace(/-/g, "").slice(0, 13)

    const productToInsert = {
      descripcion: cleanData.descripcion!,
      precio: Number(cleanData.precio),
      ean,
      codigo: codigoNumber,
      clave: cleanData.clave ?? null,
      unidad: cleanData.unidad ?? "Pieza",
      marca: cleanData.marca ?? null,
      codigoSAT: cleanData.codigoSAT ?? null,
      descripcionSAT: cleanData.descripcionSAT ?? null,
      familia: cleanData.familia ?? null,
      descripcionFamilia: cleanData.descripcionFamilia ?? null,
      imageUrl: cleanData.imageFile ?? null,
      createdAt: new Date(),
    }

    const result = await collection.insertOne(productToInsert)

    const product: OwnProduct = {
      ...productToInsert,
      _id: result.insertedId.toString(),
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("❌ Error al crear producto:", error)
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}

// ==================== GET (OPTIMIZADO REAL) ====================


export async function GET(req: Request) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const collection = db.collection("own_products")

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("searchTerm")?.trim() || ""
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100)
    const offset = Number(searchParams.get("offset") || 0)

    let filter: Filter<any> = {}

    if (search) {
      const isNumeric = /^\d+$/.test(search)

      if (isNumeric) {
        // Búsqueda exacta en campos numéricos (usa índices)
        filter.$or = [
          { codigo: Number(search) },
          { ean: search }
        ]
      } else {
        // Búsqueda case-insensitive con regex optimizado
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
        
        filter.$or = [
          { descripcion: regex },
          { marca: regex },
          { clave: regex },
          { descripcionFamilia: regex }
        ]
      }
    }

    // Ejecutar consultas en paralelo
    const [products, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 }) // Más recientes primero
        .skip(offset)
        .limit(limit)
        .toArray(),

      collection.countDocuments(filter)
    ])

    const formatted = products.map(p => ({
      ...p,
      _id: p._id.toString()
    }))

    return NextResponse.json({
      products: formatted,
      total
    })
  } catch (error) {
    console.error("❌ Error GET own_products:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}