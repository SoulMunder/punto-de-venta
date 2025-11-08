'use server'

import { connectToDatabase } from "@/lib/mongodb/config"
import { Customer as DbCustomer } from "@/lib/mongodb/models/customer";
import { Customer, } from "@/lib/types";

export async function updateCustomer(customerId: string, data: Partial<Customer>): Promise<{ error: string | null }> {
  try {
    await connectToDatabase();
    const customer = await DbCustomer.findById(customerId);
    if (!customer) {
      return { error: "Cliente no encontrado" };
    }

    // Update customer fields
    customer.name = data.name || customer.name;
    customer.phone = data.phone || customer.phone;
    customer.address = data.address || customer.address;

    await customer.save();
    return { error: null };
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return { error: "Error al actualizar cliente" };
  }
}