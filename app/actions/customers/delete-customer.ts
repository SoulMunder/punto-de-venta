'use server'

import { connectToDatabase } from "@/lib/mongodb/config"
import { Customer as DbCustomer } from "@/lib/mongodb/models/customer";

export async function deleteCustomer(customerId: string): Promise<{ error: string | null }> {
  try {
    await connectToDatabase();
    const customer = await DbCustomer.findById(customerId);
    if (!customer) {
      return { error: "Cliente no encontrado" };
    }
    await DbCustomer.findByIdAndDelete(customerId);
    return { error: null };
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return { error: "Error al eliminar cliente" };
  }
}