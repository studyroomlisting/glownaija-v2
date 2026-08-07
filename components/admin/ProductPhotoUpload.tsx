'use client'
import { useState, useRef } from 'react'

export default function ProductPhotoUpload({ initialImages = [] }: { initialImages?: string[] }) {
  const [images, setImages]       = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg]             = useState('')
  const [msgType, setMsgType]     = useState<'info' | 'success' | 'error'>('info')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    if (!files.length) return
    setUploading(true); setMsg(''); setMsgType('info')
    const uploaded: string[] = []
    const failures: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) { failures.push(`${file.name} exceeds 5MB`); continue }
      setMsg(`Uploading ${file.name}…`)
      try {
        const fd = new FormData(); fd.append('image', file)
        const res  = await fetch('/api/upload-image', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.url) uploaded.push(data.url)
        else failures.push(`${file.name}: ${data.error || 'upload failed'}`)
      } catch {
        failures.push(`${file.name}: network error`)
      }
    }
    if (uploaded.length) setImages(prev => [...prev, ...uploaded])
    if (failures.length) { setMsg(failures.join('; ')); setMsgType('error') }
    else if (uploaded.length) { setMsg(`✅ ${uploaded.length} photo(s) uploaded`); setMsgType('success') }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeImage(url: string) {
    setImages(prev => prev.filter(i => i !== url))
  }

  return (
    <div>
      <label className="label">Product Photos</label>
      <input type="hidden" name="images" value={images.join(',')} />

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {images.map(url => (
            <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-page-2 group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(url)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-2xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
        </div>
      )}

      <label className="btn btn-outline btn-sm cursor-pointer inline-flex">
        {uploading ? 'Uploading…' : '📷 Upload Photos'}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploading}
          className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
      </label>
      <p className="text-2xs text-ink-3 mt-1">JPG, PNG, WebP or GIF · max 5MB each</p>
      {msg && <p className={`text-xs mt-1 ${msgType === 'error' ? 'text-rose font-semibold' : msgType === 'success' ? 'text-gn font-semibold' : 'text-ink-3'}`}>{msg}</p>}
    </div>
  )
}
