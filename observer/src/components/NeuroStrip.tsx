import type { NeuroLevels } from '../lib/types';
import { NEURO_LEVELS, NEURO_COLORS } from '../lib/constants';

type NeuroStripProps = {
  levels: NeuroLevels;
};

type NeuroModulator = {
  key: keyof NeuroLevels;
  abbrev: string;
  name: string;
};

const neuroModulators: NeuroModulator[] = [
  { key: 'noradrenaline', abbrev: 'NOR', name: 'Noradrenaline' },
  { key: 'acetylcholine', abbrev: 'ACH', name: 'Acetylcholine' },
  { key: 'serotonin', abbrev: 'SER', name: 'Serotonin' },
  { key: 'dopamine', abbrev: 'DOP', name: 'Dopamine' },
];

export function NeuroStrip({ levels }: NeuroStripProps) {
  return (
    <div className="flex gap-4">
      {neuroModulators.map(({ key, abbrev, name }) => {
        const level = levels[key];
        const width = NEURO_LEVELS[level] || 0;
        const color = NEURO_COLORS[level] || '#71717a';

        return (
          <div key={key} className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-300" title={name}>
                {abbrev}
              </span>
              <span className="text-xs text-zinc-400">{level}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                role="progressbar"
                aria-label={`${name} level`}
                aria-valuenow={width}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${width}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
