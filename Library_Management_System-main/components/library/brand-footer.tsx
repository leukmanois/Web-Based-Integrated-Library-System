import { BookOpen } from "lucide-react"

export function BrandFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-emerald-100 bg-white/90">
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 left-1/4 h-20 w-48 rounded-full bg-emerald-100/70 blur-2xl" />
      <div className="container relative mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-100 bg-gradient-to-br from-white to-emerald-100 text-emerald-700">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-wide text-slate-800">LIBRCS 2026</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-700/70">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-emerald-400/70" />
          Library Information Book Resources Catalog System
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-emerald-400/70" />
        </div>
      </div>
    </footer>
  )
}
