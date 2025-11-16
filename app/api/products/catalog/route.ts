// app/api/catalog/actions/route.ts
import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { MongoClient, Filter, Document } from "mongodb"
import Papa from "papaparse"
import iconv from "iconv-lite"

// --- Declaración global para la promesa compartida ---
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

// --- Conexión a MongoDB usando MONGODB_URI del .env.local ---
const client = new MongoClient(process.env.MONGODB_URI!)
if (!globalThis._mongoClientPromise) {
  globalThis._mongoClientPromise = client.connect()
}
const clientPromise = globalThis._mongoClientPromise

// --- Funciones auxiliares ---
function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function toCamelCaseNoAccents(str: string) {
  const cleaned = removeAccents(str)
  return cleaned
    .trim()
    .replace(/\s+(\w)/g, (_, c) => c.toUpperCase())
    .replace(/\s/g, "")
    .replace(/^./, c => c.toLowerCase())
}

// --- Tipado para productos ---
interface Product {
  descripcion: string
  marca?: string
  descripcionFamilia?: string
  clave?: string
  ean?: string
  precioDistribuidorConIVA?: number
  precioPublicoConIVA?: number
  precioMayoreoConIVA?: number
  image_url?: string
  [key: string]: any
}

// --- GET: obtener productos ---
export async function GET(req: Request) {
  try {
    const dbClient = await clientPromise
    const db = dbClient.db(process.env.TRUPPER_DB_NAME)

    const { searchParams } = new URL(req.url)
    const rawSearch = searchParams.get("searchTerm") || ""
    const decodedSearch = decodeURIComponent(rawSearch).trim().toLowerCase()
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    const filtro: Filter<Document> = {}
    if (decodedSearch) {
      const safeRegex = new RegExp(
        decodedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      )

      filtro.$or = [
        { descripcion: { $regex: safeRegex } },
        { ean: { $regex: safeRegex } },
        { codigo: { $eq: Number(decodedSearch) } },     // búsqueda exacta si es número
        { codigo: { $regex: safeRegex.toString() } }    // fallback si fuera string
      ]

    }


    const total = await db.collection("products").countDocuments(filtro)
    const products = await db
      .collection<Product>("products")
      .find(filtro)
      .skip(offset)
      .limit(limit)
      .toArray()

    return NextResponse.json({ products, total })
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}

// --- POST: subir archivo Excel o CSV ---
export async function POST(req: NextRequest) {
  try {
    const dbClient = await clientPromise
    const db = dbClient.db(process.env.TRUPPER_DB_NAME)
    const collection = db.collection("products")

    const formData = await req.formData()
    const file = formData.get("archivo") as File
    if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })

    const fileName = file.name.toLowerCase()
    let products: Record<string, any>[] = []

    const numericFields = [
      'precio', 'precioMinimoDeVenta', 'precioMayoreoConIVA',
      'precioDistribuidorConIVA', 'precioPublicoConIVA',
      'precioMayoreoSinIVA', 'precioDistribuidorSinIVA',
      'precioPublicoSinIVA', 'precioMedioMayoreoSinIVA',
      'precioMedioMayoreoConIVA', 'caja', 'master',
      'altaRotacion', 'pesoKg', 'volumenCm3', 'codigo'
    ]

    const convertToNumber = (value: any) => {
      if (value === null || value === undefined || value === '') return null
      const num = Number(value)
      return isNaN(num) ? value : num
    }

    const processProducts = (arr: Record<string, any>[]) => {
      return arr.map(product => {
        const processed: Record<string, any> = {}
        Object.keys(product).forEach(key => {
          let newKey = key
          if (key === 'peso[Kg]') newKey = 'pesoKg'
          if (key === 'volumen[cm3]') newKey = 'volumenCm3'
          processed[newKey] = numericFields.includes(newKey) ? convertToNumber(product[key]) : product[key]
        })
        return processed
      })
    }

    if (fileName.endsWith(".csv")) {
      const buffer = await file.arrayBuffer()
      const text = iconv.decode(Buffer.from(buffer), "windows-1252")
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
      const data = parsed.data as Record<string, any>[]
      if (!data.length) return NextResponse.json({ error: "El CSV no contiene datos" }, { status: 400 })

      const headers = Object.keys(data[0]).map(h => toCamelCaseNoAccents(h))
      const rawProducts = data.map(row => {
        const obj: Record<string, any> = {}
        headers.forEach((key, i) => {
          const originalKey = Object.keys(row)[i]
          obj[key] = row[originalKey] ?? null
        })
        return obj
      })
      products = processProducts(rawProducts)
    } else {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      if (rawData.length < 2) return NextResponse.json({ error: "El Excel no contiene datos" }, { status: 400 })

      const headers = rawData[0].map(cell => toCamelCaseNoAccents(String(cell)))
      const rawProducts = rawData.slice(1).map(row => {
        const obj: Record<string, any> = {}
        headers.forEach((key, i) => obj[key] = row[i] ?? null)
        return obj
      })
      products = processProducts(rawProducts)
    }

    if (products.length > 0) await collection.insertMany(products)

    return NextResponse.json({ message: `${products.length} productos agregados correctamente` })
  } catch (error) {
    console.error("Error al procesar el archivo:", error)
    return NextResponse.json({ error: "Error al procesar el archivo" }, { status: 500 })
  }
}
