import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/config"
import { UserManagement } from "@/components/admin/user-management"
import { getBranches } from "@/app/actions/branches/get-branches"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user ) {
    redirect("/auth/login")
  }

  if (session.user.role !== "admin") {
    redirect("/")
  }

  // Get branches
  const { data: branches, error } = await getBranches()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Gestión de Usuarios</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        <UserManagement branches={branches || []} error={error} />
      </main>
    </div>
  )
}
