import { NextResponse } from "next/server"
import { clientPromise } from "@/lib/mongo"
import { ObjectId } from "mongodb"
import type { RecipeLog } from "@/lib/types"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const recipeId = params.id

  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const recipesCol = db.collection("recipes")
    const inventoryCol = db.collection("inventory")
    const logsCol = db.collection<RecipeLog>("recipe_logs")

    // Leer user desde el body
    const { user } = await request.json() as { user?: string }

    // Buscar la receta
    const recipe = await recipesCol.findOne({ _id: new ObjectId(recipeId) })
    if (!recipe) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 })
    }

    // Buscar productos en inventario
    const parentProduct = await inventoryCol.findOne({ codigo: recipe.codigoPadre })

    if (!parentProduct) {
      return NextResponse.json({ error: `Producto Padre con código ${recipe.codigoPadre} no encontrado en inventario` }, { status: 400 })
    }

    // Validar stock suficiente del Padre
    if (parentProduct.cantidad < recipe.cantidadPadre) {
      return NextResponse.json({
        error: `Stock insuficiente del Producto Padre (${recipe.codigoPadre}). Disponible: ${parentProduct.cantidad}, requerido: ${recipe.cantidadPadre}`
      }, { status: 400 })
    }

    // Actualizar inventario
    await inventoryCol.updateOne(
      { codigo: recipe.codigoPadre },
      { $inc: { cantidad: -recipe.cantidadPadre } }
    )

    await inventoryCol.updateOne(
      { codigo: recipe.codigoHijo },
      { $inc: { cantidad: recipe.cantidadHijo } }
    )

    // 🔹 Crear log tipado
    const log: RecipeLog = {
      action: "APPLY",
      user: user || "desconocido",
      recipeName: recipe.nombreReceta,
      createdAt: new Date()
    }

    await logsCol.insertOne(log)

    return NextResponse.json({ message: `Receta "${recipe.nombreReceta}" aplicada correctamente` })

  } catch (error) {
    console.error("Error aplicando receta:", error)
    return NextResponse.json({ error: "Error al aplicar receta" }, { status: 500 })
  }
}
