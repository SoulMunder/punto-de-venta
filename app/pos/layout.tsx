import type React from "react"
import { redirect } from "next/navigation"
import { NavMenu } from "@/components/layout/nav-menu"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/config"
import { AllowedRole } from "@/lib/types"

export default async function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user ) {
    redirect("/auth/login")
  }
  
  const role = session.user.role as AllowedRole
  return (
    <div className="min-h-screen flex flex-col">
      <NavMenu role={role} userName={session.user.name} />
      {children}
    </div>
  )
}
