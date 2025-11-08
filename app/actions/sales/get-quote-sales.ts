'use server'

import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase";
import { QuoteSale } from "@/lib/types";
import { ObjectId } from "mongodb";

export async function getQuoteSales(saleId: string): Promise<{ data: QuoteSale | null; error: string | null }> {
  try {
    const mainDb = await connectToMainDatabase();
    const salesCollection = mainDb.collection("sales");
    
    const result = await salesCollection.aggregate([
      { 
        $match: { _id: new ObjectId(saleId), sale_type: "cotizacion" } 
      },
      {
        $lookup: {
          from: "sale_items",
          localField: "_id",
          foreignField: "sale_id",
          as: "sale_items",
        },
      },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          branch_id: { $toString: "$branch_id" },
          customer_id: {
            $cond: {
              if: { $ne: ["$customer_id", null] },
              then: { $toString: "$customer_id" },
              else: null
            }
          },
          total_amount: 1,
          payment_received: 1,
          change_given: 1,
          created_by: { $toString: "$created_by" },
          sale_type: 1,
          payment_status: 1,
          parent_sale_id: 1,
          created_at: { 
            $dateToString: { 
              format: "%Y-%m-%dT%H:%M:%S.%LZ", 
              date: "$created_at" 
            } 
          },
          sale_items: {
            $map: {
              input: "$sale_items",
              as: "item",
              in: {
                id: { $toString: "$$item._id" },
                sale_id: { $toString: "$$item.sale_id" },
                product_code: { $toString: "$$item.product_code" },
                quantity: "$$item.quantity",
                unit_price: "$$item.unit_price",
                subtotal: "$$item.subtotal",
                created_at: { 
                  $dateToString: { 
                    format: "%Y-%m-%dT%H:%M:%S.%LZ", 
                    date: "$$item.created_at" 
                  } 
                }
              }
            }
          }
        }
      }
    ]).toArray();

    if (result.length === 0) {
      return { 
        data: null, 
        error: "Cotización no encontrada" 
      };
    }

    return { 
      data: result[0] as QuoteSale, 
      error: null 
    };
    
  } catch (error) {
    console.log("Error al obtener la venta en el servidor:", error);
    return { 
      data: null, 
      error: "Error al obtener la venta en el servidor" 
    };
  }
}