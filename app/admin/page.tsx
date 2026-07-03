"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, LogOut } from "lucide-react"
import { AdminLogin } from "@/components/admin/admin-login"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { VesselManager } from "@/components/admin/vessel-manager"
import { useGalleryStore } from "@/lib/gallery-store"

const SESSION_KEY = "swire-admin-auth"

export default function AdminPage() {
  const { vessels, ready } = useGalleryStore()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "1")
  }, [])

  const login = () => {
    sessionStorage.setItem(SESSION_KEY, "1")
    setAuthed(true)
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
  }

  if (!authed) {
    return <AdminLogin onSuccess={login} />
  }

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">Galley Admin</h1>
            <p className="text-xs text-muted-foreground">Swire Bulk · signed in as max</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={15} aria-hidden />
              <span className="hidden sm:inline">Gallery</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-danger"
            >
              <LogOut size={15} aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {ready ? (
          <>
            <DashboardStats vessels={vessels} />
            <VesselManager vessels={vessels} />
          </>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Loading data…</p>
        )}
      </div>
    </main>
  )
}
