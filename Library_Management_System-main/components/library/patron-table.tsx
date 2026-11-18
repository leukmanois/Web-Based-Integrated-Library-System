"use client"

import { useState } from "react"
import type { Patron, Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Search, ChevronUp, ChevronDown } from "lucide-react"

interface PatronTableProps {
  patrons: Patron[]
  books: Book[]
  onEdit: (patron: Patron) => void
  onDelete: (patron: Patron) => void
}

type SortField = "id" | "name" | "books"
type SortDirection = "asc" | "desc"

export function PatronTable({ patrons, books, onEdit, onDelete }: PatronTableProps) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("id")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const filteredPatrons = patrons
    .filter((patron) => {
      return (
        patron.name.toLowerCase().includes(search.toLowerCase()) ||
        patron.id.toString().includes(search)
      )
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortField === "id") comparison = a.id - b.id
      else if (sortField === "name") comparison = a.name.localeCompare(b.name)
      else if (sortField === "books") comparison = a.books_checked_out.length - b.books_checked_out.length
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

  const getBookTitles = (bookIds: number[]) => {
    return bookIds.map((id) => books.find((b) => b.id === id)?.title || `Book #${id}`).join(", ")
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                <div className="flex items-center gap-1">ID <SortIcon field="id" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                <div className="flex items-center gap-1">Name <SortIcon field="name" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("books")}>
                <div className="flex items-center gap-1">Books Checked Out <SortIcon field="books" /></div>
              </TableHead>
              <TableHead>Borrowed Books</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatrons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No patrons found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPatrons.map((patron) => (
                <TableRow key={patron.id}>
                  <TableCell className="font-medium">{patron.id}</TableCell>
                  <TableCell className="font-medium">{patron.name}</TableCell>
                  <TableCell>
                    <Badge variant={patron.books_checked_out.length > 0 ? "secondary" : "outline"} className={patron.books_checked_out.length > 0 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
                      {patron.books_checked_out.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                    {patron.books_checked_out.length > 0 ? getBookTitles(patron.books_checked_out) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(patron)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(patron)}
                        disabled={patron.books_checked_out.length > 0}
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
        Showing {filteredPatrons.length} of {patrons.length} patrons
      </p>
    </div>
  )
}
