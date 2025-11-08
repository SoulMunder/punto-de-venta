'use server'

import { connectToDatabase } from "@/lib/mongodb/config"
import { User } from "@/lib/mongodb/models/user";
import { ProfileWithBranches } from "@/lib/types";

import { ObjectId } from "mongoose";


export async function getUsers(): Promise<{ data: ProfileWithBranches[]; error: string | null }> {
  try {
    await connectToDatabase();
    const users = await User.find();
    if (!users) {
      return { data: [], error: "No se encontraron usuarios" };
    }   
    const mappedUsers: ProfileWithBranches[] = users.map((user)=>({
      id: user._id.toString(),
      username: user.username,
      full_name: user.name,
      role: user.role,
      companies: user.companies,
      branch_id: user.defaultBranch ? user.defaultBranch.toString() : null,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
      assignedBranches: user.branches?.map((branchId: ObjectId) => branchId.toString()) || [],
    }))
    return { data: mappedUsers, error: null };
  } catch (error) {
    console.error("Error al conectar a la base de datos para obtener usuarios:", error);
    return { data: [], error: "Error al conectar a la base de datos para obtener usuarios" };
  }
}