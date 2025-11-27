import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { clientPromise, dbName } from "@/lib/mongo";


// --- Funciones auxiliares ---
function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toCamelCaseNoAccents(str: string) {
  const cleaned = removeAccents(str).replace(/\./g, " ");
  return cleaned
    .trim()
    .replace(/\s+(\w)/g, (_, c) => c.toUpperCase())
    .replace(/\s/g, "")
    .replace(/^./, c => c.toLowerCase());
}

function parseExcelDate(value: any): Date | string {
  if (!value) return value;

  if (typeof value === "string") {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const match = value.trim().toLowerCase().match(/^(\d{1,2})[\/\- ]([a-z]{3})[\/\- ](\d{4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = months[match[2]];
      const year = parseInt(match[3], 10);
      if (month !== undefined) return new Date(Date.UTC(year, month, day));
    }
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? value : new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}
// ---------------- POST ----------------
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("archivo") as File;
    const userName = formData.get("name") as string;

    if (!file)
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    if (!userName)
      return NextResponse.json({ error: "Nombre de usuario no proporcionado." }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (jsonData.length === 0)
      return NextResponse.json({ error: "El archivo está vacío o no tiene datos válidos." }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(dbName);
    const purchasesCol = db.collection("purchases");
    const itemsCol = db.collection("purchaseItems");
    const branchesCol = db.collection("branches");
    const inventoryCol = db.collection("inventory");
    const inventoryLogsCol = db.collection("inventory_logs"); // <-- NUEVO

    // --- Normalizar nombres de columnas ---
    const normalizedData = jsonData.map((row) => {
      const normalizedRow: Record<string, any> = {};
      for (const key in row) {
        normalizedRow[toCamelCaseNoAccents(key)] = row[key];
      }
      return normalizedRow;
    });

    const defaultBranchDoc = await branchesCol.findOne({});
    const defaultBranch = defaultBranchDoc
      ? { name: defaultBranchDoc.name, address: defaultBranchDoc.address }
      : null;

    const grouped: Record<string, any[]> = {};
    normalizedData.forEach((row) => {
      const key = `${row.noPedido}_${row.noOrden}_${row.fecha}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    for (const groupKey in grouped) {
      const rows = grouped[groupKey];
      const firstRow = rows[0];

      const purchaseDoc: any = {
        createdBy: userName,
        fecha: parseExcelDate(firstRow.fecha),
        noPedido: firstRow.noPedido,
        noOrden: firstRow.noOrden,
        notes: firstRow.notes,
        createdAt: new Date(),
      };

      await purchasesCol.insertOne(purchaseDoc);

      const purchaseItems = rows.map((r) => ({
        material: r.material ?? "",
        descripcion: r.descripcion ?? "",
        cantidad: Number(r.cantidad) || 0,
        precioUnitario: Number(r.precioUnitario) || 0,
        subtotal: Number(r.subtotal) || 0,
        fecha: parseExcelDate(firstRow.fecha),
        noPedido: firstRow.noPedido,
        noOrden: firstRow.noOrden,
        createdAt: new Date(),
      }));

      if (purchaseItems.length > 0) {
        await itemsCol.insertMany(purchaseItems);

        // --- Actualizar inventario y agregar logs ---
        for (const [index, item] of purchaseItems.entries()) {
          const branchSearch = rows[index].sucursal?.toString().trim();
          let branch: { name: string; address: string } | null = null;

          if (branchSearch) {
            const branchDoc = await branchesCol.findOne({ nombre: { $regex: `^${branchSearch}$`, $options: "i" } });
            if (branchDoc) branch = { name: branchDoc.name, address: branchDoc.address };
          }

          if (!branch) branch = defaultBranch;

          const updateResult = await inventoryCol.updateOne(
            { codigo: item.material, "branch.name": branch?.name ?? null },
            {
              $inc: { cantidad: item.cantidad },
              $set: { updatedAt: new Date(), branch: branch ?? null },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
          );

          // --- Crear log en inventoryLogs ---
          await inventoryLogsCol.insertOne({
            codigo: item.material,
            cantidad: item.cantidad,
            tipo: "Entrada", // Asumimos que siempre es entrada al procesar compras
            motivo: `Compra trupper`,
            createdAt: new Date(),
            createdBy: userName,
          });
        }
      }
    }

    return NextResponse.json({
      message: `Se procesaron ${Object.keys(grouped).length} compras correctamente.`,
    });
  } catch (error: any) {
    console.error("❌ Error al procesar el archivo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



// ---------------- GET ----------------
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const purchasesCol = db.collection("purchases");

    const purchases = await purchasesCol.find({}).toArray();
    return NextResponse.json(purchases);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
