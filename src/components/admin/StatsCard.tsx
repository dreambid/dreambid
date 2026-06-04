interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

const colorClass = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
};

export function StatsCard({ label, value, change, icon, color = 'blue' }: StatsCardProps) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {change && <p className="mt-1 text-xs text-gray-400">{change}</p>}
        </div>
        <div className={`rounded-xl p-3 text-2xl ${colorClass[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
