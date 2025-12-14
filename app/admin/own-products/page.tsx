import { ProductCardList } from "@/components/own-products/product-card-list"
import { redirect } from "next/navigation"
// import { createClient } from "@/lib/supabase/server"

export default async function ProductsPage() {
  // const supabase = await createClient()
  // const {
  //   data: { user },
  //   error,
  // } = await supabase.auth.getUser()

  // if (error || !user) {
  //   redirect("/auth/login")
  // }

  // // Check if user is admin
  // const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // if (!profile || profile.role !== "admin") {
  //   redirect("/")
  // }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Catálogo de Productos Interno</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        <ProductCardList />
      </main>
    </div>
  )
}
