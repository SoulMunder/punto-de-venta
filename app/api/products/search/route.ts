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

    // Evitar búsquedas vacías o muy cortas
    if (query.trim().length < 1) {
      return NextResponse.json([])
    }

    // Convertir a número para búsqueda exacta
    const numericQuery = Number(query)

    if (isNaN(numericQuery)) {
      // Si no es número → no hay razón para buscar
      return NextResponse.json([])
    }

    const client = await clientPromise
    const db = client.db(process.env.TRUPPER_DB_NAME)

    // Pipeline SOLO buscando por `codigo` numérico
    const pipeline = [
      {
        $match: {
          // Buscar coincidencia exacta o parcial convirtiendo codigo a string
          $or: [
            { codigo: numericQuery }, // coincidencia exacta
            { 
              $expr: { 
                $regexMatch: { 
                  input: { $toString: "$codigo" },
                  regex: query,
                  options: "i"
                }
              }
            }
          ]
        }
      },
      { $sort: { codigo: 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          codigo: 1,
          ean: 1,
          descripcion: 1,
          marca: 1,
          descripcionFamilia: 1,
          precioPublicoConIVA: 1,
          precioDistribuidorConIVA: 1,
          precioMayoreoConIVA: 1,
        }
      }
    ]

    const products = await db.collection("products").aggregate(pipeline).toArray()

    const formatted = products.map((p) => ({
      _id: p._id.toString(),
      codigo: p.codigo,
      ean: p.ean || "",
      descripcion: p.descripcion,
      marca: p.marca || "",
      descripcionFamilia: p.descripcionFamilia || "",
      precioPublicoConIVA: p.precioPublicoConIVA || 0,
      precioDistribuidorConIVA: p.precioDistribuidorConIVA || 0,
      precioMayoreoConIVA: p.precioMayoreoConIVA || 0,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("❌ Error en búsqueda de productos:", error)
    return NextResponse.json(
      { error: "Error al buscar productos" },
      { status: 500 }
    )
  }
}
