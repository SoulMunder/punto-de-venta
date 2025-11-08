'use server'

import { connectToDatabase } from "@/lib/mongodb/config"
import { Customer as DbCustomer } from "@/lib/mongodb/models/customer";
import { Customer } from "@/lib/types";

export async function createCustomer(data: Partial<Customer>): Promise<{ error: string | null }> {
  try {
    await connectToDatabase();

    const newCustomer = new DbCustomer({
      ...data,
    });

    await newCustomer.save();
    return { error: null };
  } catch (error) {
    console.log("Error al crear cliente:", error);
    return { error: "Error al crear cliente" };
  }
}