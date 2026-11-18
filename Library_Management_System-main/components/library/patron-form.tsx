"use client"

import { useEffect, useState, type FormEvent } from "react"
import type { Patron } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface PatronFormProps {
  patron?: Patron | null
  open: boolean
  onClose: () => void
  onSubmit: (data: { id: number; name: string }) => Promise<boolean>
}

export function PatronForm({ patron, open, onClose, onSubmit }: PatronFormProps) {
  const [id, setId] = useState(patron?.id?.toString() || "")
  const [name, setName] = useState(patron?.name || "")
  const [loading, setLoading] = useState(false)

  const isEdit = !!patron

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const saved = await onSubmit({
        id: Number(id),
        name,
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
    setId(patron?.id?.toString() || "")
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
            <Label htmlFor="patron-id">Patron ID</Label>
            <Input
              id="patron-id"
              type="number"
              min="1"
              step="1"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter a unique patron ID"
              readOnly={isEdit}
              required
            />
          </div>
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
