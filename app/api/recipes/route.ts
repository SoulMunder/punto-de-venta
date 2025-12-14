import { NextResponse } from "next/server"
import type { RecipeForm, RecipeLog } from "@/lib/types"
import { clientPromise } from "@/lib/mongo"

export async function GET(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const collection = db.collection<RecipeForm>("recipes")

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "0")
    const offset = parseInt(searchParams.get("offset") || "0")
    const rawSearch = searchParams.get("searchTerm") || ""
    const searchTerm = decodeURIComponent(rawSearch).trim()

    const filter: Partial<RecipeForm> = {}
    if (searchTerm) {
      filter.nombreReceta = { $regex: new RegExp(searchTerm, "i") } as any
    }

    const total = await collection.countDocuments(filter)
    let cursor = collection.find(filter)
    if (limit > 0) cursor = cursor.limit(limit)
    if (offset > 0) cursor = cursor.skip(offset)

    const data = await cursor.toArray()
    return NextResponse.json({ data, total })
  } catch (error) {
    console.error("❌ Error al obtener recetas:", error)
    return NextResponse.json({ error: "Error al obtener recetas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const recipesCollection = db.collection<RecipeForm>("recipes")
    const logsCollection = db.collection<RecipeLog>("recipe_logs")

    // Leer receta y usuario del body
    const { user, ...recipe } = await request.json() as RecipeForm & { user?: string }

    // Validar campos obligatorios
    if (
      !recipe.nombreReceta ||
      !recipe.codigoPadre ||
      !recipe.cantidadPadre ||
      !recipe.codigoHijo ||
      !recipe.cantidadHijo
    ) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      )
    }

    // Insertar receta
    const result = await recipesCollection.insertOne(recipe)

    // Insertar log tipado con el usuario y el nombre de la receta
    const log: RecipeLog = {
      action: "CREATE",
      user: user || "desconocido",
      recipeName: recipe.nombreReceta, // <- guardamos el nombre
      createdAt: new Date()
    }
    await logsCollection.insertOne(log)
    
    return NextResponse.json({ _id: result.insertedId, ...recipe })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear receta" }, { status: 500 })
  }
}
