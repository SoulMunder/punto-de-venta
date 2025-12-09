'use server'
import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase";
import { connectToTrupperDatabase } from "@/lib/mongodb/connectToTrupperDatabase";
import { InventoryProduct } from "@/lib/types";

export async function getInventoryProducts(branchesNames: string[]): Promise<{ data: InventoryProduct[]; error: string | null }> {
  try {
    const mainDb = await connectToMainDatabase();
    const trupperDb = await connectToTrupperDatabase();

    console.time("inventory")
const inventoryProducts = await mainDb
  .collection("inventory")
  .find({ "branch.name": { $in: branchesNames } })
  .toArray()
console.timeEnd("inventory")

console.time("trupper")
const codigos = inventoryProducts.map((p: any) => p.codigo)

const trupperProducts = await trupperDb
  .collection("products")
  .find({ codigo: { $in: codigos } })
  .toArray()
console.timeEnd("trupper")

console.time("merge")
const trupperMap = new Map(trupperProducts.map(p => [p.codigo, p]));
const mergedProducts = inventoryProducts.map((inv: any) => {
  const trupper = trupperMap.get(inv.codigo);
  return { ...inv, ...trupper, _id: inv._id };
})
console.timeEnd("merge")


    // 5. Mapear al tipo final
    const mappedProducts: InventoryProduct[] = mergedProducts.map((product) => ({
      _id: product._id.toString(),
      codigo: product.codigo.toString(),
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
      //Extras de producto
      name: product.name || null,
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
