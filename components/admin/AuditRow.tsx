import type { Database } from '@/types/database'

type AuditLog = Database['public']['Tables']['audit_logs']['Row'] & {
  profiles?: { first_name: string; last_name: string } | null
}

const ACTION_COLORS: Record<string, string> = {
  salon_approved:  'text-gn',
  salon_suspended: 'text-rose',
  salon_featured:  'text-gold',
  user_banned:     'text-rose',
  user_unbanned:   'text-gn',
  review_deleted:  'text-rose',
  order_refunded:  'text-rose',
}

export default function AuditRow({ log }: { log: AuditLog }) {
  const date = new Date(log.created_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
  const colorClass = ACTION_COLORS[log.action] || 'text-ink'
  return (
    <div className="flex gap-4 py-2.5 border-b border-bdr last:border-0 text-xs flex-wrap">
      <span className="text-ink-3 w-28 flex-shrink-0">{date}</span>
      <span className={`font-bold w-40 flex-shrink-0 ${colorClass}`}>{log.action.replace(/_/g, ' ')}</span>
      <span className="text-ink-3">{log.entity_type} · {log.profiles?.first_name} {log.profiles?.last_name}</span>
    </div>
  )
}
