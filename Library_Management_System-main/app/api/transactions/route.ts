import { NextResponse } from "next/server"
import { borrowBook, returnBook } from "@/lib/library-data"
import { isAuthenticatedRequest, unauthorizedResponse } from "@/lib/auth"

export async function POST(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const body = await request.json()
  const { action, bookId, patronId } = body
  
  if (!action || !bookId || !patronId) {
    return NextResponse.json({ success: false, message: "Action, bookId, and patronId are required." }, { status: 400 })
  }
  
  if (action === "borrow") {
    const result = await borrowBook(Number(bookId), Number(patronId))
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } else if (action === "return") {
    const result = await returnBook(Number(bookId), Number(patronId))
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  }
  
  return NextResponse.json({ success: false, message: "Invalid action. Use 'borrow' or 'return'." }, { status: 400 })
}
