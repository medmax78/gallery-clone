"use client"

import { useMemo, useState } from "react"
import { HeroBanner } from "@/components/gallery/hero-banner"
import { IntroCard } from "@/components/gallery/intro-card"
import { VesselDetail } from "@/components/gallery/vessel-detail"
import { TopWorst } from "@/components/gallery/top-worst"
import { Lightbox } from "@/components/gallery/lightbox"
import type { Dish } from "@/lib/gallery-data"
import { getExtremeDishes, VESSELS } from "@/lib/gallery-data"

type Override = { rating: number; votes: number }

function findBaseDish(dishId: string): { rating: number; votes: number } | null {
  for (const v of VESSELS) {
    const d = v.dishes.find((x) => x.id === dishId)
    if (d) return { rating: d.rating, votes: d.votes }
  }
  return null
}

export default function GalleryPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Record<string, Override>>({})
  const [lightbox, setLightbox] = useState<{ dishes: Dish[]; index: number } | null>(null)

  const applyOverride = <T extends Dish>(dish: T): T => {
    const o = overrides[dish.id]
    return o ? { ...dish, rating: o.rating, votes: o.votes } : dish
  }

  const rate = (dishId: string, value: number) => {
    setOverrides((prev) => {
      // Blend the new vote into the existing average for a believable result.
      const base = prev[dishId] ?? findBaseDish(dishId)
      if (!base) return prev
      const votes = base.votes + 1
      const rating = Math.round(((base.rating * base.votes + value) / votes) * 10) / 10
      return { ...prev, [dishId]: { rating, votes } }
    })
  }

  const selectedVessel = useMemo(() => {
    if (!selected) return null
    const v = VESSELS.find((x) => x.name === selected)
    if (!v) return null
    return { ...v, dishes: v.dishes.map(applyOverride) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, overrides])

  const { lowest, highest } = useMemo(() => {
    const extremes = getExtremeDishes()
    return {
      lowest: extremes.lowest.map(applyOverride),
      highest: extremes.highest.map(applyOverride),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides])

  const openLightbox = (dishes: Dish[], index: number) => {
    if (index < 0) return
    setLightbox({ dishes, index })
  }

  const lightboxDishes = lightbox ? lightbox.dishes.map(applyOverride) : []

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-8">
        <section className="overflow-hidden rounded-md border-2 border-gold">
          <HeroBanner />
          <IntroCard
            selected={selected}
            onSelect={(name) => setSelected((cur) => (cur === name ? null : name))}
          />
        </section>

        {selectedVessel && (
          <VesselDetail
            vessel={selectedVessel}
            onHide={() => setSelected(null)}
            onOpenPhoto={openLightbox}
            onRate={rate}
          />
        )}

        <TopWorst lowest={lowest} highest={highest} onOpen={openLightbox} />
      </div>

      {lightbox && (
        <Lightbox
          dishes={lightboxDishes}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((lb) => (lb ? { ...lb, index } : lb))}
          onRate={rate}
        />
      )}
    </main>
  )
}
