'use server'

import { connectToDatabase } from "@/lib/mongodb/config"
import { User } from "@/lib/mongodb/models/user";

export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return { error: "Usuario no encontrado" };
    }
    await User.findByIdAndDelete(userId);
    return { error: null };
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return { error: "Error al eliminar usuario" };
  }
}