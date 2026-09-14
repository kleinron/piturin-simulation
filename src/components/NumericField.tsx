import type { ReactNode } from 'react'

type Props = {
  id: string
  label: string
  hint?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  disabled?: boolean
}

export function NumericField({
  id,
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  disabled,
}: Props) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field__control">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          dir="ltr"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.valueAsNumber
            onChange(Number.isFinite(next) ? next : 0)
          }}
        />
        {suffix ? <span className="field__suffix">{suffix}</span> : null}
      </div>
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  )
}

type GroupProps = {
  legend: string
  children: ReactNode
}

export function FieldGroup({ legend, children }: GroupProps) {
  return (
    <fieldset className="field-group">
      <legend>{legend}</legend>
      {children}
    </fieldset>
  )
}
