import { useMemo, useState, type CSSProperties } from 'react'
import type { RoiInputs } from '../domain/types'

type Side = 'rep' | 'prospect'
type Area = { id: number; side: Side; name: string; quote: string; now: number; after: number; removable?: boolean }
type DiscoveryStep = 0 | 1 | 2 | 3

const initialAreas: Area[] = [
  { id: 1, side: 'rep', name: 'Message & Value Confidence', quote: 'How confidently can I articulate why this conversation and solution matter?', now: 5, after: 6 },
  { id: 2, side: 'rep', name: 'Conversation Confidence', quote: 'How confident am I leading a genuine conversation instead of relying on small talk, scripts, or premature pitching?', now: 5, after: 6 },
  { id: 3, side: 'rep', name: 'Prospect Understanding', quote: 'How effectively can I uncover what the prospect is actually thinking, feeling, and trying to solve?', now: 5, after: 6 },
  { id: 4, side: 'rep', name: 'Conversation Alignment', quote: 'The conversation is centered around what matters to them, not what I want to present.', now: 5, after: 6 },
  { id: 5, side: 'rep', name: 'Authenticity & Conversation Control', quote: 'How naturally can I guide the conversation without forcing rapport, chasing approval, or losing control of the meeting?', now: 5, after: 6 },
  { id: 6, side: 'prospect', name: 'Feeling Heard & Understood', quote: 'They actually understand me.', now: 5, after: 6 },
  { id: 7, side: 'prospect', name: 'Prospect Openness', quote: "I'm willing to hear what they have to say.", now: 5, after: 6 },
  { id: 8, side: 'prospect', name: 'Decision Clarity', quote: 'I understand my situation, what is really causing the problem, and what needs to change.', now: 5, after: 6 },
  { id: 9, side: 'prospect', name: 'Solution Alignment', quote: "What they're showing me actually fits what I need.", now: 5, after: 6 },
  { id: 10, side: 'prospect', name: 'Decision Confidence', quote: 'I feel confident enough to seriously consider moving forward.', now: 5, after: 6 },
]

