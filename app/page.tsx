import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/config"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  // Redirect based on role
  if (session.user.role === "admin") {
    redirect("/admin/products")
  } 
  
  if (session.user.role === "branch_manager") {
    redirect("/pos")
  }

  if (session.user.role === "cashier") {
    redirect("/pos")
  }

  redirect("/auth/login")
  
}
