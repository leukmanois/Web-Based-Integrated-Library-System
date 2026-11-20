export interface Book {
  id: number
  title: string
  author: string
  genre: string
  year: number
  status: "Available" | "Checked Out"
  borrowed_date: string | null
}

export interface Patron {
  id: number
  name: string
  books_checked_out: number[]
}

export interface LibraryStats {
  total_books: number
  available_books: number
  checked_out_books: number
  total_patrons: number
  active_patrons: number
}
