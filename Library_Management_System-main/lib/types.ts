export interface Book {
  id: number
  title: string
  author: string
  year: number
  status: "Available" | "Checked Out"
  borrowed_date: string | null
  due_return_date: string | null
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

export const BORROW_DURATION_DAYS = [7, 14, 21, 28] as const
export type BorrowDurationDays = (typeof BORROW_DURATION_DAYS)[number]
export const DEFAULT_BORROW_DURATION_DAYS: BorrowDurationDays = 14

export function isBorrowDurationDays(value: unknown): value is BorrowDurationDays {
  return BORROW_DURATION_DAYS.some((days) => days === value)
}
