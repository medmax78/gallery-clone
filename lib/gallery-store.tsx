"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { Dish, RankedDish, Vessel } from "@/lib/gallery-data"
import { VESSELS } from "@/lib/gallery-data"

const STORAGE_KEY = "swire-gallery-v1"

type NewDishInput = {
  image: string
  date: string
  rating: number
}

type GalleryStore = {
  vessels: Vessel[]
  ready: boolean
  rateDish: (dishId: string, value: number) => void
  addVessel: (name: string, thumbnail: string) => void
  renameVessel: (oldName: string, newName: string) => void
  deleteVessel: (name: string) => void
  addDish: (vesselName: string, dish: NewDishInput) => void
  deleteDish: (vesselName: string, dishId: string) => void
  reset: () => void
}

const Ctx = createContext<GalleryStore | null>(null)

function recompute(vessel: Vessel): Vessel {
  const dishes = vessel.dishes
  const rating =
    dishes.length > 0
      ? Math.round((dishes.reduce((s, d) => s + d.rating, 0) / dishes.length) * 10) / 10
      : 0
  return { ...vessel, rating, photoCount: dishes.length }
}

export function GalleryStoreProvider({ children }: { children: React.ReactNode }) {
  const [vessels, setVessels] = useState<Vessel[]>(VESSELS)
  const [ready, setReady] = useState(false)
  const hydrated = useRef(false)

  // Load persisted state after mount to avoid hydration mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Vessel[]
        if (Array.isArray(parsed) && parsed.length > 0) setVessels(parsed)
      }
    } catch {
      // ignore corrupt storage
    }
    hydrated.current = true
    setReady(true)
  }, [])

  // Persist on change (only after initial hydration).
  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vessels))
    } catch {
      // ignore quota errors
    }
  }, [vessels])

  const rateDish = useCallback((dishId: string, value: number) => {
    setVessels((prev) =>
      prev.map((v) => {
        if (!v.dishes.some((d) => d.id === dishId)) return v
        const dishes = v.dishes.map((d) => {
          if (d.id !== dishId) return d
          const votes = d.votes + 1
          const rating = Math.round(((d.rating * d.votes + value) / votes) * 10) / 10
          return { ...d, rating, votes }
        })
        return recompute({ ...v, dishes })
      }),
    )
  }, [])

  const addVessel = useCallback((name: string, thumbnail: string) => {
    setVessels((prev) => {
      if (prev.some((v) => v.name.toLowerCase() === name.toLowerCase())) return prev
      return [
        { name, thumbnail: thumbnail || "/vessel-container.png", rating: 0, photoCount: 0, dishes: [] },
        ...prev,
      ]
    })
  }, [])

  const renameVessel = useCallback((oldName: string, newName: string) => {
    setVessels((prev) => prev.map((v) => (v.name === oldName ? { ...v, name: newName } : v)))
  }, [])

  const deleteVessel = useCallback((name: string) => {
    setVessels((prev) => prev.filter((v) => v.name !== name))
  }, [])

  const addDish = useCallback((vesselName: string, dish: NewDishInput) => {
    setVessels((prev) =>
      prev.map((v) => {
        if (v.name !== vesselName) return v
        const newDish: Dish = {
          id: `${vesselName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          image: dish.image,
          date: dish.date,
          rating: dish.rating,
          votes: 1,
        }
        return recompute({ ...v, dishes: [newDish, ...v.dishes] })
      }),
    )
  }, [])

  const deleteDish = useCallback((vesselName: string, dishId: string) => {
    setVessels((prev) =>
      prev.map((v) => {
        if (v.name !== vesselName) return v
        return recompute({ ...v, dishes: v.dishes.filter((d) => d.id !== dishId) })
      }),
    )
  }, [])

  const reset = useCallback(() => {
    setVessels(VESSELS)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo<GalleryStore>(
    () => ({
      vessels,
      ready,
      rateDish,
      addVessel,
      renameVessel,
      deleteVessel,
      addDish,
      deleteDish,
      reset,
    }),
    [vessels, ready, rateDish, addVessel, renameVessel, deleteVessel, addDish, deleteDish, reset],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useGalleryStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useGalleryStore must be used within GalleryStoreProvider")
  return ctx
}

export function extremeDishes(vessels: Vessel[]) {
  const all: RankedDish[] = vessels.flatMap((v) => v.dishes.map((d) => ({ ...d, vessel: v.name })))
  const sorted = [...all].sort((a, b) => a.rating - b.rating)
  return {
    lowest: sorted.slice(0, 3),
    highest: [...sorted].reverse().slice(0, 3),
  }
}
