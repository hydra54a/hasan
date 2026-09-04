import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import type { RoiInputs } from '../domain/types'

type Side = 'rep' | 'prospect'
type Area = { id: number; side: Side; name: string; quote: string; now: number; after: number; removable?: boolean }
type DiscoveryStep = 0 | 1 | 2 | 3
type CustomAreaDraft = { side: Side; name: string; description: string }

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
const scoreOptions = Array.from({ length: 10 }, (_, index) => index + 1)

function CheckIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.2 10.2 3.1 3.1 6.6-7" /></svg>
}

function PersonIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4" /><path d="M4.5 21c0-4.2 3.1-7 7.5-7s7.5 2.8 7.5 7" /></svg>
}

function scoreSummary(area: Area, score: number, improved: boolean) {
  if (area.id === 1) {
    if (improved) return score >= 6 ? 'Stronger, clearer, and more compelling—your message drives understanding and action.' : 'Your message is becoming clearer and easier for the prospect to understand.'
    return score <= 5 ? 'You have a foundation, but the message lacks clarity and impact.' : 'Your message is clear, with room to make its value more compelling.'
  }

  if (improved) {
    if (score >= 9) return 'This becomes a consistent strength that builds trust and supports confident decisions.'
    if (score >= 6) return 'Stronger and more intentional—this creates a clearer, more productive conversation.'
    return 'The framework begins to create more clarity, confidence, and forward movement.'
  }

  if (score >= 9) return 'This is already a consistent strength in the conversation.'
  if (score >= 6) return 'A solid foundation is present, with room for greater consistency and impact.'
  return 'There is a foundation here, but greater clarity and consistency are needed.'
}

function ScoreSelector({ label, value, tone, onChange }: { label: string; value: number; tone: 'current' | 'after'; onChange: (value: number) => void }) {
  return <section className={`discovery-score-panel ${tone}`} aria-label={`${label} rating`}>
    <div className="discovery-score-panel-label">{label}</div>
    <div className="discovery-score-value"><strong>{value}</strong><span>/ 10</span></div>
    <p className="discovery-score-prompt">Select your {tone === 'current' ? 'current' : 'expected'} rating</p>
    <div className="discovery-score-options" role="group" aria-label={`${label}: ${value} out of 10`}>
      {scoreOptions.map((score) => <button key={score} type="button" className={score === value ? 'selected' : ''} aria-pressed={score === value} aria-label={`Set ${label.toLowerCase()} rating to ${score}`} onClick={() => onChange(score)}>{score}{score === value ? <span className="discovery-score-check"><CheckIcon /></span> : null}</button>)}
    </div>
  </section>
}

function ScoreRow({ area, onChange, onRemove }: { area: Area; onChange: (key: 'now' | 'after', value: number) => void; onRemove: () => void }) {
  const lift = area.after - area.now
  return <article className="discovery-score-row">
    <header className="discovery-score-head">
      <div><h3>{area.name}</h3><p>{area.quote}</p></div>
      <div className={`discovery-impact-type ${area.side}`}><PersonIcon />{area.side === 'rep' ? 'Sales Rep Impact' : 'Prospect Impact'}</div>
      {area.removable ? <button type="button" className="discovery-remove" onClick={onRemove} aria-label={`Remove ${area.name}`}>Remove</button> : null}
    </header>
    <div className="discovery-score-comparison">
      <div className="discovery-score-side current">
        <ScoreSelector label="Current" value={area.now} tone="current" onChange={(value) => onChange('now', value)} />
        <p className="discovery-score-summary">{scoreSummary(area, area.now, false)}</p>
      </div>
      <div className="discovery-lift" aria-label={`${lift} point lift`}><div><strong>+{lift}</strong><span>Lift</span></div><p>Discovery<br />Framework</p></div>
      <div className="discovery-score-side after">
        <ScoreSelector label="With Discovery Framework" value={area.after} tone="after" onChange={(value) => onChange('after', value)} />
        <p className="discovery-score-summary">{scoreSummary(area, area.after, true)}</p>
      </div>
    </div>
  </article>
}

