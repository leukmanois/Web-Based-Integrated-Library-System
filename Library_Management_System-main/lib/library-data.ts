import type { Book, Patron, LibraryStats } from "./types"
import { ensureDatabaseSchema, sql } from "./database"

export async function loadBooks(): Promise<Book[]> {
  await ensureDatabaseSchema()
  const rows = await sql`
    SELECT id, title, author, genre, year, status, borrowed_date
    FROM books
    ORDER BY id
  `
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre || "Uncategorized",
    year: row.year,
    status: row.status,
    borrowed_date: row.borrowed_date,
  })) as Book[]
}

export async function getBookById(id: number): Promise<Book | undefined> {
  await ensureDatabaseSchema()
  const rows = await sql`
    SELECT id, title, author, genre, year, status, borrowed_date
    FROM books
    WHERE id = ${id}
  `
  return rows[0] as Book | undefined
}

export async function addBook(id: number, title: string, author: string, year: number, genre: string): Promise<{ success: boolean; message: string; book?: Book }> {
  await ensureDatabaseSchema()
  if (!Number.isInteger(id) || id < 1) {
    return { success: false, message: "Book ID must be a positive whole number." }
  }
  const existing = await sql`SELECT id FROM books WHERE id = ${id}`
  if (existing.length > 0) {
    return { success: false, message: `Book ID ${id} is already in use.` }
  }
  const [book] = await sql`
    INSERT INTO books (id, title, author, genre, year, status, borrowed_date)
    VALUES (${id}, ${title}, ${author}, ${genre}, ${year}, 'Available', NULL)
    RETURNING id, title, author, genre, year, status, borrowed_date
  `
  return { success: true, message: `Book "${title}" added successfully with ID ${id}.`, book: book as Book }
}

export async function updateBook(id: number, updates: Partial<Pick<Book, "title" | "author" | "genre" | "year">>): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const existing = await sql`SELECT id FROM books WHERE id = ${id}`
  if (existing.length === 0) return { success: false, message: `Book with ID ${id} not found.` }
  await sql`
    UPDATE books
    SET title = COALESCE(${updates.title ?? null}, title),
        author = COALESCE(${updates.author ?? null}, author),
        genre = COALESCE(${updates.genre ?? null}, genre),
        year = COALESCE(${updates.year ?? null}, year)
    WHERE id = ${id}
  `
  return { success: true, message: `Book ID ${id} updated successfully.` }
}

export async function deleteBook(id: number): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const [book] = await sql`SELECT title, status FROM books WHERE id = ${id}`
  if (!book) return { success: false, message: `Book with ID ${id} not found.` }
  if (book.status === "Checked Out") return { success: false, message: `Cannot delete book "${book.title}" - it is currently checked out.` }
  await sql`DELETE FROM loans WHERE book_id = ${id}`
  await sql`DELETE FROM books WHERE id = ${id}`
  return { success: true, message: `Book "${book.title}" deleted successfully.` }
}

export async function loadPatrons(): Promise<Patron[]> {
  await ensureDatabaseSchema()
  const rows = await sql`
    SELECT p.id, p.name,
           COALESCE(array_agg(l.book_id ORDER BY l.book_id) FILTER (WHERE l.book_id IS NOT NULL), ARRAY[]::integer[]) AS books_checked_out
    FROM patrons p
    LEFT JOIN loans l ON l.patron_id = p.id
    GROUP BY p.id, p.name
    ORDER BY p.id
  `
  return rows as Patron[]
}

export async function getPatronById(id: number): Promise<Patron | undefined> {
  const patrons = await loadPatrons()
  return patrons.find((patron) => patron.id === id)
}

export async function addPatron(id: number, name: string): Promise<{ success: boolean; message: string; patron?: Patron }> {
  await ensureDatabaseSchema()
  if (!Number.isInteger(id) || id < 1) {
    return { success: false, message: "Patron ID must be a positive whole number." }
  }
  const existing = await sql`SELECT id FROM patrons WHERE id = ${id}`
  if (existing.length > 0) {
    return { success: false, message: `Patron ID ${id} is already in use.` }
  }
  await sql`INSERT INTO patrons (id, name) VALUES (${id}, ${name})`
  return { success: true, message: `Patron "${name}" added successfully with ID ${id}.`, patron: { id, name, books_checked_out: [] } }
}

export async function updatePatron(id: number, name: string): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const result = await sql`UPDATE patrons SET name = ${name} WHERE id = ${id} RETURNING id`
  if (result.length === 0) return { success: false, message: `Patron with ID ${id} not found.` }
  return { success: true, message: `Patron ID ${id} updated successfully.` }
}

