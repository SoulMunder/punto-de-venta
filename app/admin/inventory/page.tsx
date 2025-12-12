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
    <div className="flex flex-col min-h-screen">
      {/* 🧭 Encabezado */}
      <header className="border-b bg-white  top-0 z-30">
        <div className="container mx-auto px-4">
          {/* Layout para pantallas grandes */}
          <div className="hidden lg:flex lg:h-16 items-center justify-between">
            <h1 className="text-xl font-semibold">Inventario por Sucursal</h1>

            <div className="flex items-center gap-2">
              {/* 🟢 Botón Gestión Manual */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManualModalOpen(true)}
                className="gap-2 bg-transparent whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Gestión Manual</span>
              </Button>

              {/* 🔵 Botón: Entradas y Salidas */}
              <Link href="/admin/inventory-logs">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent whitespace-nowrap">
                  <History className="h-4 w-4" />
                  <span>Entradas / Salidas</span>
                </Button>
              </Link>

              {/* 🟣 Botón: Traslados */}
              <Link href="/admin/inventory/movements">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent whitespace-nowrap">
                  <Repeat className="h-4 w-4" />
                  <span>Traslados</span>
                </Button>
              </Link>

              {/* 🟠 Botón Trasladar */}
              <Link href="/admin/inventory/transfer">
                <Button size="sm" className="gap-2 whitespace-nowrap">
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>Trasladar Inventario</span>
                </Button>
              </Link>

              {/* 🔴 Botón Eliminar */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteInventoryModalOpen(true)}
                className="gap-2 whitespace-nowrap"
              >
                <Trash className="h-4 w-4" />
                <span>Eliminar Inventario</span>
              </Button>
            </div>
          </div>

          {/* Layout para tablets y móviles */}
          <div className="lg:hidden">
            {/* Título */}
            <div className="py-3 border-b">
              <h1 className="text-lg md:text-xl font-semibold">Inventario por Sucursal</h1>
            </div>

            {/* Botones centrados con scroll horizontal */}
            <div className="overflow-x-auto hide-scrollbar lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0">
              <div className="flex justify-center items-center gap-2 py-3 min-w-max">
                {/* 🟢 Botón Gestión Manual */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManualModalOpen(true)}
                  className="gap-2 bg-transparent whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span className="md:hidden">Manual</span>
                  <span className="hidden md:inline">Gestión Manual</span>
                </Button>

                {/* 🔵 Botón: Entradas y Salidas */}
                <Link href="/admin/inventory-logs">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent whitespace-nowrap">
                    <History className="h-4 w-4" />
                    <span className="lg:hidden">Historial</span>
                    <span className="hidden lg:inline">Entradas / Salidas</span>
                  </Button>
                </Link>

                {/* 🟣 Botón: Traslados */}
                <Link href="/admin/inventory/movements">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent whitespace-nowrap">
                    <Repeat className="h-4 w-4" />
                    <span>Traslados</span>
                  </Button>
                </Link>

                {/* 🟠 Botón Trasladar */}
                <Link href="/admin/inventory/transfer">
                  <Button size="sm" className="gap-2 whitespace-nowrap">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span className="lg:hidden">Trasladar</span>
                    <span className="hidden lg:inline">Trasladar Inventario</span>
                  </Button>
                </Link>

                {/* 🔴 Botón Eliminar */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteInventoryModalOpen(true)}
                  className="gap-2 whitespace-nowrap"
                >
                  <Trash className="h-4 w-4" />
                  <span className="lg:hidden">Eliminar</span>
                  <span className="hidden lg:inline">Eliminar Inventario</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 📦 Contenido principal */}
      <main className="flex-1 container mx-auto p-4 md:p-6">
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