export function DiscoveryImpactPage({ inputs, updateInput }: { inputs: RoiInputs; updateInput: <K extends keyof RoiInputs>(key: K, value: RoiInputs[K]) => void }) {
  const presentations = inputs.presentationVolume / 52
  const offerValue = inputs.averageDealValue
  const closeRate = inputs.currentCloseRate
  const [sensitivity, setSensitivity] = useState(20)
  const [conservative, setConservative] = useState(100)
  const [areas, setAreas] = useState(initialAreas)
  const [activeStep, setActiveStep] = useState<DiscoveryStep>(0)
  const [customAreaDraft, setCustomAreaDraft] = useState<CustomAreaDraft | null>(null)
  const [customAreaError, setCustomAreaError] = useState('')
  const steps = ['Baseline', 'Rep improvements', 'Prospect conditions', 'Review impact']
  const isCustomAreaModalOpen = customAreaDraft !== null
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

  useEffect(() => {
    if (!isCustomAreaModalOpen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCustomAreaDraft(null)
        setCustomAreaError('')
      }
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isCustomAreaModalOpen])

  const openCustomAreaModal = (side: Side) => {
    setCustomAreaError('')
    setCustomAreaDraft({ side, name: '', description: '' })
  }

  const closeCustomAreaModal = () => {
    setCustomAreaDraft(null)
    setCustomAreaError('')
  }

  const submitCustomArea = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!customAreaDraft) return
    const name = customAreaDraft.name.trim()
    const description = customAreaDraft.description.trim()
    if (!name || !description) {
      setCustomAreaError('Enter both an area name and a detailed description.')
      return
    }
    setAreas((current) => [...current, { id: Date.now(), side: customAreaDraft.side, name, quote: description, now: 5, after: 6, removable: true }])
    closeCustomAreaModal()
  }

  return <>
    <header className="module-header"><h1>Discovery Framework</h1><div><strong>{money(projection.annualExtra)}</strong></div></header>
    <section className="dashboard-intro discovery-intro-full" aria-labelledby="discovery-guidance-title"><h3 id="discovery-guidance-title">Discovery Framework Impact Lift</h3><p>Build the estimate in four simple steps. Your ROI inputs stay synchronized throughout.</p></section>
    <div className="discovery-page"><nav className="discovery-steps" aria-label="Discovery Framework steps">{steps.map((step, index) => <button key={step} type="button" className={activeStep === index ? 'active' : ''} onClick={() => setActiveStep(index as DiscoveryStep)}><span>{index + 1}</span>{step}</button>)}</nav>
      <div className={`discovery-grid ${activeStep === 1 || activeStep === 2 ? 'discovery-grid-scoring' : ''}`}><div>
        {activeStep === 0 ? <section className="discovery-card"><div className="discovery-section-heading"><div><h2>The Rep's Current Numbers</h2><p className="discovery-sub">Your existing ROI inputs are shown here.</p></div></div>
          <div className="discovery-field"><label htmlFor="discovery-presentations">Presentations per week</label><input id="discovery-presentations" type="number" min="0" step="0.1" value={presentations.toFixed(1)} onChange={(event) => updateInput('presentationVolume', Number(event.target.value) * 52)} /><span>from annual ROI data</span></div>
          <div className="discovery-field"><label htmlFor="discovery-offer">Average offer value</label><output id="discovery-offer">{money(offerValue)}</output><span>from ROI data</span></div>
          <div className="discovery-field"><label htmlFor="discovery-close">Current close rate</label><output id="discovery-close">{closeRate}%</output><span>from ROI data</span></div>
        </section> : null}
        {activeStep === 1 || activeStep === 2 ? <section className="discovery-score-stage"><div className="discovery-card discovery-score-heading-card"><div className="discovery-section-heading"><div><h2 className={activeStep === 1 ? 'rep' : 'prospect'}>{activeStep === 1 ? 'Rep Improvements' : 'Prospect Decision Conditions'}</h2><p className="discovery-sub">{activeStep === 1 ? 'Rate how the rep shows up on the call.' : 'Rate how the prospect feels and decides.'}</p></div></div></div>{areas.filter((area) => area.side === (activeStep === 1 ? 'rep' : 'prospect')).map((area) => <ScoreRow key={area.id} area={area} onChange={(key, value) => updateArea(area.id, key, value)} onRemove={() => setAreas((current) => current.filter((item) => item.id !== area.id))} />)}<button type="button" className="discovery-add" onClick={() => openCustomAreaModal(activeStep === 1 ? 'rep' : 'prospect')}>+ Add a custom area</button></section> : null}
        {activeStep === 3 ? <section className="discovery-card discovery-review-card"><div className="discovery-section-heading"><div><h2>Review Your Impact</h2><p className="discovery-sub">Adjust the projection assumptions, then use the result to discuss the opportunity.</p></div></div><div className="discovery-review-grid"><div><strong>{(projection.afterRate * 100).toFixed(1)}%</strong><span>Projected close rate</span></div><div><strong>{money(projection.annualExtra)}</strong><span>Additional revenue per year</span></div><div><strong>{projection.averageLift.toFixed(1)}</strong><span>Average score lift</span></div></div></section> : null}
        <div className="discovery-step-actions"><button type="button" className="discovery-secondary" disabled={activeStep === 0} onClick={() => setActiveStep((activeStep - 1) as DiscoveryStep)}>Back</button><button type="button" className="discovery-primary" disabled={activeStep === 3} onClick={() => setActiveStep((activeStep + 1) as DiscoveryStep)}>{activeStep === 2 ? 'Review impact' : 'Continue'}</button></div>
      </div><aside className="discovery-results">
        <section className="discovery-card"><div className="discovery-section-heading"><div><h2>Live Impact</h2><p className="discovery-sub">Updates as you score each area.</p></div></div><div className="discovery-live-result"><strong>{money(projection.annualExtra)}</strong><span>Additional revenue per year</span></div><div className="discovery-live-metrics"><div><strong>{closeRate}%</strong><span>Current close rate</span></div><div><strong>{(projection.afterRate * 100).toFixed(1)}%</strong><span>After framework</span></div></div></section>
        {activeStep === 3 ? <section className="discovery-card"><div className="discovery-section-heading"><div><h2>Projection Controls</h2><p className="discovery-sub">Adjust the estimate without changing ROI inputs.</p></div></div><label className="discovery-lever">Impact sensitivity <strong>{sensitivity}%</strong><input type="range" min="5" max="40" value={sensitivity} style={rangeStyle(sensitivity, 5, 40)} onChange={(event) => setSensitivity(Number(event.target.value))} /></label><label className="discovery-lever">Conservative factor <strong>{conservative}%</strong><input type="range" min="25" max="100" step="5" value={conservative} style={rangeStyle(conservative, 25, 100)} onChange={(event) => setConservative(Number(event.target.value))} /></label></section> : null}
        <section className="discovery-card discovery-result-card"><h2>The Lift</h2><div className="discovery-result-hero"><strong>{money(projection.annualExtra)}</strong><span>Extra revenue per year</span></div><div className="discovery-rate-strip"><div><strong>{closeRate}%</strong><span>Close rate now</span></div><div><strong>{(projection.afterRate * 100).toFixed(1)}%</strong><span>After framework</span></div><div><strong>{projection.averageLift.toFixed(1)}</strong><span>Avg score lift</span></div></div><table><thead><tr><th>Period</th><th>Now</th><th>After</th><th>Extra $</th></tr></thead><tbody>{periods.map(([label, multiplier]) => { const now = presentations * multiplier * projection.currentRate * offerValue; const after = presentations * multiplier * projection.afterRate * offerValue; return <tr key={label} className={label === 'Year' ? 'total' : undefined}><td>{label}</td><td>{money(now)}</td><td>{money(after)}</td><td>{money(after - now)}</td></tr> })}</tbody></table></section>
      </aside></div>
    </div>
    {customAreaDraft ? <div className="discovery-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCustomAreaModal() }}>
      <section className="discovery-modal" role="dialog" aria-modal="true" aria-labelledby="custom-area-title" aria-describedby="custom-area-help">
        <header className="discovery-modal-header"><div><h2 id="custom-area-title">Add a custom {customAreaDraft.side === 'rep' ? 'sales rep' : 'prospect'} area</h2><p id="custom-area-help">Define another factor to score in the Discovery Framework. New areas begin at a Current rating of 5 and an Expected rating of 6, and are included in the live impact calculation.</p></div><button type="button" className="discovery-modal-close" onClick={closeCustomAreaModal} aria-label="Close custom area dialog"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg></button></header>
        <form onSubmit={submitCustomArea} noValidate>
          <div className="discovery-modal-body">
            <label className="discovery-modal-field" htmlFor="custom-area-name"><span>Area name</span><input id="custom-area-name" autoFocus maxLength={80} value={customAreaDraft.name} aria-invalid={Boolean(customAreaError && !customAreaDraft.name.trim())} placeholder={customAreaDraft.side === 'rep' ? 'e.g. Objection handling confidence' : 'e.g. Confidence in the next step'} onChange={(event) => { setCustomAreaDraft((current) => current ? { ...current, name: event.target.value } : current); setCustomAreaError('') }} /><small>Use a short, specific title that is easy to recognize.</small></label>
            <label className="discovery-modal-field" htmlFor="custom-area-description"><span>Detailed description</span><textarea id="custom-area-description" rows={4} maxLength={240} value={customAreaDraft.description} aria-invalid={Boolean(customAreaError && !customAreaDraft.description.trim())} placeholder="Describe what this area measures and why it matters in the conversation." onChange={(event) => { setCustomAreaDraft((current) => current ? { ...current, description: event.target.value } : current); setCustomAreaError('') }} /><small>This description appears beneath the area title. {customAreaDraft.description.length}/240</small></label>
            {customAreaError ? <p className="discovery-modal-error">{customAreaError}</p> : null}
          </div>
          <footer className="discovery-modal-actions"><button type="button" className="discovery-modal-cancel" onClick={closeCustomAreaModal}>Cancel</button><button type="submit" className="discovery-modal-submit">Add area</button></footer>
        </form>
      </section>
    </div> : null}
  </>
}
