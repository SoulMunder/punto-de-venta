import { NextResponse } from "next/server"
import { clientPromise } from "@/lib/mongo"
import type { OwnProductForm } from "@/lib/types"
import { ObjectId } from "mongodb"


// ---------------- PUT ----------------
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const collection = db.collection("own_products")

    const { id } = params
    const data = (await req.json()) as OwnProductForm

    // Validar campos obligatorios
    if (!data.descripcion || !data.precio) {
      return NextResponse.json(
        { error: "Descripción y precio son obligatorios" },
        { status: 400 }
      )
    }

    // Validar código (si existe) como máximo 4 dígitos
    let codigoNumber: number | null = null
    if (data.codigo !== undefined && data.codigo !== null) {
      codigoNumber = Number(data.codigo)
      if (!Number.isInteger(codigoNumber) || codigoNumber > 9999 || codigoNumber < 0) {
        return NextResponse.json(
          { error: "El código debe ser un número entero de máximo 4 dígitos" },
          { status: 400 }
        )
      }
    }

    // Limpiar datos vacíos
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (typeof value === "string" && value.trim() === "") return [key, null]
        return [key, value]
      })
    ) as OwnProductForm & { imageFile?: string | null }

    // Construir campos de actualización
    const updateFields: any = {
      descripcion: cleanData.descripcion!,
      precio: Number(cleanData.precio),
      codigo: codigoNumber,
      clave: cleanData.clave ?? null,
      unidad: cleanData.unidad ?? "Pieza",
      marca: cleanData.marca ?? null,
      codigoSAT: cleanData.codigoSAT ?? null,
      descripcionSAT: cleanData.descripcionSAT ?? null,
      familia: cleanData.familia ?? null,
      descripcionFamilia: cleanData.descripcionFamilia ?? null,
    }

    // ✅ Solo actualizar imageUrl si el usuario subió o quitó la imagen
    if ("imageFile" in cleanData) {
      updateFields.imageUrl = cleanData.imageFile // puede ser URL o null si se borró
    }

    const updateResult = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Producto actualizado correctamente" })
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error)
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  }
}


// ---------------- DELETE ----------------
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const collection = db.collection("own_products")

    const { id } = params

    const deleteResult = await collection.deleteOne({ _id: new ObjectId(id) })

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Producto eliminado correctamente" })
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error)
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
  }
}