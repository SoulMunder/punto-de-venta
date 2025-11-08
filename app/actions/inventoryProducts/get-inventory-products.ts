'use server'
import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase";
import { connectToTrupperDatabase } from "@/lib/mongodb/connectToTrupperDatabase";
import { InventoryProduct } from "@/lib/types";

export async function getInventoryProducts(branchesNames:string[]): Promise<{ data: InventoryProduct[] ; error: string | null }> {
  try {
    const mainDb = await connectToMainDatabase();
    const trupperDb = await connectToTrupperDatabase()

    const inventoryProducts = await mainDb.collection("inventory").find({"branch.name": {$in: branchesNames}}).toArray();
    const truperProducts = await trupperDb.collection("products").find().toArray();

    const mergedProducts = inventoryProducts.map((inventoryItem:any) => {
      const trupperProduct = truperProducts.find(tp => tp.codigo === inventoryItem.codigo);
      if (!trupperProduct) {
        console.log(`No se encontró producto Trupper para el código: ${inventoryItem.codigo}`);
      }
      return { ...inventoryItem, ...trupperProduct, _id:inventoryItem._id };
    });

    const mappedProducts: InventoryProduct[] = mergedProducts.map((product)=>({
      _id:product._id.toString(),
      codigo: product.codigo.toString(),
      clave: product.clave,
      descripcion: product.descripcion,
      margenDeMercado: product.margenDeMercado,
      caja: product.caja,
      master: product.master,
      precio: product.precio,
      unidad: product.unidad,
      ean: product.ean,
      precioMinimoDeVenta: product. precioMinimoDeVenta,
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
      branch: product.branch?.name || null
    }))

    return { data: mappedProducts, error: null };
  } catch (error) {
    console.error("Error al conectar a la base de datos para obtener usuarios:", error);
    return { data: [], error: "Error al conectar a la base de datos para obtener usuarios" };
  }
}