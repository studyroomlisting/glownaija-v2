'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomeSearchForm() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocError('')

    const trimmed = query.trim()
    if (trimmed) {
      // Normal text search — unchanged behaviour.
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
      return
    }

    // Empty search + Search clicked: detect the user's location and show
    // salons near them instead of doing nothing.
    if (!navigator.geolocation) {
      setLocError("Your browser doesn't support location detection. Please type a search term instead.")
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`/api/reverse-geocode?lat=${latitude}&lon=${longitude}`)
          const data = await res.json()
          if (data.city) {
            router.push(`/search?near=${encodeURIComponent(data.city)}`)
          } else {
            setLocError("Couldn't determine your city. Please type a search term instead.")
          }
        } catch {
          setLocError('Something went wrong detecting your location. Please try again.')
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocError('Location access was denied. Please type a search term, or allow location access and try again.')
        } else {
          setLocError('Could not detect your location. Please type a search term instead.')
        }
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="max-w-xl mx-auto lg:mx-0 mb-7">
      <form onSubmit={handleSubmit} className="flex bg-white rounded-2xl overflow-hidden shadow-2xl">
        <span className="pl-5 flex items-center text-ink-3">🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 min-w-0 px-4 py-4 text-sm outline-none text-ink placeholder:text-ink-3 bg-transparent"
          placeholder="Search salons, services, cities… or leave blank to search near you"
        />
        <button type="submit" disabled={locating}
          className="px-7 bg-rose text-white font-bold text-sm hover:bg-rose-dark transition-colors flex-shrink-0 disabled:opacity-70">
          {locating ? 'Locating…' : 'Search'}
        </button>
      </form>
      {locError && (
        <p className="text-white/90 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 text-xs mt-2">{locError}</p>
      )}
    </div>
  )
}
