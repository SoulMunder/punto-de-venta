'use server'
import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase";
import { connectToTrupperDatabase } from "@/lib/mongodb/connectToTrupperDatabase";
import { InventoryProduct } from "@/lib/types";

export async function getProductByEAN(
  ean: string,
  branchName: string
): Promise<{ data: InventoryProduct | null; error: string | null }> {
  try {
    const mainDb = await connectToMainDatabase();
    const trupperDb = await connectToTrupperDatabase();

    console.time("trupper")
    // Buscar producto en TrupperDb por EAN
    const trupperProduct: any = await trupperDb.collection("products").findOne({ ean });
    console.timeEnd("trupper")

    if (!trupperProduct) {
      return { data: null, error: `No se encontró nigun producto con con el codigo de barras: ${ean}` };
    }

    const codigo = trupperProduct.codigo;
    if (!codigo) {
      return { data: null, error: "El producto de Trupper no tiene código asignado" };
    }

    console.time("inventory")
    // Buscar en MainDb el producto por código y sucursal
    const inventoryProduct: any = await mainDb.collection("inventory").findOne({
      codigo,
      "branch.name": branchName,
    });
    console.timeEnd("inventory")

    if (!inventoryProduct) {
      return { data: null, error: `No se encontró producto en la sucursal: ${branchName}` };
    }

    console.time("merge")
    // Merge de datos, usando any para evitar errores de tipo
    const merged: any = { ...inventoryProduct, ...trupperProduct, _id: inventoryProduct._id };
    console.timeEnd("merge")

    // Mapear igual que getInventoryProducts
    const mappedProduct: InventoryProduct = {
      _id: merged._id.toString(),
      codigo: merged.codigo.toString(),
      clave: merged.clave,
      descripcion: merged.descripcion,
      margenDeMercado: merged.margenDeMercado,
      caja: merged.caja,
      master: merged.master,
      precio: merged.precio,
      unidad: merged.unidad,
      ean: merged.ean,
      precioMinimoDeVenta: merged.precioMinimoDeVenta,
      altaRotacion: merged.altaRotacion,
      precioMayoreoConIVA: merged.precioMayoreoConIVA,
      precioDistribuidorConIVA: merged.precioDistribuidorConIVA,
      precioPublicoConIVA: merged.precioPublicoConIVA,
      precioMayoreoSinIVA: merged.precioMayoreoSinIVA,
      precioDistribuidorSinIVA: merged.precioDistribuidorSinIVA,
      precioPublicoSinIVA: merged.precioPublicoSinIVA,
      marca: merged.marca,
      precioMedioMayoreoSinIVA: merged.precioMedioMayoreoSinIVA,
      precioMedioMayoreoConIVA: merged.precioMedioMayoreoConIVA,
      codigoSAT: merged.codigoSAT,
      descripcionSAT: merged.descripcionSAT,
      familia: merged.familia,
      descripcionFamilia: merged.descripcionFamilia,
      pesoKg: merged.pesoKg,
      volumenCm3: merged.volumenCm3,
      image_url: merged.image_url || null,
      customPrices: merged.customPrices || null,
      // Extras de producto
      name: merged.name || null,
      barcode: merged.barcode || null,
      custom_prices: merged.custom_prices || null,
      cantidad: merged.cantidad || null,
      branch: merged.branch?.name || null,
    } as any; // <---- aquí usamos as any para replicar exactamente el otro comportamiento

    return { data: mappedProduct, error: null };

  } catch (error) {
    console.error("Error al obtener producto por EAN y sucursal:", error);
    return { data: null, error: "Error al obtener producto" };
  }
}
