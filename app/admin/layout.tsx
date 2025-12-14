import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/config"
import { AllowedRole } from "@/lib/types"
import { SidebarProvider } from "@/components/layout/sidebar-context"
import { Sidebar } from "@/components/layout/sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) redirect("/auth/login")

  const role = session.user.role as AllowedRole

  return (
    <SidebarProvider>
      <div className="min-h-screen flex">
        <Sidebar role={role} userName={session.user.name} />
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  )
}
