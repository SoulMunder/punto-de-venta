import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = process.env.SYSTEM_COLLECTION_NAME;
const trupperDbName = process.env.TRUPPER_DB_NAME;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const trupperDb = client.db(trupperDbName);

    const purchasesCol = db.collection("purchases");
    const itemsCol = db.collection("purchaseItems");
    const productsCol = trupperDb.collection("products"); // <-- otra DB

    const purchaseId = params.id;
    if (!purchaseId) {
      return NextResponse.json({ error: "No se proporcionó id de compra" }, { status: 400 });
    }

    // 1️⃣ Buscar la compra
    const purchase = await purchasesCol.findOne({ _id: new ObjectId(purchaseId) });
    if (!purchase) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    }

    const { noPedido, noOrden, fecha } = purchase;

    // 2️⃣ Filtrar items relacionados por noPedido, noOrden y fecha
    const purchaseItems = await itemsCol
      .find({ noPedido, noOrden, fecha })
      .toArray();

    // 3️⃣ Obtener los productos relacionados desde TRUPPER_DB_NAME
    const materials = purchaseItems.map(item => item.material);
    const productsArray = await productsCol
      .find({ codigo: { $in: materials } })
      .toArray();

    const productMap = Object.fromEntries(
      productsArray.map(p => [p.codigo, p])
    );

    // 4️⃣ Armar los items con sus productos
    const itemsWithProducts = purchaseItems.map(item => {
      const product = productMap[item.material];
      return {
        id: item._id.toString(),
        quantity: item.cantidad,
        purchase_price: item.precioUnitario,
        subtotal: item.subtotal,
        product: product
          ? {
              id: product._id.toString(),
              name: product.descripcion,
              truper_code: product.codigo,
              barcode: product.ean,
              unit_of_measure: product.unidad,
            }
          : null,
      };
    });

    // 5️⃣ Responder con la compra y sus items
    return NextResponse.json({
      id: purchase._id.toString(),
      purchase_date: purchase.fecha,
      notes: purchase.notes || null,
      created_at: purchase.createdAt,
      branch: purchase.branch,
      created_by_profile: purchase.createdBy,
      purchase_items: itemsWithProducts,
    });
  } catch (error: any) {
    console.error("❌ Error al obtener la compra:", error);
    return NextResponse.json({ error: "Error al obtener la compra" }, { status: 500 });
  } finally {
    await client.close();
  }
}
