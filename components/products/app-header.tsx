"use client"

import { useState } from "react"
import { Plus, Search, Book } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface AppHeaderProps {
  onEntriesPerPageChange?: (value: number) => void
  onSearchChange?: (value: string) => void
  entriesPerPage?: number
  searchTerm?: string
  total?: number
  currentPage?: number
}

export function AppHeader({
  onEntriesPerPageChange,
  onSearchChange,
  entriesPerPage = 50,
  searchTerm = "",
  total = 0,
  currentPage = 1,
}: AppHeaderProps) {

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value)
    onSearchChange?.(value)
  }

  const handleEntriesChange = (value: string) => {
    const numValue = Number.parseInt(value)
    onEntriesPerPageChange?.(numValue)
  }

  const start = total === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1
  const end = Math.min(currentPage * entriesPerPage, total)

  return (
    <header className="w-full">
      <div className="container mx-auto px-4">
        {/* Main header row */}
        <div className="flex h-16 items-center justify-between">


          <div className="flex items-center gap-4">
            <Link href="/admin/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Producto</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </Link>

            <Link
              href="/admin/catalog"
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm inline-flex items-center justify-center px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              <Book className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Cargar catálogo
            </Link>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-4 sm:gap-0">
          <div className="flex items-center gap-2 text-sm order-1 sm:order-none">
            <span>Mostrar</span>
            <Select value={entriesPerPage.toString()} onValueChange={handleEntriesChange}>
              <SelectTrigger className="w-20 h-8 bg-background dark:bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>
              productos{" "}
              {total > 0 && (
                <span className="text-[#45AAF2] font-semibold">
                  (del {start} al {end} de {total})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-none">
            <div className="relative flex-1 sm:flex-none">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                strokeWidth={3}
              />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={localSearchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-full sm:w-64 h-8 bg-white dark:bg-transparent placeholder:text-muted-foreground text-muted-foreground font-semibold"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
