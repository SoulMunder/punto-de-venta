import { redirect } from "next/navigation"
import { CustomerList } from "@/components/customers/customer-list"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"

export default async function CustomersPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user ) {
    redirect("/auth/login")
  }

  // Check if user has permission (admin or branch_manager)
  if (!["admin", "branch_manager"].includes(session.user.role)) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Gestión de Clientes</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        <CustomerList />
      </main>
    </div>
  )
}
