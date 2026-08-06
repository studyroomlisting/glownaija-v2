'use client'
import { updateUserStatus, toggleAdmin } from '@/lib/actions/admin'
import ActionButton from '@/components/dashboard/ActionButton'
import type { Profile } from '@/types/database'

interface UserRowProps {
  profile: Profile & { email?: string; booking_count?: number; salon_name?: string; banned?: boolean }
  isSelf: boolean
}

export default function UserRow({ profile, isSelf }: UserRowProps) {
  return (
    <div className="card card-body flex justify-between items-center flex-wrap gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-bold text-sm">{profile.first_name} {profile.last_name}</span>
          {profile.is_admin && <span className="badge-pill bg-rose text-white text-2xs">Admin</span>}
          {profile.account_type === 'owner' && <span className="badge-pill bg-blue-100 text-blue-700 text-2xs">Owner</span>}
          {profile.banned && <span className="badge-pill bg-page-2 text-ink-3 text-2xs">Banned</span>}
        </div>
        <p className="text-xs text-ink-3">{profile.email}</p>
        <p className="text-xs text-ink-3">{profile.booking_count || 0} bookings{profile.salon_name ? ` · 🏪 ${profile.salon_name}` : ''}</p>
      </div>
      {!isSelf && (
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <ActionButton action={() => toggleAdmin(profile.id, !profile.is_admin)} className="btn btn-outline btn-sm text-xs">
            {profile.is_admin ? 'Remove Admin' : 'Make Admin'}
          </ActionButton>
          <ActionButton
            action={() => updateUserStatus(profile.id, !!profile.banned)}
            className={`btn btn-outline btn-sm text-xs ${profile.banned ? 'text-gn border-gn' : 'text-rose border-rose/50'}`}
            confirmMessage={profile.banned ? undefined : `Ban ${profile.first_name || 'this user'}? They won't be able to sign in.`}
          >
            {profile.banned ? 'Unban' : 'Ban'}
          </ActionButton>
        </div>
      )}
    </div>
  )
}
