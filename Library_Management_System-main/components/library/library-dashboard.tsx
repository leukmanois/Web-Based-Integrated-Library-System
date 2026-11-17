"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR, { mutate } from "swr"
import type { Book, Patron, LibraryStats } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { BookTable } from "./book-table"
import { PatronTable } from "./patron-table"
import { BookForm } from "./book-form"
import { PatronForm } from "./patron-form"
import { TransactionPanel } from "./transaction-panel"
import { StatsCards } from "./stats-cards"
import { ConfirmDialog } from "./confirm-dialog"
import { Plus, Download, Library, BookOpen, Users, ArrowLeftRight } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function LibraryDashboard() {
  const { toast } = useToast()
  
  // Fetch data
  const { data: books = [], isLoading: booksLoading } = useSWR<Book[]>("/api/books", fetcher)
  const { data: patrons = [], isLoading: patronsLoading } = useSWR<Patron[]>("/api/patrons", fetcher)
  const { data: stats } = useSWR<LibraryStats>("/api/stats", fetcher)
  
  // Form states
  const [bookFormOpen, setBookFormOpen] = useState(false)
  const [patronFormOpen, setPatronFormOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [editingPatron, setEditingPatron] = useState<Patron | null>(null)
  
  // Confirm dialog states
  const [deleteBookConfirm, setDeleteBookConfirm] = useState<Book | null>(null)
  const [deletePatronConfirm, setDeletePatronConfirm] = useState<Patron | null>(null)

  // Refresh all data
  const refreshData = useCallback(() => {
    mutate("/api/books")
    mutate("/api/patrons")
    mutate("/api/stats")
  }, [])

  // Book operations
  const handleAddBook = async (data: { title: string; author: string; year: number }) => {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
  }

  const handleUpdateBook = async (data: { id: number; title: string; author: string; year: number }) => {
    const res = await fetch("/api/books", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
  }

  const handleDeleteBook = async (book: Book) => {
    const res = await fetch(`/api/books?id=${book.id}`, { method: "DELETE" })
    const result = await res.json()
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
    setDeleteBookConfirm(null)
  }

  // Patron operations
  const handleAddPatron = async (data: { name: string }) => {
    const res = await fetch("/api/patrons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
  }

  const handleUpdatePatron = async (data: { id: number; name: string }) => {
    const res = await fetch("/api/patrons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
  }

  const handleDeletePatron = async (patron: Patron) => {
    const res = await fetch(`/api/patrons?id=${patron.id}`, { method: "DELETE" })
    const result = await res.json()
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
    setDeletePatronConfirm(null)
  }

  // Transaction operations
  const handleBorrow = async (bookId: number, patronId: number, durationDays: number) => {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "borrow", bookId, patronId, durationDays }),
    })
    const result = await res.json()
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
  }

  const handleReturn = async (bookId: number, patronId: number) => {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return", bookId, patronId }),
    })
    const result = await res.json()
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
  }

  // Export functions
  const handleExport = (type: "books" | "patrons") => {
    window.open(`/api/export?type=${type}`, "_blank")
  }

  // Edit handlers
  const openEditBook = (book: Book) => {
    setEditingBook(book)
    setBookFormOpen(true)
  }

  const openEditPatron = (patron: Patron) => {
    setEditingPatron(patron)
    setPatronFormOpen(true)
  }

  const closeBookForm = () => {
    setBookFormOpen(false)
    setEditingBook(null)
  }

  const closePatronForm = () => {
    setPatronFormOpen(false)
    setEditingPatron(null)
  }

  const isLoading = booksLoading || patronsLoading

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Library className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Library Management System</h1>
                <p className="text-sm text-muted-foreground">Manage books, patrons, and transactions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport("books")}>
                <Download className="mr-2 h-4 w-4" />
                Export Books
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("patrons")}>
                <Download className="mr-2 h-4 w-4" />
                Export Patrons
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        {stats && <StatsCards stats={stats} />}

        {/* Tabs */}
        <Tabs defaultValue="books" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="books" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Books</span>
            </TabsTrigger>
            <TabsTrigger value="patrons" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Patrons</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
          </TabsList>

          {/* Books Tab */}
          <TabsContent value="books" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Book Management</h2>
              <Button onClick={() => { setEditingBook(null); setBookFormOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Book
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading books...</div>
              </div>
            ) : (
              <BookTable
                books={books}
                onEdit={openEditBook}
                onDelete={(book) => setDeleteBookConfirm(book)}
              />
            )}
          </TabsContent>

          {/* Patrons Tab */}
          <TabsContent value="patrons" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Patron Management</h2>
              <Button onClick={() => { setEditingPatron(null); setPatronFormOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Patron
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading patrons...</div>
              </div>
            ) : (
              <PatronTable
                patrons={patrons}
                books={books}
                onEdit={openEditPatron}
                onDelete={(patron) => setDeletePatronConfirm(patron)}
              />
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Borrow & Return Books</h2>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : (
              <TransactionPanel
                books={books}
                patrons={patrons}
                onBorrow={handleBorrow}
                onReturn={handleReturn}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Forms */}
      <BookForm
        book={editingBook}
        open={bookFormOpen}
        onClose={closeBookForm}
        onSubmit={editingBook ? handleUpdateBook : handleAddBook}
      />
      <PatronForm
        patron={editingPatron}
        open={patronFormOpen}
        onClose={closePatronForm}
        onSubmit={editingPatron ? handleUpdatePatron : handleAddPatron}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={!!deleteBookConfirm}
        title="Delete Book"
        description={`Are you sure you want to delete "${deleteBookConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deleteBookConfirm && handleDeleteBook(deleteBookConfirm)}
        onCancel={() => setDeleteBookConfirm(null)}
      />
      <ConfirmDialog
        open={!!deletePatronConfirm}
        title="Delete Patron"
        description={`Are you sure you want to delete "${deletePatronConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deletePatronConfirm && handleDeletePatron(deletePatronConfirm)}
        onCancel={() => setDeletePatronConfirm(null)}
      />

      <Toaster />
    </div>
  )
}
