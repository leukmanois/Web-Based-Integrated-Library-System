import { neon } from "@neondatabase/serverless"
import { promises as fs } from "fs"
import path from "path"
import type { Book, Patron } from "./types"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be configured.")
  }
  return neon(databaseUrl)
}

export const sql = getSql()

let schemaReady: Promise<void> | null = null

async function migrateJsonData() {
  const dataDir = path.join(process.cwd(), "data")
  let books: Book[] = []
  let patrons: Patron[] = []

  try {
    books = JSON.parse(await fs.readFile(path.join(dataDir, "books.json"), "utf-8")) as Book[]
  } catch {}

  try {
    patrons = JSON.parse(await fs.readFile(path.join(dataDir, "patrons.json"), "utf-8")) as Patron[]
  } catch {}

  if (books.length === 0) {
    books = [
      { id: 1, title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Classic Fiction", year: 1960, status: "Available", borrowed_date: null },
      { id: 2, title: "1984", author: "George Orwell", genre: "Dystopian Fiction", year: 1949, status: "Available", borrowed_date: null },
      { id: 3, title: "Pride and Prejudice", author: "Jane Austen", genre: "Romance", year: 1813, status: "Checked Out", borrowed_date: "2026-03-15 10:30:00" },
      { id: 4, title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Classic Fiction", year: 1925, status: "Available", borrowed_date: null },
      { id: 5, title: "One Hundred Years of Solitude", author: "Gabriel Garcia Marquez", genre: "Magical Realism", year: 1967, status: "Available", borrowed_date: null },
    ]
  }

  if (patrons.length === 0) {
    patrons = [
      { id: 1, name: "John Smith", books_checked_out: [3] },
      { id: 2, name: "Emily Johnson", books_checked_out: [] },
      { id: 3, name: "Michael Brown", books_checked_out: [] },
    ]
  }

  for (const book of books) {
    await sql`
      INSERT INTO books (id, title, author, genre, year, status, borrowed_date)
      VALUES (${book.id}, ${book.title}, ${book.author}, ${book.genre || "Uncategorized"}, ${book.year}, ${book.status}, ${book.borrowed_date})
      ON CONFLICT (id) DO NOTHING
    `
  }

  for (const patron of patrons) {
    await sql`
      INSERT INTO patrons (id, name)
      VALUES (${patron.id}, ${patron.name})
      ON CONFLICT (id) DO NOTHING
    `
  }

  for (const patron of patrons) {
    for (const bookId of patron.books_checked_out) {
      await sql`
        INSERT INTO loans (patron_id, book_id, borrowed_date, due_return_date)
        VALUES (${patron.id}, ${bookId}, '2026-03-15 10:30:00', '2026-03-29')
        ON CONFLICT (patron_id, book_id) DO NOTHING
      `
    }
  }
}

export function ensureDatabaseSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          genre TEXT NOT NULL DEFAULT 'Uncategorized',
          year INTEGER NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('Available', 'Checked Out')),
          borrowed_date TEXT
        )
      `
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS genre TEXT NOT NULL DEFAULT 'Uncategorized'`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS borrowed_date TEXT`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS title TEXT`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS author TEXT`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS year INTEGER`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS status TEXT`
      await sql`UPDATE books SET status = 'Available' WHERE status IS NULL`
      await sql`ALTER TABLE books ALTER COLUMN status SET NOT NULL`
      await sql`
        CREATE TABLE IF NOT EXISTS patrons (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS loans (
          patron_id INTEGER NOT NULL REFERENCES patrons(id) ON DELETE RESTRICT,
          book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
          PRIMARY KEY (patron_id, book_id),
          borrowed_date TIMESTAMP NOT NULL,
          due_return_date DATE NOT NULL
        )
      `
      await sql`ALTER TABLE loans ADD COLUMN IF NOT EXISTS borrowed_date TIMESTAMP`
      await sql`ALTER TABLE loans ADD COLUMN IF NOT EXISTS due_return_date DATE`
      await sql`
        UPDATE books
        SET status = 'Checked Out'
        WHERE id IN (SELECT book_id FROM loans)
      `

      const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM books`
      if (count === 0) {
        await migrateJsonData()
      }
    })().catch((error) => {
      schemaReady = null
      throw error
    })
  }
  return schemaReady
}
