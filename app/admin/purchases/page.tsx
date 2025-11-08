import { redirect } from "next/navigation"
// import { createClient } from "@/lib/supabase/server"
// import { createClient } from "@/lib/supabase/server"
import { PurchaseList } from "@/components/purchases/purchase-list"

export default async function PurchasesPage() {
  // const supabase = await createClient()
  // const {
  //   data: { user },
  //   error,
  // } = await supabase.auth.getUser()
  // const supabase = await createClient()
  // const {
  //   data: { user },
  //   error,
  // } = await supabase.auth.getUser()

  // if (error || !user) {
  //   redirect("/auth/login")
  // }
  // if (error || !user) {
  //   redirect("/auth/login")
  // }

  // // Check if user is admin
  // const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  // // Check if user is admin
  // const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // if (!profile || profile.role !== "admin") {
  //   redirect("/")
  // }
  // if (!profile || profile.role !== "admin") {
  //   redirect("/")
  // }

  // // Get branches
  // const { data: branches } = await supabase.from("branches").select("*").order("name")
  // // Get branches
  // const { data: branches } = await supabase.from("branches").select("*").order("name")

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Registro de Compras</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        {/* <PurchaseList branches={branches || []} userId={user.id} /> */}
         <PurchaseList />
      </main>
    </div>
  )
}
