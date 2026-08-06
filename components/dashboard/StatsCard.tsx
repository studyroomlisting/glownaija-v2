interface StatsCardProps {
  icon: string; label: string; value: string | number
  trend?: string; trendUp?: boolean; href?: string
}

export default function StatsCard({ icon, label, value, trend, trendUp }: StatsCardProps) {
  return (
    <div className="card card-body">
      <div className="icon-badge w-10 h-10 text-lg bg-page-2 mb-3">{icon}</div>
      <div className="text-2xl font-black mb-0.5">{value}</div>
      <div className="text-xs text-ink-3">{label}</div>
      {trend && <div className={`text-xs mt-1.5 font-semibold ${trendUp ? 'text-gn' : 'text-rose'}`}>{trend}</div>}
    </div>
  )
}
