type StatusBadgeProps = {
  value: string;
};

// Map status values to colors
const getStatusColor = (value: string): string => {
  switch (value) {
    case 'SAFE':
      return '#22c55e'; // green-500
    case 'ELEVATED':
      return '#eab308'; // yellow-500
    case 'THREAT_DETECTED':
      return '#ef4444'; // red-500
    case 'FOUND':
      return '#3b82f6'; // blue-500
    case 'PASS':
      return '#22c55e'; // green-500
    case 'FAIL':
      return '#ef4444'; // red-500
    default:
      return '#71717a'; // zinc-500
  }
};

export function StatusBadge({ value }: StatusBadgeProps) {
  const color = getStatusColor(value);

  return (
    <div
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}`,
      }}
    >
      {value}
    </div>
  );
}
