"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, History, Plus, Repeat, Trash } from "lucide-react"
import { InventoryView } from "@/components/inventory/inventory-view"

export default function InventoryPage() {
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [deleteInventoryModalOpen, setDeleteInventoryModalOpen] = useState(false)

  return (
    <div className="flex flex-col">
      {/* 🧭 Encabezado */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Inventario por Sucursal</h1>

          <div className="flex items-center gap-2">
            {/* 🟢 Botón Gestión Manual */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManualModalOpen(true)}
              className="gap-2 bg-transparent"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Gestión Manual</span>
              <span className="sm:hidden">Manual</span>
            </Button>

            {/* 🔵 Botón: Entradas y Salidas */}
            <Link href="/admin/inventory-logs">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Entradas / Salidas</span>
                <span className="sm:hidden">Movimientos</span>
              </Button>
            </Link>

            {/* 🟣 Botón: Traslados entre Sucursales */}
            <Link href="/admin/inventory/movements">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Repeat className="h-4 w-4" />
                <span className="hidden sm:inline">Traslados</span>
                <span className="sm:hidden">Traspasos</span>
              </Button>
            </Link>


            {/* 🟠 Botón Trasladar */}
            <Link href="/admin/inventory/transfer">
              <Button size="sm" className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                <span className="hidden sm:inline">Trasladar Inventario</span>
                <span className="sm:hidden">Trasladar</span>
              </Button>
            </Link>

            <Button
              variant="destructive"  // cambia el color a rojo
              size="sm"
              onClick={() => setDeleteInventoryModalOpen(true)}
              className="gap-2"
            >
              <Trash className="h-4 w-4" />
              <span className="hidden sm:inline">Eliminar Inventario</span>
              <span className="sm:hidden">Eliminar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 📦 Contenido principal */}
      <main className="flex-1 container mx-auto p-6">
        <InventoryView
          manualModalOpen={manualModalOpen}
          setManualModalOpen={setManualModalOpen}
          deleteInventoryModalOpen={deleteInventoryModalOpen}
          setDeleteInventoryModalOpen={setDeleteInventoryModalOpen}
        />
      </main>
    </div>
  )
}
