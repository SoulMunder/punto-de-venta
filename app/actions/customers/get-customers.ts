'use server'

import { connectToDatabase } from "@/lib/mongodb/config"
import { Customer as DbCustomer } from "@/lib/mongodb/models/customer";
import { Customer,} from "@/lib/types";

export async function getCustomers(): Promise<{ data: Customer[]; error: string | null }> {
  try {
    await connectToDatabase();
    const customers = await DbCustomer.find();
    if (!customers) {
      return { data: [], error: "No se encontraron clientes" };
    }
    const mappedCustomers: Customer[] = customers.map((customer) => ({
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone || null,
      address: customer.address || null,
      created_at: customer.createdAt.toISOString(),
      updated_at: customer.updatedAt.toISOString(),
    }))
    return { data: mappedCustomers, error: null };
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return { data: [], error: "Error al obtener clientes" };
  }
}