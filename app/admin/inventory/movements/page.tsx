// import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MovementsList } from "@/components/inventory/movements-list"

export default async function MovementsPage() {
  // const supabase = await createClient()

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login")
  // }

  // const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // if (!profile) {
  //   redirect("/login")
  // }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Historial de Traslados</h1>
          <p className="text-sm text-muted-foreground mt-1">Movimientos de inventario entre sucursales</p>
        </div>
      </div>

      <MovementsList />
    </div>
  )
}
