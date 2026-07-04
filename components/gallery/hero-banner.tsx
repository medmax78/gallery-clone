import Image from "next/image"

export function HeroBanner() {
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '32/9' }}>
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
