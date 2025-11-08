import { redirect } from "next/navigation"
import { SalesList } from "@/components/sales/sales-list"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getBranches } from "@/app/actions/branches/get-branches"

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Historial de Ventas</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        <SalesList branches={branches || []} userRole={user.role} />
      </main>
    </div>
  )
}
