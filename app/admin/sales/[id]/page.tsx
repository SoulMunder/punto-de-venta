// import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SaleDetailsView } from "@/components/sales/sale-details-view"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"

export default async function SaleDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions) 
  if (!session || !session.user ) {
    redirect("/auth/login")
  }
  
  const user = session.user

  if (user.role !== "admin" && user.role !== "branch_manager"  ) {
    redirect("/")
  }

  return <SaleDetailsView saleId={params.id} />
}
