// import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TransferInterface } from "@/components/inventory/transfer-interface"

export default async function InventoryTransferPage() {
  // const supabase = await createClient()

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // const { data: profile } = await supabase.from("profiles").select("*, branch:branches(*)").eq("id", user.id).single()

  // if (!profile) {
  //   redirect("/login")
  // }

  // const { data: branches } = await supabase.from("branches").select("*").order("name")

  return (
    <div className="min-h-screen bg-background">
      <TransferInterface/> 
    </div>
  )
}