export async function deletePatron(id: number): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const [patron] = await sql`
    SELECT p.name, COUNT(l.book_id)::int AS loan_count
    FROM patrons p
    LEFT JOIN loans l ON l.patron_id = p.id
    WHERE p.id = ${id}
    GROUP BY p.id, p.name
  `
  if (!patron) return { success: false, message: `Patron with ID ${id} not found.` }
  if (patron.loan_count > 0) return { success: false, message: `Cannot delete patron "${patron.name}" - they have ${patron.loan_count} book(s) checked out.` }
  await sql`DELETE FROM patrons WHERE id = ${id}`
  return { success: true, message: `Patron "${patron.name}" deleted successfully.` }
}

export async function borrowBook(bookId: number, patronId: number): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const [book] = await sql`SELECT title, status FROM books WHERE id = ${bookId}`
  if (!book) return { success: false, message: `Book with ID ${bookId} not found.` }
  const [patron] = await sql`SELECT name FROM patrons WHERE id = ${patronId}`
  if (!patron) return { success: false, message: `Patron with ID ${patronId} not found.` }
  if (book.status === "Checked Out") return { success: false, message: `Book "${book.title}" is currently checked out.` }

  const borrowedDate = new Date().toISOString().replace("T", " ").slice(0, 19)
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const loan = await sql`
    WITH updated_book AS (
      UPDATE books
      SET status = 'Checked Out',
          borrowed_date = ${borrowedDate},
          borrow_count = borrow_count + 1
      WHERE id = ${bookId} AND status = 'Available'
      RETURNING id
    )
    INSERT INTO loans (patron_id, book_id, borrowed_date, due_return_date)
    SELECT ${patronId}, id, ${borrowedDate}, ${dueDate}
    FROM updated_book
    RETURNING book_id
  `
  if (loan.length === 0) return { success: false, message: `Book "${book.title}" is currently checked out.` }
  return { success: true, message: `Book "${book.title}" borrowed successfully by ${patron.name}.` }
}

export async function returnBook(bookId: number, patronId: number): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const [book] = await sql`SELECT title FROM books WHERE id = ${bookId}`
  if (!book) return { success: false, message: `Book with ID ${bookId} not found.` }
  const [patron] = await sql`SELECT name FROM patrons WHERE id = ${patronId}`
  if (!patron) return { success: false, message: `Patron with ID ${patronId} not found.` }
  const loan = await sql`SELECT 1 FROM loans WHERE patron_id = ${patronId} AND book_id = ${bookId}`
  if (loan.length === 0) return { success: false, message: `Patron "${patron.name}" does not have book "${book.title}" checked out.` }

  await sql`DELETE FROM loans WHERE patron_id = ${patronId} AND book_id = ${bookId}`
  await sql`UPDATE books SET status = 'Available', borrowed_date = NULL WHERE id = ${bookId}`
  return { success: true, message: `Book "${book.title}" returned successfully by ${patron.name}.` }
}

export async function getStatistics(): Promise<LibraryStats> {
  await ensureDatabaseSchema()
  const [[stats], [recentBook], [mostBorrowedBook]] = await Promise.all([
    sql`
    SELECT
      (SELECT COUNT(*)::int FROM books) AS total_books,
      (SELECT COUNT(*)::int FROM books WHERE status = 'Available') AS available_books,
      (SELECT COUNT(*)::int FROM patrons) AS total_patrons,
      (SELECT COUNT(DISTINCT patron_id)::int FROM loans) AS active_patrons
    `,
    sql`
      SELECT id, title, author, genre, year
      FROM books
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    sql`
      SELECT id, title, author, genre, year, borrow_count
      FROM books
      WHERE borrow_count > 0
      ORDER BY borrow_count DESC, id ASC
      LIMIT 1
    `,
  ])
  return {
    total_books: stats.total_books,
    available_books: stats.available_books,
    checked_out_books: stats.total_books - stats.available_books,
    total_patrons: stats.total_patrons,
    active_patrons: stats.active_patrons,
    recent_book: recentBook
      ? {
          id: recentBook.id,
          title: recentBook.title,
          author: recentBook.author,
          genre: recentBook.genre,
          year: recentBook.year,
        }
      : null,
    most_borrowed_book: mostBorrowedBook
      ? {
          id: mostBorrowedBook.id,
          title: mostBorrowedBook.title,
          author: mostBorrowedBook.author,
          genre: mostBorrowedBook.genre,
          year: mostBorrowedBook.year,
          borrow_count: mostBorrowedBook.borrow_count,
        }
      : null,
  }
}

export async function exportBooksToCSV(): Promise<string> {
  const books = await loadBooks()
  const headers = ["ID", "Title", "Author", "Genre", "Year", "Status", "Borrowed Date"]
  const rows = books.map((book) => [
    book.id,
    `"${book.title}"`,
    `"${book.author}"`,
    `"${book.genre}"`,
    book.year,
    book.status,
    book.borrowed_date || "N/A",
  ])
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export async function exportPatronsToCSV(): Promise<string> {
  const patrons = await loadPatrons()
  const headers = ["ID", "Name", "Books Checked Out"]
  const rows = patrons.map((patron) => [patron.id, `"${patron.name}"`, patron.books_checked_out.length])
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}
