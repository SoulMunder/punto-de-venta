'use server'

import { connectToDatabase } from "@/lib/mongodb/config"
import { User } from "@/lib/mongodb/models/user";
import { ProfileWithPassword } from "@/lib/types";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function updateUser(userId: string, data: Partial<ProfileWithPassword>): Promise<{ error: string | null }> {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return { error: "Usuario no encontrado" };
    }

    // Update user fields
    user.name = data.full_name || user.name;
    user.role = data.role || user.role;
    user.defaultBranch = data.branch_id && data.branch_id !== "none" 
        ? new ObjectId(data.branch_id) 
        : undefined,
    user.branches = data.assignedBranches
      ? data.assignedBranches.map((branchId) => new ObjectId(branchId))
      : user.branches;

    if (data.password && data.password.trim() !== "") {
      const hashedPassword = bcrypt.hashSync(data.password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    return { error: null };
  } catch (error) {
    console.error("Error al conectar a la base de datos para actualizar usuario:", error);
    return { error: "Error al conectar a la base de datos para actualizar usuario" };
  }
}