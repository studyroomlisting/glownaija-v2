'use client'
import { useState, useRef } from 'react'

export default function EventImageUpload({ initialUrl }: { initialUrl?: string | null }) {
  const [imageUrl, setImageUrl]   = useState(initialUrl || '')
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) { setError('Max 5MB allowed'); return }
    setUploading(true); setError('')
    try {
      const fd  = new FormData(); fd.append('image', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setImageUrl(data.url)
      else setError(data.error || 'Upload failed')
    } catch {
      setError('Network error while uploading')
    }
    setUploading(false)
  }

  return (
    <div>
      <label className="label">Event Image <span className="font-normal text-ink-3">(optional)</span></label>
      <input type="hidden" name="image_url" value={imageUrl} />

      {imageUrl ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden bg-page-2 mb-2">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => setImageUrl('')}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-rose transition-colors">✕</button>
        </div>
      ) : (
        <label className="btn btn-outline btn-sm cursor-pointer inline-flex">
          {uploading ? 'Uploading…' : '📷 Upload Image'}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading}
            className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      )}
      <p className="text-2xs text-ink-3 mt-1">JPG, PNG, WebP or GIF · max 5MB. If skipped, a default icon is shown instead.</p>
      {error && <p className="text-xs text-rose font-semibold mt-1">{error}</p>}
    </div>
  )
}
