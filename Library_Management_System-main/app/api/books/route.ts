import { NextResponse } from "next/server"
import { loadBooks, addBook, updateBook, deleteBook } from "@/lib/library-data"
import { isAuthenticatedRequest, unauthorizedResponse } from "@/lib/auth"

// Normalize text before comparing book titles and authors
function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

// Returns a 409 response if another book has the same title AND author,
// otherwise returns null. Pass excludeId when editing, so a book isn't
// flagged as a duplicate of itself.
async function checkDuplicateBook(
  title: string,
  author: string,
  excludeId?: number
) {
  // Normalize the title and author for comparison
  const newTitle = normalize(title)
  const newAuthor = normalize(author)
  const books = await loadBooks()
  const duplicate = books.find(
    (book) =>
      book.id !== excludeId &&
      normalize(book.title) === newTitle &&
      normalize(book.author) === newAuthor
  )
  // If a duplicate is found, return a conflict response
  if (duplicate) {
    return NextResponse.json(
      {
        success: false,
        message: "Oops! This book already exists in your library."
      },
      { status: 409 }
    )
  }
  return null
}

// API route for managing books in the library
export async function GET(request: Request) {
  // Check if the request is authenticated
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  // Return all books
  const books = await loadBooks()
  return NextResponse.json(books)
}

// API route for adding a new book to the library
export async function POST(request: Request) {

  // Check if the request is authenticated
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()

  // Parse the request body to get the book details
  const body = await request.json()
  const { id, title, author, year, genre } = body
  
  // Validate that the book ID is a positive whole number and that all required fields are provided
  if (!Number.isInteger(Number(id)) || Number(id) < 1 || !title || !author || !genre || !year) {
    return NextResponse.json({ success: false, message: "A positive whole-number ID, title, author, genre, and year are required." }, { status: 400 })
  }

  // Block only if ANOTHER book has the same title AND the same author
  const duplicateResponse = await checkDuplicateBook(title, author)
  if (duplicateResponse) return duplicateResponse

  // Add the new book
  const result = await addBook(Number(id), title, author, Number(year), genre)
  return NextResponse.json(result, { status: result.success ? 201 : 409 })
}

// API route for updating an existing book in the library
export async function PUT(request: Request) {

  // Check if the request is authenticated
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()

  // Parse the request body to get the book details
  const body = await request.json()
  const { id, title, author, genre, year } = body
  
  // Validate that the book ID is provided
  if (!id) {
    return NextResponse.json({ success: false, message: "Book ID is required." }, { status: 400 })
  }
  
  // Block only if ANOTHER book has the same title AND the same author
  if (title?.trim() && author?.trim()) {
    const duplicateResponse = await checkDuplicateBook(title, author, Number(id))
    if (duplicateResponse) return duplicateResponse
  }

  // Update the book with the provided ID
  const result = await updateBook(Number(id), { title, author, genre, year: year ? Number(year) : undefined })
  return NextResponse.json(result, { status: result.success ? 200 : 404 })
}

// API route for deleting a book from the library
export async function DELETE(request: Request) {

  // Check if the request is authenticated
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  
  // Validate that the book ID is provided
  if (!id) {
    return NextResponse.json({ success: false, message: "Book ID is required." }, { status: 400 })
  }
  
  // Delete the book with the provided ID
  const result = await deleteBook(Number(id))
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
