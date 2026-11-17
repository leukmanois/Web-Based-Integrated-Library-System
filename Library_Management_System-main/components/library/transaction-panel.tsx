"use client"

import { useState } from "react"
import type { Book, Patron } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeftRight, BookOpen, UserCheck } from "lucide-react"
import { BORROW_DURATION_DAYS, DEFAULT_BORROW_DURATION_DAYS } from "@/lib/types"

interface TransactionPanelProps {
  books: Book[]
  patrons: Patron[]
  onBorrow: (bookId: number, patronId: number, durationDays: number) => Promise<void>
  onReturn: (bookId: number, patronId: number) => Promise<void>
}

export function TransactionPanel({ books, patrons, onBorrow, onReturn }: TransactionPanelProps) {
  const [borrowPatronId, setBorrowPatronId] = useState<string>("")
  const [borrowBookId, setBorrowBookId] = useState<string>("")
  const [borrowDurationDays, setBorrowDurationDays] = useState<string>(DEFAULT_BORROW_DURATION_DAYS.toString())
  const [returnPatronId, setReturnPatronId] = useState<string>("")
  const [returnBookId, setReturnBookId] = useState<string>("")
  const [borrowLoading, setBorrowLoading] = useState(false)
  const [returnLoading, setReturnLoading] = useState(false)

  const availableBooks = books.filter((b) => b.status === "Available")
  const selectedPatronForReturn = patrons.find((p) => p.id.toString() === returnPatronId)
  const booksToReturn = selectedPatronForReturn
    ? books.filter((b) => selectedPatronForReturn.books_checked_out.includes(b.id))
    : []

  const handleBorrow = async () => {
    if (!borrowBookId || !borrowPatronId) return
    setBorrowLoading(true)
    try {
      await onBorrow(parseInt(borrowBookId), parseInt(borrowPatronId), parseInt(borrowDurationDays))
      setBorrowBookId("")
      setBorrowPatronId("")
      setBorrowDurationDays(DEFAULT_BORROW_DURATION_DAYS.toString())
    } finally {
      setBorrowLoading(false)
    }
  }

  const handleReturn = async () => {
    if (!returnBookId || !returnPatronId) return
    setReturnLoading(true)
    try {
      await onReturn(parseInt(returnBookId), parseInt(returnPatronId))
      setReturnBookId("")
      setReturnPatronId("")
    } finally {
      setReturnLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Borrow Book Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Borrow Book
          </CardTitle>
          <CardDescription>Check out a book for a patron</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Patron</Label>
            <Select value={borrowPatronId} onValueChange={setBorrowPatronId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a patron" />
              </SelectTrigger>
              <SelectContent>
                {patrons.map((patron) => (
                  <SelectItem key={patron.id} value={patron.id.toString()}>
                    {patron.name} (ID: {patron.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Select Available Book</Label>
            <Select value={borrowBookId} onValueChange={setBorrowBookId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a book" />
              </SelectTrigger>
              <SelectContent>
                {availableBooks.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No books available
                  </SelectItem>
                ) : (
                  availableBooks.map((book) => (
                    <SelectItem key={book.id} value={book.id.toString()}>
                      {book.title} by {book.author}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Loan Duration</Label>
            <Select value={borrowDurationDays} onValueChange={setBorrowDurationDays}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a loan duration" />
              </SelectTrigger>
              <SelectContent>
                {BORROW_DURATION_DAYS.map((days) => (
                  <SelectItem key={days} value={days.toString()}>
                    {days} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleBorrow}
            disabled={!borrowBookId || !borrowPatronId || borrowLoading}
            className="w-full"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            {borrowLoading ? "Processing..." : "Borrow Book"}
          </Button>
        </CardContent>
      </Card>

      {/* Return Book Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Return Book
          </CardTitle>
          <CardDescription>Return a book from a patron</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Patron</Label>
            <Select
              value={returnPatronId}
              onValueChange={(value) => {
                setReturnPatronId(value)
                setReturnBookId("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a patron" />
              </SelectTrigger>
              <SelectContent>
                {patrons
                  .filter((p) => p.books_checked_out.length > 0)
                  .map((patron) => (
                    <SelectItem key={patron.id} value={patron.id.toString()}>
                      {patron.name} ({patron.books_checked_out.length} book(s))
                    </SelectItem>
                  ))}
                {patrons.filter((p) => p.books_checked_out.length > 0).length === 0 && (
                  <SelectItem value="none" disabled>
                    No patrons have borrowed books
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Select Book to Return</Label>
            <Select value={returnBookId} onValueChange={setReturnBookId} disabled={!returnPatronId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a book" />
              </SelectTrigger>
              <SelectContent>
                {booksToReturn.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Select a patron first
                  </SelectItem>
                ) : (
                  booksToReturn.map((book) => (
                    <SelectItem key={book.id} value={book.id.toString()}>
                      {book.title} by {book.author}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleReturn}
            disabled={!returnBookId || !returnPatronId || returnLoading}
            className="w-full"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            {returnLoading ? "Processing..." : "Return Book"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
