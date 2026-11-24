"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight,
  BookPlus, BookX, History, Search, UserMinus, UserPlus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TransactionHistoryEntry } from "@/lib/library-data"

const PAGE_SIZE = 20

const fetcher = async (url: string): Promise<TransactionHistoryEntry[]> => {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error(data?.message || "Unable to load transaction history.")
  return data
}

const transactionLabels: Record<TransactionHistoryEntry["transaction_type"], string> = {
  arrival: "New arrival",
  removal: "Book removed",
  borrow: "Borrowed",
  return: "Returned",
  patron_add: "Patron added",
  patron_remove: "Patron removed",
}

function TransactionType({ type }: { type: TransactionHistoryEntry["transaction_type"] }) {
  const styles: Record<TransactionHistoryEntry["transaction_type"], string> = {
    arrival: "bg-sky-50 text-sky-700",
    removal: "bg-rose-50 text-rose-700",
    borrow: "bg-amber-50 text-amber-700",
    return: "bg-emerald-50 text-emerald-700",
    patron_add: "bg-violet-50 text-violet-700",
    patron_remove: "bg-orange-50 text-orange-700",
  }
  const icons = {
    arrival: BookPlus, removal: BookX, borrow: ArrowUpRight,
    return: ArrowDownLeft, patron_add: UserPlus, patron_remove: UserMinus,
  }
  const Icon = icons[type]
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[type]}`}><Icon className="h-3.5 w-3.5" />{transactionLabels[type]}</span>
}

function localDate(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function TransactionHistory() {
  const { data, error, isLoading } = useSWR<TransactionHistoryEntry[]>("/api/transactions/history", fetcher)
  const [patronFilter, setPatronFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const query = patronFilter.trim().toLocaleLowerCase()
    return (data ?? []).filter((entry) => {
      const matchesPatron = !query || (entry.patron_name ?? "").toLocaleLowerCase().includes(query)
      const matchesType = typeFilter === "all" || entry.transaction_type === typeFilter
      const date = localDate(entry.occurred_at)
      return matchesPatron && matchesType && (!fromDate || date >= fromDate) && (!toDate || date <= toDate)
    })
  }, [data, patronFilter, typeFilter, fromDate, toDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const firstRecord = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const lastRecord = Math.min(currentPage * PAGE_SIZE, filtered.length)
  const resetPage = <T,>(setter: (value: T) => void, value: T) => { setter(value); setPage(1) }

  return (
    <Card className="mt-6 border-emerald-100 shadow-sm">
      <CardHeader className="gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg"><History className="h-5 w-5 text-emerald-700" />Transaction History</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">A record of book activity and patron registrations/removals</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={patronFilter} onChange={(e) => resetPage(setPatronFilter, e.target.value)} placeholder="Filter by patron name" className="pl-9" aria-label="Filter by patron name" />
          </div>
          <Select value={typeFilter} onValueChange={(v) => resetPage(setTypeFilter, v)}>
            <SelectTrigger aria-label="Filter by transaction type"><SelectValue placeholder="All transaction types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All transaction types</SelectItem>
              <SelectItem value="arrival">New arrivals</SelectItem>
              <SelectItem value="removal">Book removals</SelectItem>
              <SelectItem value="borrow">Borrowing</SelectItem>
              <SelectItem value="return">Returning</SelectItem>
              <SelectItem value="patron_add">Patrons added</SelectItem>
              <SelectItem value="patron_remove">Patrons removed</SelectItem>
            </SelectContent>
          </Select>
          <div><label htmlFor="history-from-date" className="mb-1 block text-xs font-medium text-muted-foreground">From date</label><Input id="history-from-date" type="date" value={fromDate} max={toDate || undefined} onChange={(e) => resetPage(setFromDate, e.target.value)} /></div>
          <div><label htmlFor="history-to-date" className="mb-1 block text-xs font-medium text-muted-foreground">To date</label><Input id="history-to-date" type="date" value={toDate} min={fromDate || undefined} onChange={(e) => resetPage(setToDate, e.target.value)} /></div>
        </div>
        {(patronFilter || typeFilter !== "all" || fromDate || toDate) && <div className="flex justify-end"><button type="button" onClick={() => { setPatronFilter(""); setTypeFilter("all"); setFromDate(""); setToDate(""); setPage(1) }} className="text-xs font-medium text-emerald-700 hover:underline">Clear filters</button></div>}
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading transaction history...</p>
          : error ? <p className="py-10 text-center text-sm text-rose-600">{error.message}</p>
          : filtered.length === 0 ? <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center"><History className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-medium text-slate-700">No transactions found</p><p className="mt-1 text-xs text-muted-foreground">Try changing your filters or record a library transaction.</p></div>
          : <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Showing {firstRecord}–{lastRecord} of {filtered.length} records</p><p className="text-xs text-muted-foreground">20 records per page</p></div>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-medium">Date &amp; time</th><th className="px-4 py-3 font-medium">Transaction</th><th className="px-4 py-3 font-medium">Book / Patron</th><th className="px-4 py-3 font-medium">Patron</th><th className="px-4 py-3 text-right font-medium">Quantity</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{pageItems.map((entry) => {
                  const patronEvent = entry.transaction_type === "patron_add" || entry.transaction_type === "patron_remove"
                  return <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(entry.occurred_at).toLocaleString()}</td>
                    <td className="px-4 py-3"><TransactionType type={entry.transaction_type} /></td>
                    <td className="px-4 py-3"><p className="font-medium text-slate-800">{patronEvent ? "Patron record" : entry.book_title || "—"}</p><p className="text-xs text-muted-foreground">{patronEvent ? "No book associated" : entry.book_id != null ? `Book ID: ${entry.book_id}` : "—"}</p></td>
                    <td className="px-4 py-3 text-slate-600">{entry.patron_name ? <>{entry.patron_name}<span className="ml-1 text-xs text-muted-foreground">(#{entry.patron_id})</span></> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{patronEvent ? "—" : entry.quantity}</td>
                  </tr>
                })}</tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page"><ArrowLeft className="h-4 w-4" />Previous</button>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page">Next<ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          </>}
      </CardContent>
    </Card>
  )
}
