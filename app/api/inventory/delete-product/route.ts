import { NextRequest, NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongo";

export async function DELETE(req: NextRequest) {
  try {
    const { codigo, branch, cantidad, motivo, createdBy } = await req.json();

    if (!codigo || !branch || !cantidad || cantidad < 1 || !createdBy) {
      return NextResponse.json(
        { error: "Faltan datos o cantidad inválida" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const inventoryDb = client.db(process.env.SYSTEM_COLLECTION_NAME);

    // Buscar producto
    const product = await inventoryDb.collection("inventory").findOne({
      codigo,
      "branch.name": branch,
    });

    if (!product) {
      return NextResponse.json({ error: "No se encontró el producto" }, { status: 404 });
    }

    // Restar cantidad
    const nuevaCantidad = (product.cantidad || 0) - cantidad;

    if (nuevaCantidad > 0) {
      await inventoryDb.collection("inventory").updateOne(
        { codigo, "branch.name": branch },
        { $set: { cantidad: nuevaCantidad } }
      );
    } else {
      await inventoryDb.collection("inventory").deleteOne({
        codigo,
        "branch.name": branch,
      });
    }

    // Insertar log
    await inventoryDb.collection("inventory_logs").insertOne({
      codigo,
      cantidad,
      tipo: "Salida",
      motivo: motivo || "Sin definir",
      createdAt: new Date(),
      createdBy: createdBy,
    });

    return NextResponse.json({
      message:
        nuevaCantidad > 0
          ? `Se eliminaron ${cantidad} unidades. Quedan ${nuevaCantidad}.`
          : "Producto eliminado completamente del inventario.",
    });
  } catch (error: any) {
    console.error("Error en DELETE /inventory/delete-product:", error);
    return NextResponse.json(
      { error: error.message || "Error eliminando producto" },
      { status: 500 }
    );
  }
}
