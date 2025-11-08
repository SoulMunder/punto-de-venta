import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const oldUrl = formData.get("oldUrl") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Delete old image if exists
    if (oldUrl) {
      try {
        await del(oldUrl)
      } catch (error) {
        console.error("Error deleting old image:", error)
        // Continue even if deletion fails
      }
    }

    // Upload new image to Vercel Blob
    const blob = await put(`products/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