const periods = [['Week', 1], ['Month', 4], ['Quarter', 13], ['Year', 52]] as const
const money = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`
const rangeStyle = (value: number, min: number, max: number) => ({ '--range-progress': `${(value - min) / (max - min) * 100}%` } as CSSProperties)

function ScoreRow({ area, onChange, onRemove }: { area: Area; onChange: (key: 'now' | 'after', value: number) => void; onRemove: () => void }) {
  const lift = area.after - area.now
  return <div className="discovery-score-row">
    <div className="discovery-score-head"><div className="discovery-score-name">{area.name}{area.removable ? <button type="button" className="discovery-remove" onClick={onRemove} aria-label={`Remove ${area.name}`}>x</button> : null}</div><div className="discovery-badges"><span>Now {area.now}</span><span>After {area.after}</span><strong>+{lift}</strong></div></div>
    <p>{area.quote}</p>
    <label><span>Current</span><input className="discovery-range-current" type="range" min="1" max="10" value={area.now} style={rangeStyle(area.now, 1, 10)} onChange={(event) => onChange('now', Number(event.target.value))} /></label>
    <label><span>After framework</span><input type="range" min="1" max="10" value={area.after} style={rangeStyle(area.after, 1, 10)} onChange={(event) => onChange('after', Number(event.target.value))} /></label>
  </div>
}

export function DiscoveryImpactPage({ inputs, updateInput }: { inputs: RoiInputs; updateInput: <K extends keyof RoiInputs>(key: K, value: RoiInputs[K]) => void }) {
  const presentations = inputs.presentationVolume / 52
  const offerValue = inputs.averageDealValue
  const closeRate = inputs.currentCloseRate
  const [sensitivity, setSensitivity] = useState(20)
  const [conservative, setConservative] = useState(100)
  const [areas, setAreas] = useState(initialAreas)
  const [activeStep, setActiveStep] = useState<DiscoveryStep>(0)
  const steps = ['Baseline', 'Rep improvements', 'Prospect conditions', 'Review impact']
  const projection = useMemo(() => {
    const averageLift = areas.reduce((total, area) => total + area.after - area.now, 0) / areas.length
    const currentRate = closeRate / 100
    const afterRate = Math.min(0.85, currentRate * (1 + averageLift * sensitivity / 100 * conservative / 100))
    return { averageLift, currentRate, afterRate, annualExtra: presentations * 52 * (afterRate - currentRate) * offerValue }
  }, [areas, closeRate, conservative, offerValue, presentations, sensitivity])

  const updateArea = (id: number, key: 'now' | 'after', value: number) => setAreas((current) => current.map((area) => {
    if (area.id !== id) return area
    const next = { ...area, [key]: value }
    if (key === 'now' && next.after < value) next.after = value
    if (key === 'after' && next.now > value) next.now = value
    return next
  }))

  const addArea = (side: Side) => {
    const name = window.prompt(`Name this ${side}-side area:`)?.trim()
    if (!name) return
    setAreas((current) => [...current, { id: Date.now(), side, name, quote: 'Custom area added for this projection.', now: 5, after: 6, removable: true }])
  }

  return <>
    <header className="module-header"><h1>Discovery Framework <span>| Impact lift</span></h1><div><strong>{money(projection.annualExtra)}</strong><span>Projected annual revenue lift</span></div></header>
    <div className="discovery-page"><div className="discovery-intro"><strong>Discovery Framework Impact Lift</strong><span>Build the estimate in four simple steps. Your ROI inputs stay synchronized throughout.</span></div>
      <nav className="discovery-steps" aria-label="Discovery Framework steps">{steps.map((step, index) => <button key={step} type="button" className={activeStep === index ? 'active' : ''} onClick={() => setActiveStep(index as DiscoveryStep)}><span>{index + 1}</span>{step}</button>)}</nav>
      <div className="discovery-grid"><div>
        {activeStep === 0 ? <section className="discovery-card"><div className="discovery-section-heading"><div><h2>The Rep's Current Numbers</h2><p className="discovery-sub">Your existing ROI inputs are shown here.</p></div></div>
          <div className="discovery-field"><label htmlFor="discovery-presentations">Presentations per week</label><input id="discovery-presentations" type="number" min="0" step="0.1" value={presentations.toFixed(1)} onChange={(event) => updateInput('presentationVolume', Number(event.target.value) * 52)} /><span>from annual ROI data</span></div>
          <div className="discovery-field"><label htmlFor="discovery-offer">Average offer value</label><output id="discovery-offer">{money(offerValue)}</output><span>from ROI data</span></div>
          <div className="discovery-field"><label htmlFor="discovery-close">Current close rate</label><output id="discovery-close">{closeRate}%</output><span>from ROI data</span></div>
        </section> : null}
        {activeStep === 1 || activeStep === 2 ? <section className="discovery-card"><div className="discovery-section-heading"><div><h2 className={activeStep === 1 ? 'rep' : 'prospect'}>{activeStep === 1 ? 'Rep Improvements' : 'Prospect Decision Conditions'}</h2><p className="discovery-sub">{activeStep === 1 ? 'Rate how the rep shows up on the call.' : 'Rate how the prospect feels and decides.'}</p></div></div>{areas.filter((area) => area.side === (activeStep === 1 ? 'rep' : 'prospect')).map((area) => <ScoreRow key={area.id} area={area} onChange={(key, value) => updateArea(area.id, key, value)} onRemove={() => setAreas((current) => current.filter((item) => item.id !== area.id))} />)}<button type="button" className="discovery-add" onClick={() => addArea(activeStep === 1 ? 'rep' : 'prospect')}>+ Add a custom area</button></section> : null}
        {activeStep === 3 ? <section className="discovery-card discovery-review-card"><div className="discovery-section-heading"><div><h2>Review Your Impact</h2><p className="discovery-sub">Adjust the projection assumptions, then use the result to discuss the opportunity.</p></div></div><div className="discovery-review-grid"><div><strong>{(projection.afterRate * 100).toFixed(1)}%</strong><span>Projected close rate</span></div><div><strong>{money(projection.annualExtra)}</strong><span>Additional revenue per year</span></div><div><strong>{projection.averageLift.toFixed(1)}</strong><span>Average score lift</span></div></div></section> : null}
        <div className="discovery-step-actions"><button type="button" className="discovery-secondary" disabled={activeStep === 0} onClick={() => setActiveStep((activeStep - 1) as DiscoveryStep)}>Back</button><button type="button" className="discovery-primary" disabled={activeStep === 3} onClick={() => setActiveStep((activeStep + 1) as DiscoveryStep)}>{activeStep === 2 ? 'Review impact' : 'Continue'}</button></div>
      </div><aside className="discovery-results">
        <section className="discovery-card"><div className="discovery-section-heading"><div><h2>Live Impact</h2><p className="discovery-sub">Updates as you score each area.</p></div></div><div className="discovery-live-result"><strong>{money(projection.annualExtra)}</strong><span>Additional revenue per year</span></div><div className="discovery-live-metrics"><div><strong>{closeRate}%</strong><span>Current close rate</span></div><div><strong>{(projection.afterRate * 100).toFixed(1)}%</strong><span>After framework</span></div></div></section>
        {activeStep === 3 ? <section className="discovery-card"><div className="discovery-section-heading"><div><h2>Projection Controls</h2><p className="discovery-sub">Adjust the estimate without changing ROI inputs.</p></div></div><label className="discovery-lever">Impact sensitivity <strong>{sensitivity}%</strong><input type="range" min="5" max="40" value={sensitivity} style={rangeStyle(sensitivity, 5, 40)} onChange={(event) => setSensitivity(Number(event.target.value))} /></label><label className="discovery-lever">Conservative factor <strong>{conservative}%</strong><input type="range" min="25" max="100" step="5" value={conservative} style={rangeStyle(conservative, 25, 100)} onChange={(event) => setConservative(Number(event.target.value))} /></label></section> : null}
        <section className="discovery-card discovery-result-card"><h2>The Lift</h2><div className="discovery-result-hero"><strong>{money(projection.annualExtra)}</strong><span>Extra revenue per year</span></div><div className="discovery-rate-strip"><div><strong>{closeRate}%</strong><span>Close rate now</span></div><div><strong>{(projection.afterRate * 100).toFixed(1)}%</strong><span>After framework</span></div><div><strong>{projection.averageLift.toFixed(1)}</strong><span>Avg score lift</span></div></div><table><thead><tr><th>Period</th><th>Now</th><th>After</th><th>Extra $</th></tr></thead><tbody>{periods.map(([label, multiplier]) => { const now = presentations * multiplier * projection.currentRate * offerValue; const after = presentations * multiplier * projection.afterRate * offerValue; return <tr key={label} className={label === 'Year' ? 'total' : undefined}><td>{label}</td><td>{money(now)}</td><td>{money(after)}</td><td>{money(after - now)}</td></tr> })}</tbody></table></section>
      </aside></div>
    </div>
  </>
}