'use server'

import { SaleWithDetails } from "@/components/sales/sale-details-view";
import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase";
import { connectToTrupperDatabase } from "@/lib/mongodb/connectToTrupperDatabase";
import { ObjectId } from 'mongodb';

export async function getSaleById(saleId:string): Promise<{ data: SaleWithDetails | null; error: string | null }> {
  try {
    const trupperDb = await connectToTrupperDatabase()
    const trupperProducts = await trupperDb.collection("products").find().toArray();

    if(!trupperProducts || trupperProducts.length === 0){
      console.log("No se obtuvieron los productos trupper de la base de datos")
    }

    const mainDb = await connectToMainDatabase();
    const salesCollection = mainDb.collection("sales");
    const saleObjectId = new ObjectId(saleId)
    
    const result = await salesCollection.aggregate([
      { $match: { _id: saleObjectId } },
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
          from: "users",
          localField: "created_by",    
          foreignField: "_id",         
          as: "created_by_profile",
        },
      },
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
          from: "sale_items",
          localField: "_id",           
          foreignField: "sale_id",     
          as: "sale_items",
        },
      },
      {
        $sort: {
          created_at: -1
        }
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
          branch: {
            $cond: {
              if: { $gt: [{ $size: "$branch" }, 0] },
              then: {
                id: { $toString: { $arrayElemAt: ["$branch._id", 0] } },
                name: { $arrayElemAt: ["$branch.name", 0] },
                address: { $arrayElemAt: ["$branch.address", 0] },
                created_at: { 
                  $dateToString: { 
                    format: "%Y-%m-%dT%H:%M:%S.%LZ", 
                    date: { $arrayElemAt: ["$branch.created_at", 0] }
                  } 
                }
              },
              else: null
            }
          },
          customer: {
            $cond: {
              if: { $gt: [{ $size: "$customer" }, 0] },
              then: {
                name: { $arrayElemAt: ["$customer.name", 0] },
                phone: { $arrayElemAt: ["$customer.phone", 0] },
                address: { $arrayElemAt: ["$customer.address", 0] }
              },
              else: null
            }
          },
          created_by_profile: {
            $cond: {
              if: { $gt: [{ $size: "$created_by_profile" }, 0] },
              then: {
                name: { $arrayElemAt: ["$created_by_profile.name", 0] },
                username: { $arrayElemAt: ["$created_by_profile.username", 0] }
              },
              else: null
            }
          },
          sale_items: {
            $map: {                    
              input: "$sale_items",
              as: "item",
              in: {
                id: { $toString: "$$item._id" },
                quantity: "$$item.quantity",
                unit_price: "$$item.unit_price",
                product_code: { $toString: "$$item.product_code" }
              }
            }
          }
        }
      }
    ]).toArray();

    if (result.length === 0) {
      return { 
        data: null, 
        error: "No se encontro la venta" 
      };
    }

    const mappedResult = result.map((item)=>{
      const saleItems = item.sale_items.map((saleItem:any)=>{
        const product = trupperProducts.find((trupperProduct)=>(trupperProduct.codigo === Number(saleItem.product_code)))
        return {
          ...saleItem,
          product: {
            id: product?._id ? product?._id.toString()  : "Id no encontrado",
            name: product?.descripcion ?? "Nombre no encontrado",
            truper_code: product?.codigo ?? "Código no encontrado",
            barcode:  product?.barcode ?? "Código de barras no encontrado",
            brand: product?.marca ?? "Marca no encontrada",
            unit_of_measure: product?.unidad ?? "Unidad no encontrada"
          }
        }
      })
      return {
        ...item,
        sale_date: item.created_at,
        sale_items: saleItems
      }
    })

    return { 
      data: mappedResult[0] as SaleWithDetails, 
      error: null 
    };
    
  } catch (error) {
    console.log("Error al obtener las ventas en el servidor:", error);
    return { 
      data: null, 
      error: "Error al obtener las ventas en el servidor" 
    };
  }
}