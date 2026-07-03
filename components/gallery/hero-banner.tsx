import Image from "next/image"

export function HeroBanner() {
  return (
    <div className="bg-card p-2">
      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-sm">
        <Image
          src="/hero-ship.png"
          alt="Swire Bulk cargo vessel anchored in harbor"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover"
        />
        {/* Brand lockup */}
        <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 rounded bg-background/10 px-3 py-1 backdrop-blur-[1px]">
          <span className="flex h-7 w-10 overflow-hidden rounded-[3px] border border-white/40 shadow">
            <span className="flex-1 bg-[oklch(0.55_0.2_25)]" />
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-[oklch(0.4_0.13_255)]" />
          </span>
          <span className="font-serif text-2xl font-semibold tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] sm:text-3xl">
            SWIRE BULK
          </span>
        </div>
      </div>
    </div>
  )
}
