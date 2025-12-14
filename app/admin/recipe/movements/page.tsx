import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getBranches } from "@/app/actions/branches/get-branches"
import { RecipeMovementsList } from "@/components/recipes/sales-list"

export default async function SalesPage() {
  const session = await getServerSession(authOptions) 
  if (!session || !session.user ) {
    redirect("/auth/login")
  }

  const user = session.user

  if (user.role !== "admin" && user.role !== "branch_manager"  ) {
    redirect("/")
  }

  // Get branches
  const { data: branches } = await getBranches()

  return (
    <div className="flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Historial de recetas</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        <RecipeMovementsList />
      </main>
    </div>
  )
}
