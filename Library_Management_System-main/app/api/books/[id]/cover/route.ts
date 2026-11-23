import { NextResponse } from "next/server"
import { isAuthenticatedRequest, unauthorizedResponse } from "@/lib/auth"
import { getBookCoverKey } from "@/lib/library-data"
import { readBookCover } from "@/lib/book-covers"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()

  try {
    const { id: idText } = await params
    const id = Number(idText)
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ success: false, message: "A valid book ID is required." }, { status: 400 })
    }
    const key = await getBookCoverKey(id)
    if (!key) return NextResponse.json({ success: false, message: "Book cover not found." }, { status: 404 })

    const cover = await readBookCover(key)
    return new Response(cover.body, {
      headers: {
        "Content-Type": cover.contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("GET /api/books/[id]/cover error:", error)
    return NextResponse.json({ success: false, message: "Unable to load the book cover." }, { status: 500 })
  }
}
