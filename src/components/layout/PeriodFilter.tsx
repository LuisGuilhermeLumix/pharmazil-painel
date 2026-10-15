import { PERIOD_LABELS, type Period, type PeriodPreset } from '@/lib/dates'
import { cn } from '@/lib/utils'

const PRESETS: PeriodPreset[] = ['hoje', 'ontem', '7dias', 'mes', 'custom', 'tudo']

interface PeriodFilterProps {
  value: Period
  onChange: (p: Period) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange({ ...value, preset: p })}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-white',
              value.preset === p && 'bg-white/10 text-white',
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {value.preset === 'custom' && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="date"
            value={value.from ?? ''}
            max={value.to || undefined}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="h-8 rounded-md border border-white/10 bg-white/[0.02] px-2 text-xs text-white [color-scheme:dark]"
          />
          <span>até</span>
          <input
            type="date"
            value={value.to ?? ''}
            min={value.from || undefined}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="h-8 rounded-md border border-white/10 bg-white/[0.02] px-2 text-xs text-white [color-scheme:dark]"
          />
        </div>
      )}
    </div>
  )
}
