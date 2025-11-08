import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    // Create admin client with service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Update user to confirm email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true })

    if (error) {
      console.error("[v0] Error confirming user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in auto-confirm:", error)
    return NextResponse.json({ error: "Failed to confirm user" }, { status: 500 })
  }
}
