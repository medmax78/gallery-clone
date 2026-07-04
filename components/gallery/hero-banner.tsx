import Image from "next/image"

export function HeroBanner() {
  return (
    <div className="relative aspect-video w-full overflow-hidden">
      <Image
        src="/hero-ship.jpg"
        alt="Swire Bulk cargo vessel at sea"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    </div>
  )
}
