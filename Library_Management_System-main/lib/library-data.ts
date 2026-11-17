import { promises as fs } from "fs"
import path from "path"
import { DEFAULT_BORROW_DURATION_DAYS, type Book, type BorrowDurationDays, type Patron, type LibraryStats } from "./types"

const DATA_DIR = path.join(process.cwd(), "data")
const BOOKS_FILE = path.join(DATA_DIR, "books.json")
const PATRONS_FILE = path.join(DATA_DIR, "patrons.json")
function calculateDueReturnDate(
  borrowedDate: string | null,
  durationDays: BorrowDurationDays = DEFAULT_BORROW_DURATION_DAYS,
): string | null {
  if (!borrowedDate) return null

  const [year, month, day] = borrowedDate.slice(0, 10).split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  date.setUTCDate(date.getUTCDate() + durationDays)
  return date.toISOString().slice(0, 10)
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// ==================== BOOKS ====================

export async function loadBooks(): Promise<Book[]> {
  await ensureDataDir()
  let storedBooks: Book[]
  try {
    const content = await fs.readFile(BOOKS_FILE, "utf-8")
    storedBooks = JSON.parse(content)
  } catch {
    // Return default books if file doesn't exist
    const defaultBooks: Book[] = [
      { id: 1, title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960, status: "Available", borrowed_date: null, due_return_date: null },
      { id: 2, title: "1984", author: "George Orwell", year: 1949, status: "Available", borrowed_date: null, due_return_date: null },
      { id: 3, title: "Pride and Prejudice", author: "Jane Austen", year: 1813, status: "Checked Out", borrowed_date: "2026-03-15 10:30:00", due_return_date: "2026-03-29" },
      { id: 4, title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925, status: "Available", borrowed_date: null, due_return_date: null },
      { id: 5, title: "One Hundred Years of Solitude", author: "Gabriel Garcia Marquez", year: 1967, status: "Available", borrowed_date: null, due_return_date: null },
    ]
    await saveBooks(defaultBooks)
    return defaultBooks
  }

  const needsMigration = storedBooks.some((book) => !("due_return_date" in book))
  const books = storedBooks.map((book) => ({
    ...book,
    due_return_date: book.status === "Checked Out"
      ? book.due_return_date ?? calculateDueReturnDate(book.borrowed_date)
      : null,
  }))

  if (needsMigration) await saveBooks(books)
  return books
}

export async function saveBooks(books: Book[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(BOOKS_FILE, JSON.stringify(books, null, 2), "utf-8")
}

export async function getBookById(id: number): Promise<Book | undefined> {
  const books = await loadBooks()
  return books.find((b) => b.id === id)
}

export async function addBook(title: string, author: string, year: number): Promise<{ success: boolean; message: string; book?: Book }> {
  const books = await loadBooks()
  const newId = books.length > 0 ? Math.max(...books.map((b) => b.id)) + 1 : 1
  const newBook: Book = { id: newId, title, author, year, status: "Available", borrowed_date: null, due_return_date: null }
  books.push(newBook)
  await saveBooks(books)
  return { success: true, message: `Book "${title}" added successfully with ID ${newId}.`, book: newBook }
}

export async function updateBook(id: number, updates: Partial<Pick<Book, "title" | "author" | "year">>): Promise<{ success: boolean; message: string }> {
  const books = await loadBooks()
  const index = books.findIndex((b) => b.id === id)
  if (index === -1) return { success: false, message: `Book with ID ${id} not found.` }
  
  if (updates.title) books[index].title = updates.title
  if (updates.author) books[index].author = updates.author
  if (updates.year) books[index].year = updates.year
  
  await saveBooks(books)
  return { success: true, message: `Book ID ${id} updated successfully.` }
}

export async function deleteBook(id: number): Promise<{ success: boolean; message: string }> {
  const books = await loadBooks()
  const book = books.find((b) => b.id === id)
  if (!book) return { success: false, message: `Book with ID ${id} not found.` }
  if (book.status === "Checked Out") return { success: false, message: `Cannot delete book "${book.title}" - it is currently checked out.` }
  
  const filtered = books.filter((b) => b.id !== id)
  await saveBooks(filtered)
  return { success: true, message: `Book "${book.title}" deleted successfully.` }
}

// ==================== PATRONS ====================

export async function loadPatrons(): Promise<Patron[]> {
  await ensureDataDir()
  try {
    const content = await fs.readFile(PATRONS_FILE, "utf-8")
    return JSON.parse(content)
  } catch {
    // Return default patrons if file doesn't exist
    const defaultPatrons: Patron[] = [
      { id: 1, name: "John Smith", books_checked_out: [3] },
      { id: 2, name: "Emily Johnson", books_checked_out: [] },
      { id: 3, name: "Michael Brown", books_checked_out: [] },
    ]
    await savePatrons(defaultPatrons)
    return defaultPatrons
  }
}

export async function savePatrons(patrons: Patron[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(PATRONS_FILE, JSON.stringify(patrons, null, 2), "utf-8")
}

export async function getPatronById(id: number): Promise<Patron | undefined> {
  const patrons = await loadPatrons()
  return patrons.find((p) => p.id === id)
}

export async function addPatron(name: string): Promise<{ success: boolean; message: string; patron?: Patron }> {
  const patrons = await loadPatrons()
  const newId = patrons.length > 0 ? Math.max(...patrons.map((p) => p.id)) + 1 : 1
  const newPatron: Patron = { id: newId, name, books_checked_out: [] }
  patrons.push(newPatron)
  await savePatrons(patrons)
  return { success: true, message: `Patron "${name}" added successfully with ID ${newId}.`, patron: newPatron }
}

export async function updatePatron(id: number, name: string): Promise<{ success: boolean; message: string }> {
  const patrons = await loadPatrons()
  const index = patrons.findIndex((p) => p.id === id)
  if (index === -1) return { success: false, message: `Patron with ID ${id} not found.` }
  
  patrons[index].name = name
  await savePatrons(patrons)
  return { success: true, message: `Patron ID ${id} updated successfully.` }
}

export async function deletePatron(id: number): Promise<{ success: boolean; message: string }> {
  const patrons = await loadPatrons()
  const patron = patrons.find((p) => p.id === id)
  if (!patron) return { success: false, message: `Patron with ID ${id} not found.` }
  if (patron.books_checked_out.length > 0) return { success: false, message: `Cannot delete patron "${patron.name}" - they have ${patron.books_checked_out.length} book(s) checked out.` }
  
  const filtered = patrons.filter((p) => p.id !== id)
  await savePatrons(filtered)
  return { success: true, message: `Patron "${patron.name}" deleted successfully.` }
}

// ==================== LIBRARY OPERATIONS ====================

export async function borrowBook(
  bookId: number,
  patronId: number,
  durationDays: BorrowDurationDays = DEFAULT_BORROW_DURATION_DAYS,
): Promise<{ success: boolean; message: string }> {
  const books = await loadBooks()
  const patrons = await loadPatrons()
  
  const book = books.find((b) => b.id === bookId)
  if (!book) return { success: false, message: `Book with ID ${bookId} not found.` }
  
  const patron = patrons.find((p) => p.id === patronId)
  if (!patron) return { success: false, message: `Patron with ID ${patronId} not found.` }
  
  if (book.status === "Checked Out") return { success: false, message: `Book "${book.title}" is currently checked out.` }
  
  book.status = "Checked Out"
  book.borrowed_date = new Date().toISOString().replace("T", " ").slice(0, 19)
  book.due_return_date = calculateDueReturnDate(book.borrowed_date, durationDays)
  patron.books_checked_out.push(bookId)
  
  await saveBooks(books)
  await savePatrons(patrons)
  return { success: true, message: `Book "${book.title}" borrowed successfully by ${patron.name}.` }
}

export async function returnBook(bookId: number, patronId: number): Promise<{ success: boolean; message: string }> {
  const books = await loadBooks()
  const patrons = await loadPatrons()
  
  const book = books.find((b) => b.id === bookId)
  if (!book) return { success: false, message: `Book with ID ${bookId} not found.` }
  
  const patron = patrons.find((p) => p.id === patronId)
  if (!patron) return { success: false, message: `Patron with ID ${patronId} not found.` }
  
  if (!patron.books_checked_out.includes(bookId)) return { success: false, message: `Patron "${patron.name}" does not have book "${book.title}" checked out.` }
  
  book.status = "Available"
  book.borrowed_date = null
  book.due_return_date = null
  patron.books_checked_out = patron.books_checked_out.filter((id) => id !== bookId)
  
  await saveBooks(books)
  await savePatrons(patrons)
  return { success: true, message: `Book "${book.title}" returned successfully by ${patron.name}.` }
}

// ==================== STATISTICS ====================

export async function getStatistics(): Promise<LibraryStats> {
  const books = await loadBooks()
  const patrons = await loadPatrons()
  
  const availableBooks = books.filter((b) => b.status === "Available").length
  const activePatrons = patrons.filter((p) => p.books_checked_out.length > 0).length
  
  return {
    total_books: books.length,
    available_books: availableBooks,
    checked_out_books: books.length - availableBooks,
    total_patrons: patrons.length,
    active_patrons: activePatrons,
  }
}

// ==================== EXPORT TO CSV ====================

export async function exportBooksToCSV(): Promise<string> {
  const books = await loadBooks()
  const today = new Date().toISOString().slice(0, 10)
  const headers = ["ID", "Title", "Author", "Year", "Status", "Borrowed Date", "Due Return Date", "Overdue Status"]
  const rows = books.map((b) => [
    b.id,
    `"${b.title}"`,
    `"${b.author}"`,
    b.year,
    b.status,
    b.borrowed_date || "N/A",
    b.due_return_date || "N/A",
    b.status !== "Checked Out" ? "N/A" : b.due_return_date && b.due_return_date < today ? "Overdue" : "On time",
  ])
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
}

export async function exportPatronsToCSV(): Promise<string> {
  const patrons = await loadPatrons()
  const headers = ["ID", "Name", "Books Checked Out"]
  const rows = patrons.map((p) => [p.id, `"${p.name}"`, p.books_checked_out.length])
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
}
