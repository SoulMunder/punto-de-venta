import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import * as XLSX from "xlsx";

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

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = process.env.SYSTEM_COLLECTION_NAME;

// ---------------- POST ----------------
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("archivo") as File;
    const userName = formData.get("name") as string;

    if (!file)
      return NextResponse.json(
        { error: "No se recibió ningún archivo." },
        { status: 400 }
      );
    if (!userName)
      return NextResponse.json(
        { error: "Nombre de usuario no proporcionado." },
        { status: 400 }
      );

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (jsonData.length === 0)
      return NextResponse.json(
        { error: "El archivo está vacío o no tiene datos válidos." },
        { status: 400 }
      );

    await client.connect();
    const db = client.db(dbName);
    const purchasesCol = db.collection("purchases");
    const itemsCol = db.collection("purchaseItems");
    const branchesCol = db.collection("branches");
    const inventoryCol = db.collection("inventory"); // <-- nueva colección

    const normalizedData = jsonData.map((row) => {
      const normalizedRow: Record<string, any> = {};
      for (const key in row) {
        normalizedRow[toCamelCaseNoAccents(key)] = row[key];
      }
      return normalizedRow;
    });

    const grouped: Record<string, any[]> = {};
    normalizedData.forEach((row) => {
      const key = `${row.noPedido}_${row.noOrden}_${row.fecha}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    for (const groupKey in grouped) {
      const rows = grouped[groupKey];
      const firstRow = rows[0];

      // Ya no usamos branch para purchases ni purchaseItems
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

        // --- Insertar en inventory con branch por fila ---
        const inventoryDocs = await Promise.all(
          purchaseItems.map(async (item, index) => {
            const branchSearch = rows[index].sucursal?.toString().trim();
            let branch: { name: string; address: string } | null = null;

            if (branchSearch) {
              const branchDoc = await branchesCol.findOne({
                nombre: { $regex: `^${branchSearch}$`, $options: "i" },
              });
              if (branchDoc)
                branch = { name: branchDoc.name, address: branchDoc.address };
            }

            return {
              codigo: item.material,
              cantidad: item.cantidad,
              branch,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          })
        );

        if (inventoryDocs.length > 0) {
          await inventoryCol.insertMany(inventoryDocs);
        }
      }
    }

    return NextResponse.json({
      message: `Se procesaron ${Object.keys(grouped).length} compras correctamente.`,
    });
  } catch (error: any) {
    console.error("❌ Error al procesar el archivo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.close();
  }
}


// ---------------- GET ----------------
export async function GET() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const purchasesCol = db.collection("purchases");

    // Traer todas las compras sin ordenar
    const purchases = await purchasesCol.find({}).toArray();

    return NextResponse.json(purchases);
  } catch (error: any) {
    console.error("❌ Error al obtener compras:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
