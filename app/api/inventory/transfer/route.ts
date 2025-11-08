import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!
if (!uri) throw new Error("⚠️ Faltan variables de entorno para MongoDB")

const globalForMongo = global as unknown as { _mongoClientPromise?: Promise<MongoClient> }

let clientPromise: Promise<MongoClient>

if (!globalForMongo._mongoClientPromise) {
  const client = new MongoClient(uri)
  globalForMongo._mongoClientPromise = client.connect()
}

clientPromise = globalForMongo._mongoClientPromise

interface TransferItem {
  productId: number
  quantity: number
  descripcion?: string   // agregado
  unidad?: string       // agregado
}


interface BranchInfo {
  name: string
  address: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      fromBranch,
      toBranch,
      notes,
      items,
      createdByProfile, // { name: string } enviado desde frontend
    }: { 
      fromBranch: BranchInfo; 
      toBranch: BranchInfo; 
      notes?: string; 
      items: TransferItem[];
      createdByProfile: { name: string }
    } = body

    if (!fromBranch || !toBranch || !items || items.length === 0 || !createdByProfile) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)

    const inventoryCol = db.collection("inventory")
    const movementsCol = db.collection("inventory_movements")

    const movementDoc = {
      fromBranch: { name: fromBranch.name },
      toBranch: { name: toBranch.name },
      movementDate: new Date().toISOString(),
      notes: notes || null,
      status: "completed",
      createdBy: createdByProfile,
      inventoryMovementItems: [] as {
        product: {
          name: string
          code: string
          unidad: string
          quantity: number
        }
      }[],
    }

    for (const item of items) {
      const { productId, quantity, descripcion, unidad } = item

      // Filtros para branch origen y destino
      const fromBranchFilter = fromBranch.name === "Sin sucursal" ? { branch: null } : { "branch.name": fromBranch.name, "branch.address": fromBranch.address }
      const toBranchFilter = toBranch.name === "Sin sucursal" ? { branch: null } : { "branch.name": toBranch.name, "branch.address": toBranch.address }

      // Buscar inventario origen
      const fromInv = await inventoryCol.findOne({ codigo: productId, ...fromBranchFilter })
      if (!fromInv || fromInv.cantidad < quantity) {
        return NextResponse.json({ error: `No hay suficiente inventario del producto ${productId} en la sucursal de origen` }, { status: 400 })
      }

      // Actualizar inventario origen
      const newFromQty = fromInv.cantidad - quantity
      const updatedFromBranch = fromInv.branch // se mantiene igual
      if (newFromQty > 0) {
        await inventoryCol.updateOne(
          { _id: fromInv._id },
          { $set: { cantidad: newFromQty, branch: updatedFromBranch } }
        )
      } else {
        await inventoryCol.deleteOne({ _id: fromInv._id })
      }

      // Actualizar inventario destino
      const toInv = await inventoryCol.findOne({ codigo: productId, ...toBranchFilter })
      const toBranchUpdated = toBranch.name === "Sin sucursal" ? null : { name: toBranch.name, address: toBranch.address }

      if (toInv) {
        await inventoryCol.updateOne(
          { _id: toInv._id },
          { $inc: { cantidad: quantity }, $set: { branch: toBranchUpdated } }
        )
      } else {
        await inventoryCol.insertOne(
          { codigo: productId, cantidad: quantity, branch: toBranchUpdated, createdAt: new Date() }
        )
      }

      // Guardar item en movimiento usando los datos que vienen del frontend
      movementDoc.inventoryMovementItems.push({
        product: {
          name: descripcion || "Sin nombre",
          code: String(productId),
          unidad: unidad || "und",
          quantity,
        },
      })
    }

    await movementsCol.insertOne(movementDoc)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("❌ Error en transferencia:", err)
    return NextResponse.json({ error: err.message || "Error desconocido" }, { status: 500 })
  }
}


export async function GET(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.SYSTEM_COLLECTION_NAME)
    const inventoryMovementsCol = db.collection("inventory_movements")

    // Traemos todos los movimientos, ordenados por fecha descendente
    const movements = await inventoryMovementsCol
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(movements)
  } catch (err) {
    console.error("❌ Error al obtener movimientos:", err)
    return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 })
  }
}