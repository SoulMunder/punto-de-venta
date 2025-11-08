'use server'

import { connectToDatabase } from "@/lib/mongodb/config"
import { User } from "@/lib/mongodb/models/user";
import { AllowedRole, ProfileWithPassword } from "@/lib/types";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function createUser(data: Partial<ProfileWithPassword>): Promise<{ error: string | null }> {
  try {
    await connectToDatabase();

    const existingUser = await User.findOne({ username: data.username });
    if (existingUser) {
      return { error: "El nombre de usuario ya está en uso" };
    }

    const hashedPassword = data.password ? bcrypt.hashSync(data.password, 10) : undefined;

    const newUser = new User({
      ...data,
      name: data.full_name,
      role: data.role as AllowedRole,
      password: hashedPassword,
      defaultBranch: data.branch_id && data.branch_id !== "none" 
        ? new ObjectId(data.branch_id) 
        : undefined,
      branches: data.assignedBranches ? data.assignedBranches.map((branchId) => new ObjectId(branchId)) : [],
    });

    await newUser.save();
    return { error: null };
  } catch (error) {
    console.log("Error al crear usuario:", error);
    return { error: "Error al crear usuario" };
  }
}