import { useState } from 'react'
import { formatCurrency, formatNumber } from '../domain/calculations'
import { baselineErrors, discoveryOpportunityLoss, normalizeSalesCycle, type DiscoveryBaseline } from '../domain/discovery'

export function DiscoveryBaselineFields({ baseline, onChange }: { baseline: DiscoveryBaseline; onChange: (value: DiscoveryBaseline) => void }) {
  const [notification, setNotification] = useState<{ key: keyof DiscoveryBaseline; message: string } | null>(null)
  const errors = baselineErrors(baseline)
  const notifyInvalid = (key: keyof DiscoveryBaseline, value: string, includeEmpty = false) => {
    const error = baselineErrors({ ...baseline, [key]: value })[key]
    const labels: Partial<Record<keyof DiscoveryBaseline, string>> = {
      reps: 'Number of sales reps',
      weeklyPresentations: baseline.mode === 'team' ? 'Presentations per rep per week' : 'Presentations per week',
      offerValue: 'Average offer value', closeRate: 'Current close rate', salesCycle: 'Average Sales Cycle',
    }
    if (error && (value !== '' || includeEmpty)) {
      setNotification({ key, message: `${labels[key] ?? key}: ${error}` })
    } else {
      setNotification((current) => current?.key === key ? null : current)
    }
  }
  const update = (key: keyof DiscoveryBaseline, value: string) => {
    notifyInvalid(key, value)
    const next = { ...baseline, [key]: value }
    if (key === 'closeRate') {
      next.closeRate = value === '' ? '' : String(Math.max(0, Math.min(100, Number(value))))
      next.noDecisionRate = next.closeRate === '' ? '' : String(100 - Number(next.closeRate))
    }
    if (key === 'salesCycle' && (value === '' || Number(value) < 60)) {
      next.salesCycleUnit = 'days'
    }
    onChange(next)
  }
  const field = (key: 'reps' | 'weeklyPresentations' | 'offerValue' | 'closeRate', label: string, max: number, min = 0) => <div className="discovery-baseline-field">
    <label htmlFor={`discovery-${key}`}>{label}</label>
    <input id={`discovery-${key}`} type="number" min={min} max={max} step={key === 'reps' || key === 'weeklyPresentations' ? 1 : 'any'} value={baseline[key]} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `discovery-${key}-error` : undefined} onChange={(event) => update(key, event.target.value)} onBlur={(event) => notifyInvalid(key, event.target.value, true)} />
    {errors[key] ? <span className="discovery-input-error" id={`discovery-${key}-error`}>{errors[key]}</span> : null}
  </div>
  const opportunityLoss = discoveryOpportunityLoss(baseline)
  const output = (label: string, value: string) => <div className="discovery-baseline-field"><label>{label}</label><output className="discovery-baseline-output" aria-label={label}>{value}</output></div>
  return <section className="discovery-card discovery-baseline-card" aria-labelledby="sales-baseline-title">
    {notification ? <div className="discovery-validation-toast" role="alert" aria-atomic="true"><div><strong>Invalid value</strong><p>{notification.message}</p></div><button type="button" aria-label="Dismiss notification" onClick={() => setNotification(null)}>×</button></div> : null}
    <div className="discovery-section-heading"><div><h2 id="sales-baseline-title">Sales Baseline</h2><p className="discovery-sub">Enter the numbers for this Discovery Framework assessment.</p></div></div>
    <div className="discovery-baseline-field discovery-assessment"><label htmlFor="discovery-assessment">Who are you assessing?</label><select id="discovery-assessment" value={baseline.mode} onChange={(event) => update('mode', event.target.value)}><option value="individual">Individual rep</option><option value="team">Sales team</option></select></div>
    <div className="discovery-baseline-fields">
      {baseline.mode === 'team' ? field('reps', 'Number of sales reps', 10000, 1) : null}
      {field('weeklyPresentations', baseline.mode === 'team' ? 'Presentations per rep per week' : 'Presentations per week', 10000)}
      {field('offerValue', 'Average offer value ($)', 1000000000)}
      {field('closeRate', 'Current close rate (%)', 100)}
    </div>
    <section className="discovery-decision-baseline"><h3>Decision Baseline</h3><p>Capture how prospects currently make decisions.</p>
      <div className="discovery-baseline-fields"><div>
        {output('No-Decision / Follow-Up Rate (%)', baseline.closeRate === '' ? '—' : `${formatNumber(100 - Number(baseline.closeRate), 2)}%`)}
        <div className="discovery-opportunity-loss">{output('Opportunity loss', opportunityLoss === null ? '—' : formatCurrency(opportunityLoss))}</div>
      </div><div className="discovery-baseline-field">
        <label htmlFor="discovery-sales-cycle">Average Sales Cycle <span>Optional</span></label>
        <div className="discovery-cycle-input"><input id="discovery-sales-cycle" type="number" min="0" max="10000" step="any" value={baseline.salesCycle} aria-invalid={Boolean(errors.salesCycle)} aria-describedby="discovery-sales-cycle-hint discovery-sales-cycle-error" onChange={(event) => update('salesCycle', event.target.value)} onBlur={(event) => { notifyInvalid('salesCycle', event.target.value, true); onChange(normalizeSalesCycle(baseline)) }} /><select aria-label="Sales cycle time unit" value={baseline.salesCycleUnit} onChange={(event) => onChange(normalizeSalesCycle({ ...baseline, salesCycleUnit: event.target.value as DiscoveryBaseline['salesCycleUnit'] }))}><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div>
        <p id="discovery-sales-cycle-hint">Clearing the value or entering less than 60 switches to Days. More than 59 days converts to months when you leave the field (30 days = 1 month).</p>
        <span className="discovery-input-error" id="discovery-sales-cycle-error">{errors.salesCycle}</span>
      </div></div>
    </section>
  </section>
}
