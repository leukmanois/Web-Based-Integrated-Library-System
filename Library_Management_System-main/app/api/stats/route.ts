import { NextResponse } from "next/server"
import { getStatistics } from "@/lib/library-data"
import { isAuthenticatedRequest, unauthorizedResponse } from "@/lib/auth"

export async function GET(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const stats = await getStatistics()
  return NextResponse.json(stats)
}
