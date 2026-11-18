import { NextResponse } from "next/server"
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE, verifyAdminCredentials } from "@/lib/auth"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const id = body && typeof body.id === "string" ? body.id.trim() : ""
  const password = body && typeof body.password === "string" ? body.password : ""

  if (!id || !password) {
    return NextResponse.json({ success: false, message: "Admin ID and password are required." }, { status: 400 })
  }

  const adminId = await verifyAdminCredentials(id, password)
  if (!adminId) {
    return NextResponse.json({ success: false, message: "Invalid admin ID or password." }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, createSessionToken(adminId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return response
}
