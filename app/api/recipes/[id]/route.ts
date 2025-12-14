import { NextResponse } from "next/server"
import type { RecipeForm, RecipeLog } from "@/lib/types"
import { clientPromise } from "@/lib/mongo"
import { ObjectId } from "mongodb"

// ---------------- PUT ----------------
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const collection = db.collection<RecipeForm>("recipes")

    const { id } = params
    const { user, ...data } = await req.json() as RecipeForm & { user?: string }

    // Validar campos obligatorios
    if (
      !data.nombreReceta ||
      !data.codigoPadre ||
      !data.cantidadPadre ||
      !data.codigoHijo ||
      !data.cantidadHijo
    ) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      )
    }

    // Actualizar la receta
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      )
    }

    // Guardar log de actualización con nombre de la receta y usuario
    const log: RecipeLog = {
      action: "UPDATE",
      user: user || "desconocido",
      recipeName: data.nombreReceta,
      createdAt: new Date()
    }
    await db.collection<RecipeLog>("recipe_logs").insertOne(log)

    return NextResponse.json({ message: "Receta actualizada correctamente" })
  } catch (error) {
    console.error("❌ Error al actualizar receta:", error)
    return NextResponse.json(
      { error: "Error al actualizar receta" },
      { status: 500 }
    )
  }
}

// ---------------- DELETE ----------------
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const collection = db.collection("recipes")

    const { id } = params

    // Leer el user desde el body
    const { user } = await req.json() as { user?: string }

    // Buscar la receta antes de eliminar para guardar el nombre en el log
    const recipeToDelete = await collection.findOne({ _id: new ObjectId(id) })
    if (!recipeToDelete) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 })
    }

    // Eliminar la receta
    const deleteResult = await collection.deleteOne({ _id: new ObjectId(id) })
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 })
    }

    // Crear log tipado conforme a RecipeLog
    const log: RecipeLog = {
      action: "DELETE",
      user: user || "desconocido",
      recipeName: recipeToDelete.nombreReceta,
      createdAt: new Date(),
    }

    await db.collection<RecipeLog>("recipe_logs").insertOne(log)

    return NextResponse.json({ message: "Receta eliminada correctamente" })
  } catch (error) {
    console.error("❌ Error al eliminar receta:", error)
    return NextResponse.json({ error: "Error al eliminar receta" }, { status: 500 })
  }
}
