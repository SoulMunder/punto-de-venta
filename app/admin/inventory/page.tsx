import { redirect } from "next/navigation"
// import { createClient } from "@/lib/supabase/server"
// import { createClient } from "@/lib/supabase/server"
import { InventoryView } from "@/components/inventory/inventory-view"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, History } from "lucide-react"

export default async function InventoryPage() {
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

  // // Check if user has permission
  // const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  // // Check if user has permission
  // const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // if (!profile) {
  //   redirect("/")
  // }
  // if (!profile) {
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
          <h1 className="text-xl font-semibold">Inventario por Sucursal</h1>
          <div className="flex items-center gap-2">
            <Link href="/admin/inventory/movements">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historial de Movimientos</span>
                <span className="sm:hidden">Historial</span>
              </Button>
            </Link>
            <Link href="/admin/inventory/transfer">
              <Button size="sm" className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                <span className="hidden sm:inline">Trasladar Inventario</span>
                <span className="sm:hidden">Trasladar</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        {/* <InventoryView branches={branches || []} /> */}
        <InventoryView/>
      </main>
    </div>
  )
}
