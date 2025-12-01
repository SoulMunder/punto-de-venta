// app/api/inventory/update-product/route.ts
import { NextResponse } from "next/server";
import { clientPromise, dbName } from "@/lib/mongo";
import { ObjectId } from "mongodb";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, cantidad, lowStockThreshold, customPrices, imageUrl, updatedBy } = body;

    console.log("🔵 Body recibido:", body);

    // --- Validaciones básicas ---
    if (!id) {
      return NextResponse.json({ error: "El ID del producto es requerido" }, { status: 400 });
    }
    if (cantidad === undefined || cantidad === null || cantidad < 0) {
      return NextResponse.json(
        { error: "La cantidad debe ser un número válido mayor o igual a 0" },
        { status: 400 }
      );
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const inventoryCollection = db.collection("inventory");

    // --- Buscar el producto en inventory ---
    const inventoryItem = await inventoryCollection.findOne({ _id: new ObjectId(id) });
    if (!inventoryItem) {
      return NextResponse.json({ error: `Producto no encontrado` }, { status: 404 });
    }

    // --- Preparar campos a actualizar en inventory ---
    const updateFields: any = {
      cantidad,
      updatedAt: new Date(),
      updatedBy: updatedBy || "Sistema",
      lowStockThreshold:
        lowStockThreshold !== undefined && lowStockThreshold !== null
          ? lowStockThreshold
          : null,
      customPrices: Array.isArray(customPrices) && customPrices.length > 0 ? customPrices : [],
    };

    console.log("📝 Campos a actualizar en inventory:", updateFields);

    // --- Actualizar inventario ---
    const result = await inventoryCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "No se pudo actualizar el producto" }, { status: 404 });
    }

    // --- Actualizar image_url solo en products si se recibe ---
    if (imageUrl !== undefined) {
      const trupperDb = client.db(process.env.TRUPPER_DB_NAME);
      const productsCollection = trupperDb.collection("products");

      await productsCollection.updateOne(
        { codigo: inventoryItem.codigo },
        { $set: { image_url: imageUrl && imageUrl.trim() !== "" ? imageUrl : null } }
      );

      console.log("🟢 Imagen actualizada en products para codigo:", inventoryItem.codigo);
    }

    // --- Preparar cambios para logs ---
    const cambios: any = {};
    if (lowStockThreshold !== undefined && lowStockThreshold !== null)
      cambios.lowStockThreshold = updateFields.lowStockThreshold;
    if (customPrices !== undefined) cambios.customPrices = updateFields.customPrices;
    if (imageUrl !== undefined) cambios.imageUrl = imageUrl && imageUrl.trim() !== "" ? imageUrl : null;

    // --- Registrar en logs ---
    const logsCollection = db.collection("inventoryLogs");
    await logsCollection.insertOne({
      action: "UPDATE",
      inventoryId: id,
      codigo: inventoryItem.codigo,
      branch: inventoryItem.branch,
      cantidadAnterior: inventoryItem.cantidad,
      cantidadNueva: cantidad,
      cambios: Object.keys(cambios).length > 0 ? cambios : undefined,
      updatedBy: updatedBy || "Sistema",
      timestamp: new Date(),
    });

    console.log("✅ Producto actualizado exitosamente");

    return NextResponse.json(
      {
        message: "Producto actualizado exitosamente",
        id,
        cantidad,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error actualizando producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
