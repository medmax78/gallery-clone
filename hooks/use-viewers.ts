"use client"

import { useEffect, useState } from "react"

export function useViewers() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const es = new EventSource("/api/viewers")

    es.onmessage = (e) => {
      const n = parseInt(e.data, 10)
      if (!isNaN(n)) setCount(n)
    }

    es.onerror = () => {
      // Connection dropped — retry handled automatically by the browser
    }

    return () => es.close()
  }, [])

  return count
}
