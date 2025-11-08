"use client"

import { useState } from "react"
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

// --- Definición inline de la interfaz ---
interface ApiResponse {
  message?: string
  [key: string]: any
}

function FileUploader() {
  const { data: session, status } = useSession()
  const user = session?.user
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusUpload, setStatusUpload] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [isDragOver, setIsDragOver] = useState(false)
  const router = useRouter()

  const isExcelFile = (file: File): boolean => {
    const ext = file.name.split(".").pop()?.toLowerCase()
    const validExtensions = ["xls", "xlsx", "csv"]
    return ext ? validExtensions.includes(ext) : false
  }

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile && isExcelFile(selectedFile)) {
      setFile(selectedFile)
      setStatusUpload("idle")
      console.log(`Archivo seleccionado: ${selectedFile.name} (${selectedFile.type || "sin tipo MIME"})`)
    } else {
      toast.error("Formato incorrecto", {
        description: "Por favor selecciona un archivo Excel válido (.xls, .xlsx o .csv)",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) handleFileSelection(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false) }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) handleFileSelection(droppedFiles[0])
  }

  const uploadToAPI = async (file: File): Promise<ApiResponse> => {
    if (!user) throw new Error("Usuario no autenticado")

    const formData = new FormData()
    formData.append("archivo", file)
    formData.append("name", user.name) // 🔹 Solo enviamos el ID del usuario

    const response = await fetch("/api/purchases", { method: "POST", body: formData })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    return await response.json()
  }


  const handleUpload = async () => {
    if (!file) return
    if (!user) return toast.error("Debes iniciar sesión para subir archivos")

    try {
      setIsUploading(true)
      setStatusUpload("uploading")
      setProgress(0)

      toast.info("Procesando archivo Excel...", { description: "Esto puede tardar unos segundos..." })

      const progressInterval = setInterval(() => {
        setProgress(prev => prev >= 90 ? 90 : prev + 10)
      }, 200)

      const result = await uploadToAPI(file)

      clearInterval(progressInterval)
      setProgress(100)
      setStatusUpload("success")
      toast.success("Archivo procesado correctamente.", { description: result.message || "Excel subido exitosamente" })

    } catch (error) {
      setStatusUpload("error")
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error("Error al procesar el archivo", { description: errorMessage })
    } finally {
      setIsUploading(false)
    }
  }

  const handleViewData = () => router.push("/admin/purchases")

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-[#150d59] dark:text-foreground">Subir Archivo Excel</CardTitle>
        <CardDescription>Sube un archivo Excel (.xls, .xlsx o .csv) con la información de las compras que deseas registrar.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${isDragOver ? "border-primary bg-primary/10 scale-105" : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"}`}
            onClick={() => document.getElementById("file-upload")?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className={`h-10 w-10 transition-colors ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium">
                {file ? `${file.name} (${formatFileSize(file.size)})` : isDragOver ? "Suelta el archivo Excel aquí" : "Haz clic o arrastra un archivo Excel aquí"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isDragOver ? "Archivo detectado - suéltalo para cargarlo" : "El archivo debe ser Excel (.xls, .xlsx o .csv)"}
              </p>
            </div>
            <input id="file-upload" type="file" accept=".xls,.xlsx,.csv" className="hidden" onChange={handleFileChange} />
          </div>

          {statusUpload === "success" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500 justify-center">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Archivo procesado correctamente</span>
              </div>
              <Button onClick={handleViewData} className="w-full">Ver compras</Button>
            </div>
          )}

          {statusUpload === "error" && (
            <div className="flex items-center gap-2 text-red-500 justify-center">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Error al procesar el archivo</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleUpload} disabled={!file || isUploading || statusUpload === "success" || status !== "authenticated"}>
          {isUploading ? (
            <span className="flex items-center gap-2">
              {progress < 80 ? <Upload className="h-4 w-4 animate-pulse" /> : <Loader2 className="h-4 w-4 animate-spin" />}
              {progress < 80 ? "Subiendo..." : "Procesando..."}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Procesar Archivo Excel
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

// --- Página envolviendo el FileUploader ---
export default function Page() {
  return (
    <div className="container mx-auto py-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-primary">Cargar Compras</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Sube un archivo Excel con los datos de las compras que deseas registrar.
          </p>
        </div>

        <FileUploader />

      </div>
    </div>
  )
}
