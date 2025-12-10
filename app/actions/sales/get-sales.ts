"use server";

import { connectToMainDatabase } from "@/lib/mongodb/connectToMainDatabase";
import { connectToTrupperDatabase } from "@/lib/mongodb/connectToTrupperDatabase";
import { SaleWithRelations } from "@/lib/types";

function serialize(input: any) {
  return JSON.parse(
    JSON.stringify(input, (_, value) => {
      if (value?._bsontype === "ObjectID") return value.toString();
      if (value instanceof Date) return value.toISOString();
      return value;
    })
  );
}

export async function getSales(
  page = 0,
  limit = 50
): Promise<{ data: SaleWithRelations[] | null; error: string | null }> {
  try {
    console.time("⏱ TOTAL getSales()");

    const mainDb = await connectToMainDatabase();
    const trupperDb = await connectToTrupperDatabase();

    console.time("⏱ Aggregation ventas");

    const result = await mainDb
      .collection("sales")
      .aggregate([
        { $sort: { created_at: -1 } },
        { $skip: page * limit },
        { $limit: limit },

        // ───────────────────────────────
        // Lookup customers
        // ───────────────────────────────
        {
          $lookup: {
            from: "customers",
            localField: "customer_id",
            foreignField: "_id",
            as: "customer",
          },
        },

        // ───────────────────────────────
        // Lookup user profile
        // ───────────────────────────────
        {
          $lookup: {
            from: "users",
            localField: "created_by",
            foreignField: "_id",
            as: "created_by_profile",
          },
        },

        // ───────────────────────────────
        // Lookup branch
        // ───────────────────────────────
        {
          $lookup: {
            from: "branches",
            localField: "branch_id",
            foreignField: "_id",
            as: "branch",
          },
        },

        // ───────────────────────────────
        // Lookup sale items
        // ───────────────────────────────
        {
          $lookup: {
            from: "sale_items",
            localField: "_id",
            foreignField: "sale_id",
            as: "sale_items",
          },
        },

        // ───────────────────────────────
        // Lookup products (solo los necesarios)
        // ───────────────────────────────
        {
          $lookup: {
            from: "products",
            localField: "sale_items.product_code",
            foreignField: "codigo",
            as: "products_info",
          },
        },

        // ───────────────────────────────
        // Transformar y mapear dentro del servidor
        // ───────────────────────────────
        {
          $project: {
            id: { $toString: "$_id" },
            branch_id: { $toString: "$branch_id" },
            customer_id: {
              $cond: [
                { $ne: ["$customer_id", null] },
                { $toString: "$customer_id" },
                null,
              ],
            },
            total_amount: 1,
            payment_received: 1,
            change_given: 1,
            sale_type: 1,
            payment_status: 1,
            parent_sale_id: 1,
            created_by: { $toString: "$created_by" },
            created_at: 1,
            sale_date: "$created_at",

            branch: { $arrayElemAt: ["$branch", 0] },
            customer: { $arrayElemAt: ["$customer", 0] },
            created_by_profile: { $arrayElemAt: ["$created_by_profile", 0] },

            sale_items: {
              $map: {
                input: "$sale_items",
                as: "item",
                in: {
                  quantity: "$$item.quantity",
                  unit_price: "$$item.unit_price",
                  product_code: { $toString: "$$item.product_code" },
                  product: {
                    $let: {
                      vars: {
                        p: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$products_info",
                                as: "prod",
                                cond: { $eq: ["$$prod.codigo", "$$item.product_code"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: {
                        name: { $ifNull: ["$$p.descripcion", "Nombre no encontrado"] },
                        truper_code: { $ifNull: ["$$p.codigo", "Código no encontrado"] },
                        brand: { $ifNull: ["$$p.marca", "Marca no encontrada"] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ])
      .toArray();

    console.timeEnd("⏱ Aggregation ventas");

    const serialized = serialize(result);
    console.timeEnd("⏱ TOTAL getSales()");

    return { data: serialized, error: null };
  } catch (error) {
    console.error("❌ Error en getSales():", error);
    return { data: null, error: "Error al obtener ventas" };
  }
}
