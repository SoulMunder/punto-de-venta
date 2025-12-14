import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { clientPromise } from "@/lib/mongo"
import { authOptions } from "@/lib/auth/config"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "5")

    if (query.trim().length < 1) {
      return NextResponse.json([])
    }

    const numericQuery = Number(query)
    if (isNaN(numericQuery)) {
      return NextResponse.json([])
    }

    const client = await clientPromise

    // ===== DBs =====
    const trupperDB = client.db(process.env.TRUPPER_DB_NAME)
    const systemDB = client.db(process.env.SYSTEM_COLLECTION_NAME)

    // ===== PIPELINE BASE =====
    const baseMatch = {
      $or: [
        { codigo: numericQuery },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$codigo" },
              regex: query,
              options: "i",
            },
          },
        },
      ],
    }

    // ===== TRUPPER PRODUCTS =====
    const trupperProducts = await trupperDB
      .collection("products")
      .aggregate([
        { $match: baseMatch },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            codigo: 1,
            descripcion: 1,
            marca: 1,
            precioPublicoConIVA: 1,
            source: { $literal: "TRUPPER" },
          },
        },
      ])
      .toArray()

    // ===== OWN PRODUCTS =====
    const ownProducts = await systemDB
      .collection("own_products")
      .aggregate([
        { $match: baseMatch },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            codigo: 1,
            descripcion: 1,
            marca: 1,
            precio: 1,
            source: { $literal: "OWN" },
          },
        },
      ])
      .toArray()

    // ===== UNIR + ORDENAR + LIMITAR =====
    const combined = [...trupperProducts, ...ownProducts]
      .sort((a, b) => a.codigo - b.codigo)
      .slice(0, limit)
      .map((p) => ({
        ...p,
        _id: p._id.toString(),
      }))

    return NextResponse.json(combined)
  } catch (error) {
    console.error("❌ Error en búsqueda:", error)
    return NextResponse.json(
      { error: "Error al buscar productos" },
      { status: 500 }
    )
  }
}

