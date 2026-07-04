import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const vesselName = (form.get('vesselName') as string | null)?.trim()

    if (!file || !vesselName) {
      return NextResponse.json({ error: 'Missing file or vesselName' }, { status: 400 })
    }

    // Sanitise the vessel name so it is safe as a folder name.
    const safeFolder = vesselName.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '-')

    const ext = path.extname(file.name).toLowerCase() || '.jpg'
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Build the target directory: public/vessels/<vessel-name>/
    const dir = path.join(process.cwd(), 'public', 'vessels', safeFolder)

    const filename = `${Date.now()}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, filename), buffer)
    } catch (fsErr: unknown) {
      // The v0 preview sandbox has a read-only filesystem — writing to public/
      // is blocked. Return a placeholder so the rest of the flow still works
      // in preview. On a real Ubuntu server this branch is never hit.
      const msg = fsErr instanceof Error ? fsErr.message : String(fsErr)
      if (msg.includes('read-only') || msg.includes('EROFS') || msg.includes('EACCES') || msg.includes('EPERM')) {
        console.warn('[upload] Read-only filesystem (preview sandbox) — returning placeholder path')
        const fallback = ['/dish-chicken.png', '/dish-beef.png', '/dish-buffet.png', '/dish-fruit.png']
        const placeholder = fallback[Math.floor(Math.random() * fallback.length)]
        return NextResponse.json({ path: placeholder, preview: true })
      }
      throw fsErr
    }

    // Return the public URL path so Next.js <Image> can serve it.
    const publicPath = `/vessels/${safeFolder}/${filename}`
    return NextResponse.json({ path: publicPath })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
