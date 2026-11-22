import Image from "next/image"

export function BrandFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-emerald-100 bg-white/90">
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 left-1/4 h-20 w-48 rounded-full bg-emerald-100/70 blur-2xl" />
      <div className="container relative mx-auto flex flex-col items-center justify-center gap-2 px-4 py-5 text-center">
        <Image src="/ORCA-green.png" alt="ORCA logo" width={40} height={40} className="h-10 w-10 object-contain" />
        <div className="text-sm font-semibold tracking-wide text-slate-800">ORCA</div>
        <div className="text-xs font-medium text-emerald-700/80">
          Organized Resource &amp; Catalog System
        </div>
      </div>
    </footer>
  )
}
