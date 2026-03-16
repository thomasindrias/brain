import type { BackgroundAgentStatus } from '../lib/types';

type BackgroundAgentsProps = {
  status: BackgroundAgentStatus;
};

type Agent = {
  key: keyof BackgroundAgentStatus;
  label: string;
};

const agents: Agent[] = [
  { key: 'hypothalamus', label: 'Hypothalamus' },
  { key: 'reward-system', label: 'Reward System' },
  { key: 'default-mode', label: 'Default Mode' },
];

// Map status values to colors
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'idle':
      return 'text-zinc-500';
    case 'monitoring':
    case 'consolidating':
      return 'text-blue-400';
    case 'positive':
      return 'text-green-400';
    case 'warning':
    case 'negative':
      return 'text-orange-400';
    default:
      return 'text-zinc-400';
  }
};

export function BackgroundAgents({ status }: BackgroundAgentsProps) {
  return (
    <div className="flex gap-3">
      {agents.map(({ key, label }) => {
        const agentStatus = status[key];
        const colorClass = getStatusColor(agentStatus);

        return (
          <div
            key={key}
            className="px-3 py-1.5 bg-zinc-800 rounded-md border border-zinc-700"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400">{label}</span>
              <span className={`text-xs font-semibold ${colorClass}`}>
                {agentStatus}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
