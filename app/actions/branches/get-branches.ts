'use server'

import { connectToDatabase } from "@/lib/mongodb/config"
import { Branch as BdBranch } from "@/lib/mongodb/models/branch";
import { Branch } from "@/lib/types";

export async function getBranches(): Promise<{ data: Branch[]; error: string | null }> {
  try {
    await connectToDatabase();  
    const branches = await BdBranch.find();
    if (!branches) {
      return { data: [], error: "No se encontraron sucursales" };
    }
    const mappedBranches: Branch[] = branches.map((branch) => ({
      id: branch._id.toString(),
      name: branch.name,
      address: branch.address,
      created_at: branch.createdAt.toISOString(),
    }));
    return { data: mappedBranches, error: null };
  } catch (error) {
    console.log("Error al conectar a la base de datos para obtener las sucursales:", error)
    return { data: [], error: "Error al conectar a la base de datos para obtener las sucursales"}
  }
}