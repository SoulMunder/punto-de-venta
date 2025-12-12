"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps {
  currentPage: number
  entriesPerPage: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

export function DataTablePagination({
  currentPage,
  entriesPerPage,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: DataTablePaginationProps) {
  const totalPages = Math.ceil(totalCount / entriesPerPage)
  const start = totalCount === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1
  const end = Math.min(currentPage * entriesPerPage, totalCount)

  return (
    <div className="w-full px-2 py-6">
      {/* Layout responsivo: columna en móvil, fila con justify-between en desktop */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        {/* Texto informativo - centrado en móvil, izquierda en desktop */}
        <div className="text-sm text-muted-foreground text-center lg:text-left">
          {totalCount > 0
            ? `Mostrando productos del ${start} al ${end} de ${totalCount}`
            : `No hay productos para mostrar`}
        </div>

        {/* Controles - centrados en móvil, derecha en desktop */}
        <div className="flex flex-wrap justify-center items-center gap-6">
          {/* Filas por página */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium whitespace-nowrap">Productos por página</p>
            <Select
              value={`${entriesPerPage}`}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={`${entriesPerPage}`} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Página actual */}
          <div className="text-sm font-medium whitespace-nowrap">
            Página {currentPage} de {totalPages || 1}
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden sm:flex h-8 w-8 p-0 bg-transparent"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="hidden sm:flex h-8 w-8 p-0 bg-transparent"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}