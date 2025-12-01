import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface SaleReceiptData {
  id: string
  sale_date: string
  total_amount: number
  payment_received: number
  change_given: number
  sale_type?: string
  branch: {
    name: string
  }
  customer: {
    name: string
  } | null
  sale_items: {
    quantity: number
    unit_price: number
    product: {
      name: string
      truper_code: string
      brand: string | null
    }
  }[]
}

export async function generateSaleReceiptPDFPreview(receiptData: SaleReceiptData): Promise<string> {
  const doc = await createSaleReceiptPDF(receiptData)
  return doc.output("dataurlstring")
}

export async function openSaleReceiptPDFForPrint(receiptData: SaleReceiptData) {
  const doc = await createSaleReceiptPDF(receiptData)
  const pdfBlob = doc.output("blob")
  const pdfUrl = URL.createObjectURL(pdfBlob)
  window.open(pdfUrl, "_blank")
}

export async function downloadSaleReceiptPDF(receiptData: SaleReceiptData) {
  const doc = await createSaleReceiptPDF(receiptData)
  const fileName = `venta-${receiptData.id.substring(0, 8)}-${new Date().getTime()}.pdf`
  doc.save(fileName)
}

async function createSaleReceiptPDF(receiptData: SaleReceiptData): Promise<jsPDF> {
  // Reduced page height to half of letter size
  const customHeight = 139.7 // Half of letter height (279.4mm / 2)
  const letterWidth = 215.9 // Standard letter width
  
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [customHeight, letterWidth], // Letter width, half height
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10

  // Prepare sale date
  const saleDate = new Date(receiptData.sale_date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const saleTypeText =
    receiptData.sale_type === "credito"
      ? "VENTA A CRÉDITO"
      : receiptData.sale_type === "cotizacion"
        ? "COTIZACIÓN"
        : "REMISIÓN"

  // Load logo
  let logoImg: HTMLImageElement | null = null
  try {
    logoImg = new Image()
    logoImg.src = "/images/masicsa-logo.png"
    await new Promise((resolve) => {
      logoImg!.onload = resolve
      logoImg!.onerror = resolve
    })
    if (!logoImg.complete || logoImg.naturalHeight === 0) {
      logoImg = null
    }
  } catch (error) {
    console.error("[v0] Error loading logo:", error)
    logoImg = null
  }

  // Header function - will be called for each page
  const drawHeader = (data: any) => {
    const currentPage = data.pageNumber
    let yPos = 8

    if (logoImg) {
      // Logo on the left
      const logoWidth = 25
      const logoHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * logoWidth
      const logoY = yPos - 3
      doc.addImage(logoImg, "PNG", margin, logoY, logoWidth, logoHeight)
      
      // Right column: Company name, sale type, then customer details
      const rightColumnX = margin + logoWidth + 12
      let rightY = yPos
      
      // Company name
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("MASICSA", rightColumnX, rightY)
      rightY += 5

      // Sale type
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text(saleTypeText, rightColumnX, rightY)
      rightY += 6

      // Customer and sale details
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      
      doc.text(`Folio: ${receiptData.id.substring(0, 8).toUpperCase()}`, rightColumnX, rightY)
      rightY += 4
      doc.text(`Fecha: ${saleDate}`, rightColumnX, rightY)
      rightY += 4
      doc.text(`Sucursal: ${receiptData.branch.name}`, rightColumnX, rightY)
      rightY += 4
      doc.text(`Cliente: ${receiptData.customer?.name || "Cliente General"}`, rightColumnX, rightY)
    } else {
      // Fallback without logo
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("MASICSA", margin, yPos)
      yPos += 5

      doc.setFontSize(9)
      doc.text(saleTypeText, margin, yPos)
      yPos += 6

      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(`Folio: ${receiptData.id.substring(0, 8).toUpperCase()}`, margin, yPos)
      yPos += 4
      doc.text(`Fecha: ${saleDate}`, margin, yPos)
      yPos += 4
      doc.text(`Sucursal: ${receiptData.branch.name}`, margin, yPos)
      yPos += 4
      doc.text(`Cliente: ${receiptData.customer?.name || "Cliente General"}`, margin, yPos)
    }
  }

  // Footer function - will be called for each page
  const drawFooter = (data: any) => {
    const currentPage = data.pageNumber
    const totalPages = (doc as any).internal.getNumberOfPages()
    
    // Only draw totals and thank you on the last page
    if (currentPage === totalPages) {
      let footerY = pageHeight - 30 // Moved up from -20 to -30

      // Totals section
      const totalsStartX = margin
      const totalsWidth = 60
      
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text("Total:", totalsStartX, footerY)
      doc.text(`$${receiptData.total_amount.toFixed(2)}`, totalsStartX + totalsWidth, footerY, { align: "right" })
      footerY += 5

      if (receiptData.sale_type !== "cotizacion") {
        doc.setFont("helvetica", "normal")
        doc.text("Pago recibido:", totalsStartX, footerY)
        doc.text(`$${receiptData.payment_received.toFixed(2)}`, totalsStartX + totalsWidth, footerY, { align: "right" })
        footerY += 5

        doc.text("Cambio:", totalsStartX, footerY)
        doc.text(`$${receiptData.change_given.toFixed(2)}`, totalsStartX + totalsWidth, footerY, { align: "right" })
        footerY += 5
      }

      // Thank you message
      footerY += 2
      doc.setFontSize(7)
      doc.setFont("helvetica", "italic")
      doc.text("¡Gracias por su compra!", pageWidth / 2, footerY, { align: "center" })
    }
  }

  // Prepare table data
  const tableData = receiptData.sale_items.map((item) => {
    const productName = item.product.name
    const brand = item.product.brand || ""
    const code = item.product.truper_code || ""
    const fullProductName = `${productName}${brand ? ` - ${brand}` : ""}${code ? ` - ${code}` : ""}`

    return [
      fullProductName,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${(item.quantity * item.unit_price).toFixed(2)}`,
    ]
  })

  // Generate table with header and footer on each page
  autoTable(doc, {
    startY: 38, // Start after header
    head: [["Producto", "Cant.", "Precio", "Subtotal"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [41, 128, 185],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    margin: { left: margin, right: margin, top: 38, bottom: 35 }, // Increased bottom margin from 25 to 35
    didDrawPage: (data) => {
      // Draw header on every page
      drawHeader(data)
      // Draw footer on every page
      drawFooter(data)
    },
  })

  return doc
}
