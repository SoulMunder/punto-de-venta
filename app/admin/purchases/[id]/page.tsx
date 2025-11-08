// import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PurchaseDetailsView } from "@/components/purchases/purchase-details-view"

export default async function PurchaseDetailsPage({ params }: { params: { id: string } }) {
  // const supabase = await createClient()

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/auth/login")
  // }

  // const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  // if (!profile || profile.role === "cashier") {
  //   redirect("/pos")
  // }

  return <PurchaseDetailsView purchaseId={params.id} />
}
