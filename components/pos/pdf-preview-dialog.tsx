"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"

interface PDFPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pdfDataUrl: string
  onDownload: () => void
}

export function PDFPreviewDialog({ open, onOpenChange, pdfDataUrl, onDownload }: PDFPreviewDialogProps) {
  const handlePrint = () => {
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.src = pdfDataUrl
    document.body.appendChild(iframe)
    iframe.onload = () => {
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Vista Previa del Recibo</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg bg-muted/50">
          <iframe src={pdfDataUrl} className="w-full h-[600px]" title="Vista previa del PDF" />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
