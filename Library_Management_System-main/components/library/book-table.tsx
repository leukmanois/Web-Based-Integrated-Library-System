"use client"

import { useState } from "react"
import type { Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Search, ChevronUp, ChevronDown } from "lucide-react"

interface BookTableProps {
  books: Book[]
  onEdit: (book: Book) => void
  onDelete: (book: Book) => void
}

type SortField = "id" | "title" | "author" | "genre" | "year" | "status" | "due_return_date"
type SortDirection = "asc" | "desc"

function formatBorrowedDate(value: string | null) {
  if (!value) return "-"

  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
    ? value
    : `${value.replace(" ", "T")}Z`
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date)
}

export function BookTable({ books, onEdit, onDelete }: BookTableProps) {
  const safeBooks = Array.isArray(books) ? books : []
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "Available" | "Checked Out" | "Overdue">("all")
  const [sortField, setSortField] = useState<SortField>("id")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const filteredBooks = safeBooks
    .filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase()) ||
        book.genre.toLowerCase().includes(search.toLowerCase()) ||
        book.id.toString().includes(search)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Overdue" ? book.is_overdue : book.status === statusFilter)
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortField === "id") comparison = a.id - b.id
      else if (sortField === "year") comparison = a.year - b.year
      else if (sortField === "title") comparison = a.title.localeCompare(b.title)
      else if (sortField === "author") comparison = a.author.localeCompare(b.author)
      else if (sortField === "genre") comparison = a.genre.localeCompare(b.genre)
      else if (sortField === "status") comparison = a.status.localeCompare(b.status)
      else if (sortField === "due_return_date") comparison = (a.due_return_date || "").localeCompare(b.due_return_date || "")
      return sortDirection === "asc" ? comparison : -comparison
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, genre, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "Available" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Available")}
          >
            Available
          </Button>
          <Button
            variant={statusFilter === "Checked Out" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Checked Out")}
          >
            Checked Out
          </Button>
          <Button
            variant={statusFilter === "Overdue" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Overdue")}
          >
            Overdue
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                <div className="flex items-center gap-1">ID <SortIcon field="id" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                <div className="flex items-center gap-1">Title <SortIcon field="title" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("author")}>
                <div className="flex items-center gap-1">Author <SortIcon field="author" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("genre")}>
                <div className="flex items-center gap-1">Genre <SortIcon field="genre" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("year")}>
                <div className="flex items-center gap-1">Year <SortIcon field="year" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
              </TableHead>
              <TableHead>Borrowed Date &amp; Time</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("due_return_date")}>
                <div className="flex items-center gap-1">Due Return Date <SortIcon field="due_return_date" /></div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No books found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.id}</TableCell>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.genre}</TableCell>
                  <TableCell>{book.year}</TableCell>
                  <TableCell>
                    <Badge
                      variant={book.status === "Available" && !book.is_overdue ? "default" : "secondary"}
                      className={
                        book.is_overdue
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : book.status === "Available"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                      }
                    >
                      {book.is_overdue ? "Overdue" : book.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatBorrowedDate(book.borrowed_date)}
                  </TableCell>
                  <TableCell className={book.is_overdue ? "text-red-600 font-medium text-sm" : "text-muted-foreground text-sm"}>
                    {book.due_return_date || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(book)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(book)}
                        disabled={book.status === "Checked Out"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        Showing {filteredBooks.length} of {books.length} books
      </p>
    </div>
  )
}
