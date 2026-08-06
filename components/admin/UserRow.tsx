'use client'
import { updateUserStatus } from '@/lib/actions/admin'
import type { Profile } from '@/types/database'

export default function UserRow({ profile, isSelf }: { profile: Profile & { email?: string; booking_count?: number; salon_name?: string }; isSelf: boolean }) {
  return (
    <div className="card card-body flex justify-between items-center flex-wrap gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-bold text-sm">{profile.first_name} {profile.last_name}</span>
          {profile.is_admin && <span className="badge-pill bg-rose text-white text-2xs">Admin</span>}
          {profile.account_type === 'owner' && <span className="badge-pill bg-blue-100 text-blue-700 text-2xs">Owner</span>}
        </div>
        <p className="text-xs text-ink-3">{profile.email}</p>
        <p className="text-xs text-ink-3">{profile.booking_count || 0} bookings{profile.salon_name ? ` · 🏪 ${profile.salon_name}` : ''}</p>
      </div>
      {!isSelf && (
        <form action={async () => { 'use server'; await updateUserStatus(profile.id, false) }}>
          <button className="btn btn-outline btn-sm text-xs text-rose border-rose/50">Ban</button>
        </form>
      )}
    </div>
  )
}
