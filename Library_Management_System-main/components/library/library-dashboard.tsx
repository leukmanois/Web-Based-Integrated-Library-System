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
import { BrandFooter } from "./brand-footer"
import { Plus, Download, Library, BookOpen, Users, ArrowLeftRight, LogOut } from "lucide-react"

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
  const handleAddBook = async (data: { id: number; title: string; author: string; genre: string; year: number }) => {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    const isDuplicate = res.status === 409
    toast({
      title: result.success ? "Success" : isDuplicate ? "Book already exists" : "Error",
      description: result.message,
      variant: result.success || isDuplicate ? "default" : "destructive",
      className: isDuplicate
        ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        : undefined,
    })

    if (result.success) refreshData()
    return result.success
  }

  const handleUpdateBook = async (data: { id: number; title: string; author: string; genre: string; year: number }) => {
    const res = await fetch("/api/books", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    const isDuplicate = res.status === 409
    toast({
      title: result.success ? "Success" : isDuplicate ? "Book already exists" : "Error",
      description: result.message,
      variant: result.success || isDuplicate ? "default" : "destructive",
      className: isDuplicate
        ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        : undefined,
    })
    if (result.success) refreshData()
    return result.success
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
  const handleAddPatron = async (data: { id: number; name: string }) => {
    const res = await fetch("/api/patrons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    const isDuplicate = res.status === 409
    toast({
      title: result.success ? "Success" : isDuplicate ? "Patron already exists" : "Error",
      description: result.message,
      variant: result.success || isDuplicate ? "default" : "destructive",
      className: isDuplicate
        ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        : undefined,
    })
    if (result.success) refreshData()
    return result.success
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
    return result.success
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
  const handleBorrow = async (bookId: number, patronId: number) => {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "borrow", bookId, patronId }),
    })
    const result = await res.json()
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
    return result.success
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
    return result.success
  }

  // Export functions
  const handleExport = (type: "books" | "patrons") => {
    window.open(`/api/export?type=${type}`, "_blank")
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" })
      if (!response.ok) throw new Error("Sign out request failed.")
      window.location.assign("/login")
    } catch {
      toast({
        title: "Unable to sign out",
        description: "Please try again.",
        variant: "destructive",
      })
    }
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
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="relative isolate overflow-hidden border-b border-emerald-100 bg-white text-slate-900">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-36 h-80 w-80 rounded-full border border-emerald-200/70" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-24 h-56 w-56 rounded-full border border-emerald-200/50" />
        <div aria-hidden="true" className="pointer-events-none absolute right-1/4 top-0 h-full w-72 bg-emerald-100/70 blur-3xl" />
        <div className="container relative mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                <Library className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-tight tracking-tight sm:text-xl">
                  LIBRCS: Library Information Book Resources Catalog System
                </h1>
                <p className="text-xs text-slate-600">Manage books, patrons, and transactions</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-900" onClick={() => handleExport("books")}>
                <Download className="mr-2 h-4 w-4" />
                Export Books
              </Button>
              <Button variant="outline" size="sm" className="border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-900" onClick={() => handleExport("patrons")}>
                <Download className="mr-2 h-4 w-4" />
                Export Patrons
              </Button>
              <Button variant="outline" size="sm" className="border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-900" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto w-full flex-1 bg-gradient-to-br from-emerald-50/40 via-transparent to-transparent px-4 py-6">
        {/* Stats */}
        {stats && <StatsCards stats={stats} />}

        {/* Tabs */}
        <Tabs defaultValue="books" className="mt-6">
          <TabsList className="grid h-11 w-full grid-cols-3 border border-emerald-100 bg-emerald-50/80 p-1 text-slate-600 shadow-sm lg:w-auto lg:inline-flex">
            <TabsTrigger value="books" className="gap-2 text-slate-600 hover:text-emerald-800 data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Books</span>
            </TabsTrigger>
            <TabsTrigger value="patrons" className="gap-2 text-slate-600 hover:text-emerald-800 data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Patrons</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2 text-slate-600 hover:text-emerald-800 data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
          </TabsList>

          {/* Books Tab */}
          <TabsContent value="books" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Book Management</h2>
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => { setEditingBook(null); setBookFormOpen(true); }}>
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
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => { setEditingPatron(null); setPatronFormOpen(true); }}>
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

      <BrandFooter />

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
