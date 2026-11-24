import { NextResponse } from "next/server"
import { loadTransactionHistory } from "@/lib/library-data"
import { isAuthenticatedRequest, unauthorizedResponse } from "@/lib/auth"

export async function GET(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  try {
    const history = await loadTransactionHistory()
    return NextResponse.json(history)
  } catch (error: any) {
    console.error("GET /api/transactions/history error:", error)
    return NextResponse.json({ success: false, message: error?.message || "Unable to load transaction history." }, { status: 500 })
  }
}
