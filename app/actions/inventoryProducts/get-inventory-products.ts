'use server'
import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase";
import { connectToTrupperDatabase } from "@/lib/mongodb/connectToTrupperDatabase";
import { InventoryProduct } from "@/lib/types";

export async function searchInventoryProducts(
  branchName: string,
  term: string
): Promise<{ data: InventoryProduct[]; error: string | null }> {
  try {
    console.log("searchInventoryProducts called with:", { branchName, term });

    const mainDb = await connectToMainDatabase();
    const trupperDb = await connectToTrupperDatabase();

    const searchRegex = new RegExp(term, "i"); // insensible a mayúsculas/minúsculas

    console.time("trupper-search")
    // Buscar en TrupperDB por campos relevantes
    const trupperProducts = await trupperDb
      .collection("products")
      .find({
        $or: [
          { descripcion: { $regex: searchRegex } },
          { codigo: Number(term) || -1 }, // si es número exacto
          { ean: { $regex: searchRegex } },
          { barcode: { $regex: searchRegex } },
          { clave: { $regex: searchRegex } },
        ],
      })
      .toArray();
    console.timeEnd("trupper-search")

    if (trupperProducts.length === 0) return { data: [], error: null };

    const codigos = trupperProducts.map(p => p.codigo); // número

    console.time("inventory-search")
    // Buscar en MainDB solo productos de la sucursal con esos códigos
    const inventoryProducts = await mainDb
      .collection("inventory")
      .find({
        "branch.name": branchName,
        codigo: { $in: codigos }
      })
      .toArray();
    console.timeEnd("inventory-search")

    // Mapear Trupper por código
    const trupperMap = new Map(trupperProducts.map(p => [p.codigo, p]));

const mergedProducts = inventoryProducts.map((inv: any) => {
  const trupper = trupperMap.get(inv.codigo);
  return {
    ...trupper,           // primero los datos generales
    ...inv,               // luego los datos de inventario sobrescriben
    customPrices: inv.customPrices || trupper?.customPrices || null,
    _id: inv._id,
  };
});


    // Mapear al tipo final, manteniendo codigo como number
    const mappedProducts: InventoryProduct[] = mergedProducts.map((product) => ({
      _id: product._id.toString(),
      codigo: product.codigo, // number
      clave: product.clave,
      descripcion: product.descripcion,
      margenDeMercado: product.margenDeMercado,
      caja: product.caja,
      master: product.master,
      precio: product.precio,
      unidad: product.unidad,
      ean: product.ean,
      precioMinimoDeVenta: product.precioMinimoDeVenta,
      altaRotacion: product.altaRotacion,
      precioMayoreoConIVA: product.precioMayoreoConIVA,
      precioDistribuidorConIVA: product.precioDistribuidorConIVA,
      precioPublicoConIVA: product.precioPublicoConIVA,
      precioMayoreoSinIVA: product.precioMayoreoSinIVA,
      precioDistribuidorSinIVA: product.precioDistribuidorSinIVA,
      precioPublicoSinIVA: product.precioPublicoSinIVA,
      marca: product.marca,
      precioMedioMayoreoSinIVA: product.precioMedioMayoreoSinIVA,
      precioMedioMayoreoConIVA: product.precioMedioMayoreoConIVA,
      codigoSAT: product.codigoSAT,
      descripcionSAT: product.descripcionSAT,
      familia: product.familia,
      descripcionFamilia: product.descripcionFamilia,
      pesoKg: product.pesoKg,
      volumenCm3: product.volumenCm3,
      image_url: product.image_url || null,
      customPrices: product.customPrices || null,
      barcode: product.barcode || null,
      custom_prices: product.custom_prices || null,
      cantidad: product.cantidad || null,
      branch: product.branch?.name || null,
    }));

    return { data: mappedProducts, error: null };

  } catch (error) {
    console.error("Error al conectar a la base de datos para obtener inventarios:", error);
    return { data: [], error: "Error al obtener inventarios" };
  }
}
