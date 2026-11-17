"use client"

import { useEffect, useState } from "react"
import type { Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface BookFormProps {
  book?: Book | null
  open: boolean
  onClose: () => void
  onSubmit: (data: { title: string; author: string; year: number; id?: number }) => Promise<void>
}

export function BookForm({ book, open, onClose, onSubmit }: BookFormProps) {
  const [title, setTitle] = useState(book?.title || "")
  const [author, setAuthor] = useState(book?.author || "")
  const [year, setYear] = useState(book?.year?.toString() || "")
  const [loading, setLoading] = useState(false)

  const isEdit = !!book

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        title,
        author,
        year: parseInt(year),
        ...(isEdit && { id: book.id }),
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  useEffect(() => {
    if (!open) return

    setTitle(book?.title || "")
    setAuthor(book?.author || "")
    setYear(book?.year?.toString() || "")
  }, [book, open])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Book" : "Add New Book"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the book details below." : "Fill in the details to add a new book to the library."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Publication Year</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Enter publication year"
              min="1000"
              max={new Date().getFullYear()}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Book" : "Add Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
