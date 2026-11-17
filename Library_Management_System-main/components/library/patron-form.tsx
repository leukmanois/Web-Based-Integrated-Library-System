"use client"

import { useEffect, useState } from "react"
import type { Patron } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface PatronFormProps {
  patron?: Patron | null
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; id?: number }) => Promise<void>
}

export function PatronForm({ patron, open, onClose, onSubmit }: PatronFormProps) {
  const [name, setName] = useState(patron?.name || "")
  const [loading, setLoading] = useState(false)

  const isEdit = !!patron

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        name,
        ...(isEdit && { id: patron.id }),
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

    setName(patron?.name || "")
  }, [patron, open])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Patron" : "Add New Patron"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the patron details below." : "Fill in the details to register a new library patron."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter patron name"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Patron" : "Add Patron"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
