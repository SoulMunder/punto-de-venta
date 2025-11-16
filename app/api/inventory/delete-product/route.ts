import { NextRequest, NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongo";

export async function DELETE(req: NextRequest) {
  try {
    const { codigo, branch } = await req.json();

    if (!codigo || !branch) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const client = await clientPromise;
    const inventoryDb = client.db(process.env.SYSTEM_COLLECTION_NAME);

    const result = await inventoryDb.collection("inventory").deleteOne({
      codigo,
      "branch.name": branch,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No se encontró el producto con ese código y sucursal" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Producto eliminado correctamente" });
  } catch (error: any) {
    console.error("Error en DELETE /inventory/delete-product:", error);
    return NextResponse.json(
      { error: error.message || "Error eliminando producto" },
      { status: 500 }
    );
  }
}
