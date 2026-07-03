"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImageIcon, Loader2, Plus, Trash2, UploadCloud } from "lucide-react"
import { type Vessel } from "@/lib/gallery-data"
import { useGalleryStore } from "@/lib/gallery-store"

type DishManagerProps = {
  vessel: Vessel
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function DishManager({ vessel }: DishManagerProps) {
  const { addDish, deleteDish } = useGalleryStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [date, setDate] = useState(todayISO())
  const [rating, setRating] = useState(3)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    setFile(picked)
    setError(null)
    if (picked) {
      const url = URL.createObjectURL(picked)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0] ?? null
    if (!dropped) return
    setFile(dropped)
    setError(null)
    setPreview(URL.createObjectURL(dropped))
    // sync the hidden input so the form label reflects the file
    if (fileRef.current) {
      const dt = new DataTransfer()
      dt.items.add(dropped)
      fileRef.current.files = dt.files
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError("Please choose a photo first."); return }

    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("vesselName", vessel.name)

      const res = await fetch("/api/upload", { method: "POST", body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Upload failed")
      }
      const { path: imagePath } = await res.json()

      await addDish(vessel.name, {
        image: imagePath,
        date: new Date(date).toISOString(),
        rating,
      })

      // Reset form
      setFile(null)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ""
      setDate(todayISO())
      setRating(3)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const sorted = [...vessel.dishes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return (
    <div className="space-y-4 border-t border-border bg-background/40 p-4">
      <form onSubmit={submit} className="space-y-3">
        {/* Drop zone / file picker */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Photo</label>
          <label
            htmlFor={`file-${vessel.name}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
          >
            {preview ? (
              <div className="relative h-28 w-full overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <>
                <UploadCloud size={28} aria-hidden />
                <span className="text-center leading-snug">
                  Click or drag a photo here
                </span>
                <span className="text-xs opacity-60">JPG, PNG, WEBP up to any size</span>
              </>
            )}
            <input
              ref={fileRef}
              id={`file-${vessel.name}`}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
          {file && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <ImageIcon size={12} aria-hidden />
              {file.name}
            </p>
          )}
        </div>

        {/* Date + Rating + submit in one row */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor={`date-${vessel.name}`} className="text-xs font-medium text-muted-foreground">
              Date
            </label>
            <input
              id={`date-${vessel.name}`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`rating-${vessel.name}`} className="text-xs font-medium text-muted-foreground">
              Rating
            </label>
            <select
              id={`rating-${vessel.name}`}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-gold"
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r} star{r > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold-dark disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden />
                Uploading…
              </>
            ) : (
              <>
                <Plus size={16} aria-hidden />
                Add
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
      </form>

      {/* Photo grid */}
      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No photos yet. Upload the first galley photo above.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {sorted.map((dish) => (
            <div
              key={dish.id}
              className="group relative overflow-hidden rounded-md border border-border"
            >
              <div className="relative aspect-square">
                <Image
                  src={dish.image || "/placeholder.svg"}
                  alt={`Dish rated ${dish.rating} stars`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between px-1.5 py-1 text-[11px] text-muted-foreground">
                <span>{new Date(dish.date).toLocaleDateString()}</span>
                <span className="font-semibold text-gold">{dish.rating.toFixed(1)}</span>
              </div>
              <button
                type="button"
                onClick={() => deleteDish("", dish.id)}
                aria-label="Delete photo"
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-danger text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={13} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
