import { NextResponse } from "next/server"
import { borrowBook, returnBook } from "@/lib/library-data"
import { DEFAULT_BORROW_DURATION_DAYS, isBorrowDurationDays } from "@/lib/types"

export async function POST(request: Request) {
  const body = await request.json()
  const { action, bookId, patronId, durationDays } = body
  
  if (!action || !bookId || !patronId) {
    return NextResponse.json({ success: false, message: "Action, bookId, and patronId are required." }, { status: 400 })
  }
  
  if (action === "borrow") {
    if (durationDays !== undefined && !isBorrowDurationDays(durationDays)) {
      return NextResponse.json({ success: false, message: "durationDays must be one of the supported loan durations." }, { status: 400 })
    }

    const result = await borrowBook(
      Number(bookId),
      Number(patronId),
      durationDays ?? DEFAULT_BORROW_DURATION_DAYS,
    )
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } else if (action === "return") {
    const result = await returnBook(Number(bookId), Number(patronId))
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  }
  
  return NextResponse.json({ success: false, message: "Invalid action. Use 'borrow' or 'return'." }, { status: 400 })
}
