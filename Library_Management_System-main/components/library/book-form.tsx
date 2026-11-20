"use client"

import { useEffect, useState, type FormEvent } from "react"
import type { Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface BookFormProps {
  book?: Book | null
  open: boolean
  onClose: () => void
  onSubmit: (data: { id: number; title: string; author: string; genre: string; year: number }) => Promise<boolean>
}

export function BookForm({ book, open, onClose, onSubmit }: BookFormProps) {
  const [id, setId] = useState(book?.id?.toString() || "")
  const [title, setTitle] = useState(book?.title || "")
  const [author, setAuthor] = useState(book?.author || "")
  const [genre, setGenre] = useState(book?.genre || "")
  const [year, setYear] = useState(book?.year?.toString() || "")
  const [loading, setLoading] = useState(false)

  const isEdit = !!book

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const saved = await onSubmit({
        id: Number(id),
        title,
        author,
        genre,
        year: parseInt(year),
      })
      if (saved) onClose()
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
    setId(book?.id?.toString() || "")
    setTitle(book?.title || "")
    setAuthor(book?.author || "")
    setGenre(book?.genre || "")
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
            <Label htmlFor="book-id">Book ID</Label>
            <Input
              id="book-id"
              type="number"
              min="1"
              step="1"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter a unique book ID"
              readOnly={isEdit}
              required
            />
          </div>
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
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Enter book genre"
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
