import { formatPercent } from '../calc/format.ts'

type Props = {
  id: string
  label: string
  hint?: string
  minPct: number
  maxPct: number
  stepPct: number
  value: number
  onChange: (decimal: number) => void
  tone: 'fund' | 'market'
}

export function RateSlider({
  id,
  label,
  hint,
  minPct,
  maxPct,
  stepPct,
  value,
  onChange,
  tone,
}: Props) {
  const pct = value * 100

  return (
    <div className={`rate-slider rate-slider--${tone}`}>
      <div className="rate-slider__header">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{formatPercent(value)}</output>
      </div>
      <input
        id={id}
        type="range"
        min={minPct}
        max={maxPct}
        step={stepPct}
        value={pct}
        dir="ltr"
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
      <div className="rate-slider__ends" dir="ltr">
        <span>{formatPercent(minPct / 100)}</span>
        <span>{formatPercent(maxPct / 100)}</span>
      </div>
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  )
}
