'use server'

import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase";
import { NewSale, SaleReceipt} from "@/lib/types";
import { ObjectId } from "mongodb";
import createPayment from "../payments/create-payment";

export async function processProductsSale(sale: NewSale): Promise<{ data: SaleReceipt | null ; error: string | null }> {
  let saleId: ObjectId | null = null;
  let saleItemsInserted = false;
  let inventoryUpdated = false;
  let paymentCreated = false;
  
  try {
    const mainDb = await connectToMainDatabase();
    const salesCollection = mainDb.collection("sales");
    const saleItemsCollection = mainDb.collection("sale_items");
    const inventoryCollection = mainDb.collection("inventory");

    const newSaleDoc = {
      branch_id: new ObjectId(sale.branch_id),
      customer_id: sale.customer_id ? new ObjectId(sale.customer_id) : null,
      total_amount: sale.total_amount,
      payment_received: sale.payment_received, 
      change_given: sale.change_given, 
      created_by: new ObjectId(sale.created_by),
      sale_type: sale.sale_type, 
      payment_status: sale.payment_status, 
      parent_sale_id: sale.parent_sale_id, 
      created_at: new Date(),
    };

    // PASO 1: Insertar Venta
    const saleResult = await salesCollection.insertOne(newSaleDoc);

    if (!saleResult.acknowledged) {
      return { data: null, error: "No se pudo insertar la venta en la base de datos." }
    }
    saleId = saleResult.insertedId;

    // PASO 2: Insertar Ítems de Venta
    const saleItemsDocs = sale.cart.map((item) => ({
      sale_id: saleId,
      product_code: Number(item.product.codigo), 
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
      created_at: new Date()
    }));

    if (saleItemsDocs.length > 0) {
      const itemsResult = await saleItemsCollection.insertMany(saleItemsDocs);
      if (!itemsResult.acknowledged) {
        throw new Error("No se pudieron insertar los ítems de la venta");
      }
      saleItemsInserted = true;
    }

    // PASO 3: Actualizar Inventario
    if (sale.sale_type !== "cotizacion" && sale.cart) {
      for (const item of sale.cart) {
        const itemObjectId = new ObjectId(item.product._id)
        const updateResult = await inventoryCollection.findOneAndUpdate(
          { _id: itemObjectId},
          { $inc: { cantidad: -item.quantity } },
          { returnDocument: 'after' }
        );

        console.log("---Update Result---:", updateResult);

        if (!updateResult) {
          throw new Error(`Inventario no encontrado o no actualizado para el producto ${item.product.codigo}`);
        }
      }
      inventoryUpdated = true;
    }

    //PASO 4: Si es credito e hizo un pago, insertar pago
    if(sale.sale_type === "credito" && sale.payment_received > 0 ){
      const payment = {
        sale_id: saleId.toString(),
        amount: sale.payment_received,
        payment_method: "efectivo",
        notes: "Primer pago realizado al adquirir el producto/crédito.",
        created_by: sale.created_by,
      }
      const {error} = await createPayment(payment)
      if(error){
         throw new Error(`Pago no creado: ${error}`)
      }
      paymentCreated = true;
    }

    // PASO 5: Obtener datos completos con agregación
    const aggregatedSales = await salesCollection.aggregate([
      { $match: { _id: saleId } },
      {
        $lookup: {
          from: "branches",
          localField: "branch_id",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $lookup: {
          from: "sale_items",
          localField: "_id",
          foreignField: "sale_id",
          as: "sale_items",
        },
      },
      // Hacer unwind para poder hacer lookup de productos individualmente
      { $unwind: { path: "$sale_items", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "products",
          localField: "sale_items.product_code",
          foreignField: "codigo",
          as: "product_info",
        },
      },
      { $unwind: { path: "$product_info", preserveNullAndEmptyArrays: true } },
      // Reagrupar todo
      {
        $group: {
          _id: "$_id",
          branch: { $first: "$branch" },
          customer: { $first: "$customer" },
          total_amount: { $first: "$total_amount" },
          payment_received: { $first: "$payment_received" },
          change_given: { $first: "$change_given" },
          created_at: { $first: "$created_at" },
          sale_items: {
            $push: {
              quantity: "$sale_items.quantity",
              unit_price: "$sale_items.unit_price",
              product_code: { $toString: "$sale_items.product_code" },
              product: {
                name: "$product_info.name",
                truper_code: "$product_info.truper_code",
                brand: "$product_info.brand"
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          sale_date: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$created_at" } },
          total_amount: 1,
          payment_received: 1,
          change_given: 1,
          branch: { 
            $cond: {
              if: { $gt: [{ $size: "$branch" }, 0] },
              then: { name: { $arrayElemAt: ["$branch.name", 0] } },
              else: null
            }
          },
          customer: { 
            $cond: {
              if: { $gt: [{ $size: "$customer" }, 0] },
              then: { name: { $arrayElemAt: ["$customer.name", 0] } },
              else: null
            }
          },
          sale_items: 1
        }
      }
    ]).toArray();

    const finalSaleData = aggregatedSales[0] as SaleReceipt | null || null;

    console.log("---DATA---:", finalSaleData);

    return { data: finalSaleData, error: null };

  } catch (error) {
    console.error("Error al procesar la venta en servidor:", error);
    
    // ========== ROLLBACK MANUAL ========== Si hay algun error, restaura los registros
    try {
      const mainDb = await connectToMainDatabase();
      
      if (saleId) {
        console.log("Iniciando rollback...");

        // 0. Eliminar pago si se creó
        if (paymentCreated) {
          const paymentsCollection = mainDb.collection("payments");
          await paymentsCollection.deleteMany({ sale_id: saleId });
          console.log("Pago eliminado");
        }
        
        // 1. Restaurar inventario (solo si no es cotización)
        if (sale.sale_type !== "cotizacion" && sale.cart && inventoryUpdated ) {
          const inventoryCollection = mainDb.collection("inventory");

          
          
          for (const item of sale.cart) {
            const itemObjectId = new ObjectId(item.product._id)
            await inventoryCollection.updateOne(
              { _id: itemObjectId },
              { $inc: { cantidad: item.quantity } }
            );
          }
          console.log("Inventario restaurado");
        }
        
        // 2. Eliminar sale_items si se insertaron
        if (saleItemsInserted) {
          const saleItemsCollection = mainDb.collection("sale_items");
          await saleItemsCollection.deleteMany({ sale_id: saleId });
          console.log("Items de venta eliminados");
        }
        
        // 3. Eliminar la venta
        const salesCollection = mainDb.collection("sales");
        await salesCollection.deleteOne({ _id: saleId });
        console.log("Venta eliminada");
        
        console.log("Rollback completado exitosamente");
      }
    } catch (rollbackError) {
      console.error("Error durante el rollback:", rollbackError);
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Error al procesar la venta en servidor" 
    };
  }
}