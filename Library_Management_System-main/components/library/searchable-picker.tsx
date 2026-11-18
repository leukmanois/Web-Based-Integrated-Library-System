"use client"

import { useState, type KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface SearchablePickerOption {
  value: string
  label: string
  detail: string
  searchText: string
}

interface SearchablePickerProps {
  id: string
  label: string
  placeholder: string
  query: string
  selectedValue: string
  options: SearchablePickerOption[]
  emptyMessage: string
  onQueryChange: (query: string) => void
  onSelect: (value: string, label: string) => void
}

export function SearchablePicker({
  id,
  label,
  placeholder,
  query,
  selectedValue,
  options,
  emptyMessage,
  onQueryChange,
  onSelect,
}: SearchablePickerProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const matches = normalizedQuery
    ? options.filter((option) => option.searchText.toLocaleLowerCase().includes(normalizedQuery)).slice(0, 8)
    : []
  const isOpen = isFocused && !selectedValue && normalizedQuery.length > 0
  const listId = `${id}-options`

  const selectOption = (option: SearchablePickerOption) => {
    onQueryChange(option.label)
    onSelect(option.value, option.label)
    setIsFocused(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return
    if (event.key === "ArrowDown" && matches.length > 0) {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % matches.length)
    } else if (event.key === "ArrowUp" && matches.length > 0) {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + matches.length) % matches.length)
    } else if (event.key === "Enter" && matches[activeIndex]) {
      event.preventDefault()
      selectOption(matches[activeIndex])
    } else if (event.key === "Escape") {
      setIsFocused(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={isOpen && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value)
            onSelect("", "")
            setActiveIndex(0)
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        {isOpen && (
          <div
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {matches.length > 0 ? (
              matches.map((option, index) => (
                <button
                  key={option.value}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`flex w-full flex-col items-start rounded-sm px-3 py-2 text-left text-sm ${
                    index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/70"
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.detail}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
