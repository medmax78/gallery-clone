"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Trash2 } from "lucide-react"
import { DISH_IMAGES, type Vessel } from "@/lib/gallery-data"
import { useGalleryStore } from "@/lib/gallery-store"

type DishManagerProps = {
  vessel: Vessel
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function DishManager({ vessel }: DishManagerProps) {
  const { addDish, deleteDish } = useGalleryStore()
  const [image, setImage] = useState(DISH_IMAGES[0])
  const [date, setDate] = useState(todayISO())
  const [rating, setRating] = useState(3)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    addDish(vessel.name, {
      image,
      date: new Date(date).toISOString(),
      rating,
    })
  }

  const sorted = [...vessel.dishes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return (
    <div className="space-y-4 border-t border-border bg-background/40 p-4">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Photo</label>
          <select
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-gold"
          >
            {DISH_IMAGES.map((img) => (
              <option key={img} value={img}>
                {img.replace("/dish-", "").replace(".png", "")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-gold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Rating</label>
          <select
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
        <div className="flex items-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold-dark"
          >
            <Plus size={16} aria-hidden />
            Add
          </button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No photos yet. Add the first galley photo above.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {sorted.map((dish) => (
            <div key={dish.id} className="group relative overflow-hidden rounded-md border border-border">
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
                onClick={() => deleteDish(vessel.name, dish.id)}
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
