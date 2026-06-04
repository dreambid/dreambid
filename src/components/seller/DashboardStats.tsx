interface Stat {
  label: string;
  value: string | number;
  description?: string;
}

interface DashboardStatsProps {
  stats: Stat[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
          {stat.description && (
            <p className="mt-1 text-xs text-gray-400">{stat.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
