import { NextResponse } from "next/server"
import type { RecipeLog } from "@/lib/types"
import { clientPromise } from "@/lib/mongo"

export async function GET(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const collection = db.collection<RecipeLog>("recipe_logs")

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "0")
    const offset = parseInt(searchParams.get("offset") || "0")
    const rawSearch = searchParams.get("searchTerm") || ""
    const searchTerm = decodeURIComponent(rawSearch).trim()

    const filter: any = {}

    // Buscar por nombre de receta o usuario
    if (searchTerm) {
      filter.$or = [
        { recipeName: { $regex: new RegExp(searchTerm, "i") } },
        { user: { $regex: new RegExp(searchTerm, "i") } },
        { action: { $regex: new RegExp(searchTerm, "i") } },
      ]
    }

    const total = await collection.countDocuments(filter)

    let cursor = collection
      .find(filter)
      .sort({ createdAt: -1 }) // logs más recientes primero

    if (limit > 0) cursor = cursor.limit(limit)
    if (offset > 0) cursor = cursor.skip(offset)

    const data = await cursor.toArray()

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error("❌ Error al obtener logs de recetas:", error)
    return NextResponse.json(
      { error: "Error al obtener logs de recetas" },
      { status: 500 }
    )
  }
}
