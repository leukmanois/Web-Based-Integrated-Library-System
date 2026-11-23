import Image from "next/image"
import { BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookCoverProps {
  src?: string | null
  title: string
  className?: string
}

export function BookCover({ src, title, className }: BookCoverProps) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 text-emerald-700", className)}>
      {src ? (
        <Image src={src} alt={`Cover of ${title}`} fill sizes="(max-width: 640px) 80px, 112px" className="object-cover" />
      ) : (
        <BookOpen aria-hidden="true" className="h-7 w-7" />
      )}
    </div>
  )
}
