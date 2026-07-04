"use client"

import { useEffect, useState } from "react"

export function useViewers() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    // Register this viewer when the tab opens
    fetch('/api/viewers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join' }) })
      .then(r => r.json())
      .then(d => { if (!cancelled) setCount(d.count) })
      .catch(() => {})

    // Poll every 10 seconds to keep the count fresh
    const interval = setInterval(() => {
      fetch('/api/viewers')
        .then(r => r.json())
        .then(d => { if (!cancelled) setCount(d.count) })
        .catch(() => {})
    }, 10_000)

    // Decrement when the tab closes
    const handleUnload = () => {
      navigator.sendBeacon('/api/viewers-leave')
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
      fetch('/api/viewers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'leave' }) }).catch(() => {})
    }
  }, [])

  return count
}
