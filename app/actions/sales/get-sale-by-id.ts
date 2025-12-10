'use server'

import { SaleWithDetails } from "@/components/sales/sale-details-view";
import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase";
import { connectToTrupperDatabase } from "@/lib/mongodb/connectToTrupperDatabase";
import { ObjectId } from "mongodb";

export async function getSaleById(saleId: string): Promise<{ data: SaleWithDetails | null; error: string | null }> {
  try {
    // Validate ObjectId early
    let saleObjectId: ObjectId;
    try {
      saleObjectId = new ObjectId(saleId);
    } catch (e) {
      return { data: null, error: "saleId inválido" };
    }

    const mainDb = await connectToMainDatabase();
    const trupperDb = await connectToTrupperDatabase();

    const salesCol = mainDb.collection("sales");
    const saleItemsCol = mainDb.collection("sale_items");
    const customersCol = mainDb.collection("customers");
    const usersCol = mainDb.collection("users");
    const branchesCol = mainDb.collection("branches");
    const trupperProductsCol = trupperDb.collection("products");

    // 1) Obtener la venta y los items en paralelo (proyección ligera)
    const [saleDoc, saleItems] = await Promise.all([
      salesCol.findOne(
        { _id: saleObjectId },
        {
          projection: {
            _id: 1,
            branch_id: 1,
            customer_id: 1,
            total_amount: 1,
            payment_received: 1,
            change_given: 1,
            created_by: 1,
            sale_type: 1,
            payment_status: 1,
            parent_sale_id: 1,
            created_at: 1
          }
        }
      ),
      saleItemsCol
        .find({ sale_id: saleObjectId }, { projection: { _id: 1, quantity: 1, unit_price: 1, product_code: 1 } })
        .toArray()
    ]);

    if (!saleDoc) {
      return { data: null, error: "No se encontró la venta" };
    }

    // 2) Buscar referencias (customer, user, branch) en paralelo sólo si existen
    const customerId = saleDoc.customer_id ?? null;
    const createdById = saleDoc.created_by ?? null;
    const branchId = saleDoc.branch_id ?? null;

    const refsPromises: Array<Promise<any>> = [];
    if (customerId) refsPromises.push(customersCol.findOne({ _id: customerId }, { projection: { name: 1, phone: 1, address: 1 } }));
    else refsPromises.push(Promise.resolve(null));
    if (createdById) refsPromises.push(usersCol.findOne({ _id: createdById }, { projection: { name: 1, username: 1 } }));
    else refsPromises.push(Promise.resolve(null));
    if (branchId) refsPromises.push(branchesCol.findOne({ _id: branchId }, { projection: { name: 1, address: 1, created_at: 1 } }));
    else refsPromises.push(Promise.resolve(null));

    const [customerDoc, userDoc, branchDoc] = await Promise.all(refsPromises);

    // 3) Obtener sólo los productos Trupper necesarios (por código)
    const rawCodes = saleItems.map((it: any) => {
      // product_code en sale_items puede venir como string o number
      const n = Number(it.product_code);
      return Number.isNaN(n) ? null : n;
    }).filter((c: number | null) => c !== null) as number[];

    const uniqueCodes = Array.from(new Set(rawCodes));
    let trupperProducts: any[] = [];
    if (uniqueCodes.length > 0) {
      trupperProducts = await trupperProductsCol
        .find({ codigo: { $in: uniqueCodes } }, { projection: { _id: 1, codigo: 1, descripcion: 1, ean: 1, marca: 1, unidad: 1 } })
        .toArray();
    }

    // Crear mapa por código para búsquedas O(1)
    const trupperMap = new Map<number, any>();
    for (const p of trupperProducts) {
      trupperMap.set(Number(p.codigo), p);
    }

    // 4) Mapear sale_items incluyendo info del producto desde trupperMap
    const mappedSaleItems = saleItems.map((si: any) => {
      const codeNum = Number(si.product_code);
      const product = trupperMap.get(codeNum);

      return {
        id: si._id ? si._id.toString() : null,
        quantity: si.quantity,
        unit_price: si.unit_price,
        product_code: si.product_code,
        product: {
          id: product?._id ? product._id.toString() : "Id no encontrado",
          name: product?.descripcion ?? "Nombre no encontrado",
          truper_code: product?.codigo ?? "Código no encontrado",
          barcode: product?.ean ?? "Código de barras no encontrado",
          brand: product?.marca ?? "Marca no encontrada",
          unit_of_measure: product?.unidad ?? "Unidad no encontrada"
        }
      };
    });

    // 5) Construir el objeto final (SaleWithDetails)
    const result: any = {
      id: saleDoc._id.toString(),
      branch_id: branchId ? branchId.toString() : null,
      customer_id: customerId ? (customerId.toString ? customerId.toString() : customerId) : null,
      total_amount: saleDoc.total_amount ?? null,
      payment_received: saleDoc.payment_received ?? null,
      change_given: saleDoc.change_given ?? null,
      created_by: createdById ? (createdById.toString ? createdById.toString() : createdById) : null,
      sale_type: saleDoc.sale_type ?? null,
      payment_status: saleDoc.payment_status ?? null,
      parent_sale_id: saleDoc.parent_sale_id ?? null,
      sale_date: saleDoc.created_at ? (new Date(saleDoc.created_at)).toISOString() : null,
      branch: branchDoc
        ? {
            id: branchDoc._id ? branchDoc._id.toString() : null,
            name: branchDoc.name ?? null,
            address: branchDoc.address ?? null,
            created_at: branchDoc.created_at ? (new Date(branchDoc.created_at)).toISOString() : null
          }
        : null,
      customer: customerDoc
        ? {
            name: customerDoc.name ?? null,
            phone: customerDoc.phone ?? null,
            address: customerDoc.address ?? null
          }
        : null,
      created_by_profile: userDoc
        ? {
            name: userDoc.name ?? null,
            username: userDoc.username ?? null
          }
        : null,
      sale_items: mappedSaleItems
    };

    return { data: result as SaleWithDetails, error: null };
  } catch (error) {
    console.error("Error al obtener la venta:", error);
    return { data: null, error: "Error al obtener las ventas en el servidor" };
  }
}
