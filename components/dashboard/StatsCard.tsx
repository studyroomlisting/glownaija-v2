interface StatsCardProps {
  icon: string; label: string; value: string | number
  trend?: string; trendUp?: boolean; href?: string
}

export default function StatsCard({ icon, label, value, trend, trendUp }: StatsCardProps) {
  return (
    <div className="card card-body text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-black mb-1">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wide text-ink-3">{label}</div>
      {trend && <div className={`text-xs mt-1 font-semibold ${trendUp ? 'text-gn' : 'text-rose'}`}>{trend}</div>}
    </div>
  )
}
