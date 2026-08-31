import type { RiskAnswer } from '../domain/types'

interface NumberFieldProps {
  id: string
  label: string
  value: number
  prefix?: string
  suffix?: string
  hint?: string
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
}

export function NumberField({ id, label, value, prefix, suffix, hint, min = 0, max, step = 1, onChange }: NumberFieldProps) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      {hint ? <span className="field-hint">{hint}</span> : null}
      <span className="input-wrap">
        {prefix ? <span aria-hidden="true">{prefix}</span> : null}
        <input id={id} type="number" inputMode="decimal" value={Number.isFinite(value) ? value : 0} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
        {suffix ? <span aria-hidden="true">{suffix}</span> : null}
      </span>
    </label>
  )
}

export function CalculatedField({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="field calculated-field">
      <span className="field-label">{label}</span>
      {detail ? <span className="field-hint">{detail}</span> : null}
      <output className="calculated-value">{value}</output>
    </div>
  )
}

export function NotesField({ id, label = 'Notes', value, onChange }: { id: string; label?: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field notes-field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <textarea id={id} value={value} placeholder="Enter notes…" onChange={(event) => onChange(event.target.value.slice(0, 2000))} />
    </label>
  )
}

export function RangeField({ id, label, value, suffix, max = 100, onChange }: { id: string; label: string; value: number; suffix: string; max?: number; onChange: (value: number) => void }) {
  return (
    <label className="range-field" htmlFor={id}>
      <span><strong>{label}</strong><output>{value}{suffix}</output></span>
      <input id={id} type="range" min="0" max={max} step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

interface RiskControlProps {
  id: string
  label: string
  value: RiskAnswer
  onChange: (answer: Exclude<RiskAnswer, null>) => void
}

export function RiskControl({ id, label, value, onChange }: RiskControlProps) {
  return (
    <fieldset className="risk-row">
      <legend>{label}</legend>
      <div className="segmented" aria-label={`${label} response`}>
        <button type="button" className={value === 'yes' ? 'selected danger' : ''} aria-pressed={value === 'yes'} onClick={() => onChange('yes')}>Yes</button>
        <button type="button" className={value === 'no' ? 'selected safe' : ''} aria-pressed={value === 'no'} onClick={() => onChange('no')}>No</button>
      </div>
    </fieldset>
  )
}
