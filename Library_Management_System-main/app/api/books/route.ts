import { NextResponse } from "next/server"
import { loadBooks, addBook, updateBook, deleteBook } from "@/lib/library-data"
import { isAuthenticatedRequest, unauthorizedResponse } from "@/lib/auth"

export async function GET(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const books = await loadBooks()
  return NextResponse.json(books)
}

export async function POST(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const body = await request.json()
  const { id, title, author, year, genre } = body
  
  if (!Number.isInteger(Number(id)) || Number(id) < 1 || !title || !author || !genre || !year) {
    return NextResponse.json({ success: false, message: "A positive whole-number ID, title, author, genre, and year are required." }, { status: 400 })
  }
  
  const result = await addBook(Number(id), title, author, Number(year), genre)
  return NextResponse.json(result, { status: result.success ? 201 : 409 })
}

export async function PUT(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const body = await request.json()
  const { id, title, author, genre, year } = body
  
  if (!id) {
    return NextResponse.json({ success: false, message: "Book ID is required." }, { status: 400 })
  }
  
  const result = await updateBook(Number(id), { title, author, genre, year: year ? Number(year) : undefined })
  return NextResponse.json(result, { status: result.success ? 200 : 404 })
}

export async function DELETE(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  
  if (!id) {
    return NextResponse.json({ success: false, message: "Book ID is required." }, { status: 400 })
  }
  
  const result = await deleteBook(Number(id))
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
