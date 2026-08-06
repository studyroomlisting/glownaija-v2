'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

interface PhotoUploadProps { salonId: string; images: string[]; onUpdate: (imgs: string[]) => void }

export default function PhotoUpload({ salonId, images, onUpdate }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [msg,       setMsg]       = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    if (!files.length) return
    setUploading(true); setMsg('')
    const uploaded: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) { setMsg(`${file.name} exceeds 5MB, skipped.`); continue }
      setMsg(`Uploading ${file.name}…`)
      const fd = new FormData(); fd.append('image', file)
      const res  = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) { uploaded.push(data.url); setProgress(Math.round((i+1)/files.length*100)) }
    }
    if (uploaded.length) {
      const res  = await fetch('/api/salon-photos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ salon_id: salonId, urls: uploaded }) })
      const data = await res.json()
      if (data.images) onUpdate(data.images)
      setMsg(`✅ ${uploaded.length} photo(s) uploaded!`)
    }
    setUploading(false); setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function deletePhoto(url: string) {
    if (!confirm('Remove this photo?')) return
    const res  = await fetch('/api/salon-photos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ salon_id: salonId, url }) })
    const data = await res.json()
    if (data.images) onUpdate(data.images)
  }

  return (
    <div>
      <p className="text-sm text-ink-3 mb-3">Photos increase bookings by 3×. Add at least 3 of your best work.</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {images.map(img => (
          <div key={img} className="relative aspect-square rounded-xl overflow-hidden border-2 border-bdr group">
            <Image src={img} alt="Salon photo" fill className="object-cover" />
            <button onClick={() => deletePhoto(img)}
              className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 text-white rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose">✕</button>
          </div>
        ))}
        {images.length < 10 && (
          <button onClick={() => inputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-bdr rounded-xl flex flex-col items-center justify-center gap-1 text-ink-3 hover:border-rose hover:text-rose transition-colors">
            <span className="text-2xl">+</span><span className="text-xs font-semibold">Add Photo</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
      {uploading && <div className="h-1.5 bg-page-2 rounded-full overflow-hidden mb-2"><div className="h-full bg-rose transition-all" style={{ width:`${progress}%` }} /></div>}
      {msg && <p className="text-sm text-ink-3">{msg}</p>}
      <button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn btn-outline btn-sm">📷 Upload Photos</button>
    </div>
  )
}
