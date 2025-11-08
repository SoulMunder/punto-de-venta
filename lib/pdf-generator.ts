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
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [215.9, 139.7],
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 10

  let yPosition = 15

  try {
    const logoImg = new Image()
    logoImg.src = "/images/masicsa-logo.png"
    await new Promise((resolve) => {
      logoImg.onload = resolve
      logoImg.onerror = resolve
    })

    if (logoImg.complete && logoImg.naturalHeight !== 0) {
      const logoWidth = 25
      const logoHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * logoWidth
      doc.addImage(logoImg, "PNG", margin, yPosition, logoWidth, logoHeight)

      // Company name and sale type next to logo
      const textStartX = margin + logoWidth + 5
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("MASICSA", textStartX, yPosition + 5)

      const saleTypeText =
        receiptData.sale_type === "credito"
          ? "VENTA A CRÉDITO"
          : receiptData.sale_type === "cotizacion"
            ? "COTIZACIÓN"
            : "REMISIÓN"

      doc.setFontSize(11)
      doc.text(saleTypeText, textStartX, yPosition + 12)

      yPosition += Math.max(logoHeight, 15) + 8
    }
  } catch (error) {
    console.error("[v0] Error loading logo:", error)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("MASICSA", margin, yPosition)
    yPosition += 8

    const saleTypeText =
      receiptData.sale_type === "credito"
        ? "VENTA A CRÉDITO"
        : receiptData.sale_type === "cotizacion"
          ? "COTIZACIÓN"
          : "REMISIÓN"

    doc.setFontSize(12)
    doc.text(saleTypeText, margin, yPosition)
    yPosition += 8
  }

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

  autoTable(doc, {
    startY: yPosition,
    head: [["Producto", "Cant.", "Precio", "Subtotal"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [41, 128, 185],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
    margin: { left: margin, right: margin },
  })

  yPosition = (doc as any).lastAutoTable.finalY + 10

  const leftColumnX = margin
  const rightColumnX = pageWidth / 2 + 10
  let leftY = yPosition
  let rightY = yPosition

  // Left column: Totals
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Total:", leftColumnX, leftY)
  doc.text(`$${receiptData.total_amount.toFixed(2)}`, leftColumnX + 40, leftY, { align: "right" })
  leftY += 6

  if (receiptData.sale_type !== "cotizacion") {
    doc.setFont("helvetica", "normal")
    doc.text("Pago recibido:", leftColumnX, leftY)
    doc.text(`$${receiptData.payment_received.toFixed(2)}`, leftColumnX + 40, leftY, { align: "right" })
    leftY += 6

    doc.text("Cambio:", leftColumnX, leftY)
    doc.text(`$${receiptData.change_given.toFixed(2)}`, leftColumnX + 40, leftY, { align: "right" })
  }

  // Right column: Customer data
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  const saleDate = new Date(receiptData.sale_date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  doc.text(`Fecha: ${saleDate}`, rightColumnX, rightY)
  rightY += 5
  doc.text(`Sucursal: ${receiptData.branch.name}`, rightColumnX, rightY)
  rightY += 5
  doc.text(`Cliente: ${receiptData.customer?.name || "Cliente General"}`, rightColumnX, rightY)
  rightY += 5
  doc.text(`Folio: ${receiptData.id.substring(0, 8).toUpperCase()}`, rightColumnX, rightY)

  // Footer message
  const finalY = Math.max(leftY, rightY) + 10
  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.text("¡Gracias por su compra!", pageWidth / 2, finalY, { align: "center" })

  return doc
}
