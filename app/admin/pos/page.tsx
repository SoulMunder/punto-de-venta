import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { POSInterface } from "@/components/pos/pos-interface"
import { getBranches } from "@/app/actions/branches/get-branches"

export default async function POSPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/auth/login")
  }

  const { data: branches, error } = await getBranches()


  // If user has no assigned branches, fall back to their default branch
  const user = session.user
  let availableBranches = branches || []

  console.log("Branches desde API:", branches)
  console.log("Usuario:", user)


  if (user.assignedBranches?.length === 0 && user.defaultBranch) {
    availableBranches = branches.filter(branch => branch.id === user.defaultBranch)
  }

  if (user.assignedBranches && user.assignedBranches.length > 0) {
    availableBranches = branches.filter(branch => user.assignedBranches?.includes(branch.id))
  }


  return (
    <div className="flex flex-col bg-slate-50">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-12 sm:h-16 items-center justify-between px-3 sm:px-4">
          <h1 className="text-lg sm:text-xl font-semibold">Punto de Venta</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="w-full">
          <POSInterface
            branches={availableBranches}
            userId={user.id}
            userBranchId={user.defaultBranch}
            allowBranchChange={availableBranches.length > 1}
          />
        </div>
      </main>
    </div>
  )
}
