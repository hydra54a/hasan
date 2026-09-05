import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { baselineErrors, calculateDiscovery, DISCOVERY_BASELINE_KEY, loadDiscoveryBaseline, type DiscoveryArea as Area, type DiscoverySide as Side } from '../domain/discovery'
import { DecisionConditions, DiscoveryBaselineForm, ImprovementSummary, ProspectMeaning } from './DiscoveryDetails'
import './discovery.css'

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

const periods = [['Week', 1 / 52], ['Month', 1 / 12], ['Quarter', 1 / 4], ['Year', 1]] as const
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
      <div><h3 tabIndex={-1}>{area.name}</h3><p>{area.quote}</p></div>
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

export function DiscoveryImpactPage() {
  const [baseline, setBaseline] = useState(loadDiscoveryBaseline)
  const [showBaselineErrors, setShowBaselineErrors] = useState(false)
  const offerValue = Number(baseline.offerValue)
  const closeRate = Number(baseline.closeRate)
  const [sensitivity, setSensitivity] = useState(20)
  const [conservative, setConservative] = useState(100)
  const [areas, setAreas] = useState(initialAreas)
  const [activeStep, setActiveStep] = useState<DiscoveryStep>(0)
  const [selectedQuestions, setSelectedQuestions] = useState<Record<Side, number>>({ rep: 1, prospect: 6 })
  const [customAreaDraft, setCustomAreaDraft] = useState<CustomAreaDraft | null>(null)
  const [customAreaError, setCustomAreaError] = useState('')
  const steps = ['Sales Baseline', 'Rep Improvements', 'Prospect Perspective', 'Review Impact']
  const stepDescriptions = ['Set your starting point', 'Strengthen the conversation', 'Improve decision conditions', 'Present the opportunity']
  const isCustomAreaModalOpen = customAreaDraft !== null
  const projection = useMemo(() => calculateDiscovery(baseline, areas, sensitivity, conservative), [baseline, areas, sensitivity, conservative])
  const repAreas = areas.filter((area) => area.side === 'rep')
  const prospectAreas = areas.filter((area) => area.side === 'prospect')
  const scoringAreas = activeStep === 1 ? repAreas : prospectAreas
  const scoringSide: Side = activeStep === 1 ? 'rep' : 'prospect'
  const questionIndex = Math.max(0, scoringAreas.findIndex((area) => area.id === selectedQuestions[scoringSide]))
  const currentQuestion = scoringAreas[questionIndex]
  const isScoring = activeStep === 1 || activeStep === 2
  const reviewAreas = useMemo(() => [...areas]
    .sort((first, second) => (second.after - second.now) - (first.after - first.now))
    .slice(0, 3), [areas])
  const closeRateScale = Math.max(25, Math.ceil(Math.max(projection.currentRate, projection.afterRate) * 100 / 5) * 5)
  const closeRateLift = (projection.afterRate - projection.currentRate) * 100

  useEffect(() => {
    try { localStorage.setItem(DISCOVERY_BASELINE_KEY, JSON.stringify(baseline)) } catch { /* Assessment remains usable when storage is unavailable. */ }
  }, [baseline])

  const goToStep = (step: DiscoveryStep) => {
    if (step > 0 && Object.keys(baselineErrors(baseline)).length > 0) {
      setShowBaselineErrors(true)
      setActiveStep(0)
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('.discovery-baseline-card [aria-invalid="true"]')?.focus())
      return
    }
    setActiveStep(step)
    requestAnimationFrame(() => document.querySelector('.discovery-steps')?.scrollIntoView({ block: 'start' }))
  }

  const updateArea = (id: number, key: 'now' | 'after', value: number) => setAreas((current) => current.map((area) => {
    if (area.id !== id) return area
    const next = { ...area, [key]: value }
    if (key === 'now' && next.after < value) next.after = value
    if (key === 'after' && next.now > value) next.now = value
    return next
  }))

  const focusQuestion = () => requestAnimationFrame(() => {
    document.querySelector<HTMLHeadingElement>('.discovery-question-stage .discovery-score-head h3')?.focus({ preventScroll: true })
    document.querySelector('.discovery-question-stage')?.scrollIntoView({ block: 'start', behavior: 'instant' })
  })

  const selectQuestion = (id: number) => {
    setSelectedQuestions((current) => ({ ...current, [scoringSide]: id }))
    focusQuestion()
  }

  const removeQuestion = (area: Area) => {
    const neighbor = scoringAreas[questionIndex + 1] ?? scoringAreas[questionIndex - 1]
    setAreas((current) => current.filter((item) => item.id !== area.id))
    if (neighbor) selectQuestion(neighbor.id)
  }

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
    const id = Date.now()
    setAreas((current) => [...current, { id, side: customAreaDraft.side, name, quote: description, now: 5, after: 6, removable: true }])
    setSelectedQuestions((current) => ({ ...current, [customAreaDraft.side]: id }))
    closeCustomAreaModal()
    focusQuestion()
  }

  return <>
    <header className="module-header"><h1>Discovery Framework</h1>{activeStep > 0 ? <div><strong>{money(projection.annualExtra)}</strong></div> : null}</header>
    <section className="dashboard-intro discovery-intro-full" aria-labelledby="discovery-guidance-title"><h3 id="discovery-guidance-title">Discovery Framework Impact Lift</h3><p>Build the estimate in four steps, from your sales baseline to a clearer view of the opportunity.</p></section>
    <div className="discovery-page"><nav className="discovery-steps" aria-label="Discovery Framework steps">{steps.map((step, index) => <button key={step} type="button" className={activeStep === index ? 'active' : index < activeStep ? 'complete' : ''} aria-current={activeStep === index ? 'step' : undefined} onClick={() => goToStep(index as DiscoveryStep)}><span className="discovery-step-number">{index < activeStep ? <CheckIcon /> : index + 1}</span><span className="discovery-step-copy"><strong>{step}</strong><small>{stepDescriptions[index]}</small></span></button>)}</nav>
      <div className={`discovery-grid ${activeStep === 0 ? 'discovery-grid-baseline' : activeStep === 1 || activeStep === 2 ? 'discovery-grid-scoring' : ''}`}><div>
        {activeStep === 0 ? <DiscoveryBaselineForm baseline={baseline} onChange={setBaseline} showErrors={showBaselineErrors} /> : null}
        {isScoring ? <section className="discovery-score-stage discovery-question-stage">
          <div className="discovery-card discovery-score-heading-card"><div className="discovery-section-heading"><div><h2>{activeStep === 1 ? 'Rep Improvements' : 'Prospect Perspective'}</h2><p className="discovery-sub">{activeStep === 1 ? 'Rate how the rep shows up on the call.' : 'Rate how the prospect feels and decides.'}{baseline.mode === 'team' ? ' Use a representative score across your team.' : ''}</p></div></div></div>
          <div className="discovery-question-toolbar">
            <div className="discovery-question-actions">
              <button type="button" className="discovery-secondary" onClick={() => questionIndex > 0 ? selectQuestion(scoringAreas[questionIndex - 1].id) : goToStep((activeStep - 1) as DiscoveryStep)}>{questionIndex > 0 ? 'Previous question' : activeStep === 1 ? 'Sales baseline' : 'Rep improvements'}</button>
              <span role="status">Question <strong>{questionIndex + 1}</strong> of {scoringAreas.length}</span>
              <button type="button" className="discovery-primary" onClick={() => questionIndex < scoringAreas.length - 1 ? selectQuestion(scoringAreas[questionIndex + 1].id) : goToStep((activeStep + 1) as DiscoveryStep)}>{questionIndex < scoringAreas.length - 1 ? 'Next question' : activeStep === 1 ? 'Prospect perspective' : 'Review impact'}</button>
            </div>
            <nav className="discovery-question-numbers" aria-label={`${activeStep === 1 ? 'Rep improvement' : 'Prospect perspective'} questions`}>
              {scoringAreas.map((area, index) => <button key={area.id} type="button" aria-label={`Question ${index + 1}: ${area.name}`} aria-current={area.id === currentQuestion.id ? 'step' : undefined} title={area.name} onClick={() => selectQuestion(area.id)}>{index + 1}</button>)}
            </nav>
          </div>
          <ScoreRow key={currentQuestion.id} area={currentQuestion} onChange={(key, value) => updateArea(currentQuestion.id, key, value)} onRemove={() => removeQuestion(currentQuestion)} />
          <ImprovementSummary key={scoringSide} areas={scoringAreas} side={scoringSide} compact />
        </section> : null}
        {activeStep === 3 ? <section className="discovery-card discovery-review-card">
          <div className="discovery-section-heading"><div><h2>Review Your Impact</h2><p className="discovery-sub">A presentation-ready view of the modeled opportunity, improvement priorities, and assumptions.</p></div></div>
          <div className="discovery-review-columns">
            <section className="discovery-review-section" aria-labelledby="close-rate-comparison-title">
              <header><div><h3 id="close-rate-comparison-title">Close-rate comparison</h3><p>Projected conversion of the same opportunity volume.</p></div><span>Scale 0–{closeRateScale}%</span></header>
              <div className="discovery-rate-comparison" role="img" aria-label={`Current close rate ${closeRate.toFixed(1)} percent. Projected close rate ${(projection.afterRate * 100).toFixed(1)} percent.`}>
                <div><div className="discovery-rate-label"><span>Current</span><strong>{closeRate.toFixed(1)}%</strong></div><div className="discovery-rate-track"><span className="current" style={{ width: `${projection.currentRate * 100 / closeRateScale * 100}%` }} /></div></div>
                <div><div className="discovery-rate-label"><span>With framework</span><strong>{(projection.afterRate * 100).toFixed(1)}%</strong></div><div className="discovery-rate-track"><span className="projected" style={{ width: `${projection.afterRate * 100 / closeRateScale * 100}%` }} /></div></div>
              </div>
              <div className="discovery-review-metrics">
                <div><span>Current wins</span><strong>{projection.currentWins.toFixed(1)}</strong><small>per year</small></div>
                <div><span>Projected wins</span><strong>{projection.projectedWins.toFixed(1)}</strong><small>per year</small></div>
                <div><span>Average score lift</span><strong>+{projection.averageLift.toFixed(1)}</strong><small>points</small></div>
              </div>
            </section>

            <section className="discovery-review-section" aria-labelledby="priority-areas-title">
              <header><div><h3 id="priority-areas-title">Highest-impact areas</h3><p>Lead the discussion with the largest modeled improvements.</p></div></header>
              <ol className="discovery-priority-list">{reviewAreas.map((area, index) => <li key={area.id}><span>{index + 1}</span><div><strong>{area.name}</strong><small>{area.side === 'rep' ? 'Sales rep impact' : 'Prospect impact'}</small></div><b>{area.now} → {area.after}<em>+{area.after - area.now}</em></b></li>)}</ol>
            </section>
          </div>

          <div className="discovery-review-score-summaries"><ImprovementSummary areas={repAreas} side="rep" /><ImprovementSummary areas={prospectAreas} side="prospect" /></div>
          <DecisionConditions areas={prospectAreas} />
          <ProspectMeaning />
          <section className="discovery-decision-context"><h3>Decision Baseline</h3><dl><div><dt>No-Decision / Follow-Up Rate</dt><dd>{baseline.noDecisionRate === '' ? 'Not entered' : `${baseline.noDecisionRate}%`}</dd></div><div><dt>Average Sales Cycle</dt><dd>{baseline.salesCycle === '' ? 'Not entered' : `${baseline.salesCycle} ${baseline.salesCycleUnit}`}</dd></div></dl><p>Use these starting points to discuss follow-up quality and decision speed, then compare them with actual results after implementation.</p></section>

          <section className="discovery-talking-points" aria-labelledby="talking-points-title">
            <div><h3 id="talking-points-title">Presentation talking points</h3><p>Use these statements to explain the business case.</p></div>
            <ul>
              <li><strong>Improve conversion before adding volume.</strong><span>The model creates the upside from the existing {Math.round(projection.annualPresentations).toLocaleString('en-US')} annual presentations.</span></li>
              <li><strong>Translate behavior into a measurable outcome.</strong><span>An average score lift of {projection.averageLift.toFixed(1)} points supports a {closeRateLift.toFixed(1)}-point improvement in projected close rate.</span></li>
              <li><strong>Focus the coaching conversation.</strong><span>{reviewAreas[0]?.name ?? 'The highest-scoring opportunity'} is currently one of the strongest modeled opportunities for improvement.</span></li>
            </ul>
          </section>

          <footer className="discovery-review-assumptions"><strong>Model assumptions</strong><span>{Math.round(projection.annualPresentations).toLocaleString('en-US')} presentations/year</span><span>{money(offerValue)} average value</span><span>{sensitivity}% impact sensitivity</span><span>{conservative}% conservative factor</span><small>Projection only. Actual results depend on execution, market conditions, and sales-cycle quality.</small></footer>
        </section> : null}
        {!isScoring ? <div className="discovery-step-actions"><button type="button" className="discovery-secondary" disabled={activeStep === 0} onClick={() => goToStep((activeStep - 1) as DiscoveryStep)}>Back</button>{activeStep < 3 ? <button type="button" className="discovery-primary" onClick={() => goToStep((activeStep + 1) as DiscoveryStep)}>Continue</button> : null}</div> : null}
      </div>{activeStep > 0 ? <aside className="discovery-results">
        {activeStep === 3 ? <section className="discovery-card"><div className="discovery-section-heading"><div><h2>Live Impact</h2><p className="discovery-sub">Updates as you score each area.</p></div></div><div className="discovery-live-result"><strong>{money(projection.annualExtra)}</strong><span>Additional revenue per year</span></div><div className="discovery-live-metrics"><div><strong>{closeRate}%</strong><span>Current close rate</span></div><div><strong>{(projection.afterRate * 100).toFixed(1)}%</strong><span>After framework</span></div></div></section> : null}
        {activeStep === 2 ? <section className="discovery-card discovery-prospect-results"><DecisionConditions areas={prospectAreas} /><ProspectMeaning /></section> : null}
        <section className="discovery-card discovery-outcomes"><section><h2>Conversion Impact</h2><p>Potential improvement in close rate based on the average score lift.</p><div className="discovery-outcome-pair"><div><strong>{closeRate.toFixed(1)}%</strong><span>Current close rate</span></div><span aria-hidden="true">→</span><div><strong>{(projection.afterRate * 100).toFixed(1)}%</strong><span>Projected close rate</span></div></div><p className="discovery-outcome-lift">+{closeRateLift.toFixed(1)} percentage points</p></section><section><h2>Opportunity Impact</h2><p>More conversations turning into clients{baseline.mode === 'team' ? ` across ${projection.repCount} reps` : ''}.</p><div className="discovery-outcome-pair"><div><strong>{projection.currentWins.toFixed(1)}</strong><span>Clients/year · Current</span></div><span aria-hidden="true">→</span><div><strong>{projection.projectedWins.toFixed(1)}</strong><span>Clients/year · Projected</span></div></div><div className="discovery-additional-clients"><strong>+{projection.additionalWins.toFixed(1)}</strong><span>Additional Clients Per Year</span></div></section></section>
        {activeStep === 3 ? <section className="discovery-card"><div className="discovery-section-heading"><div><h2>Projection Controls</h2><p className="discovery-sub">Adjust the estimate without changing ROI inputs.</p></div></div><label className="discovery-lever">Impact sensitivity <strong>{sensitivity}%</strong><input type="range" min="5" max="40" value={sensitivity} style={rangeStyle(sensitivity, 5, 40)} onChange={(event) => setSensitivity(Number(event.target.value))} /></label><label className="discovery-lever">Conservative factor <strong>{conservative}%</strong><input type="range" min="25" max="100" step="5" value={conservative} style={rangeStyle(conservative, 25, 100)} onChange={(event) => setConservative(Number(event.target.value))} /></label></section> : null}
        <section className="discovery-card discovery-result-card"><h2>Financial Impact Lift</h2><div className="discovery-result-hero"><strong>{money(projection.annualExtra)}</strong><span>Extra revenue per year</span></div><div className="discovery-financial-table"><table><thead><tr><th>Period</th><th>Now</th><th>After</th><th>Extra $</th></tr></thead><tbody>{periods.map(([label, multiplier]) => { const now = projection.annualPresentations * multiplier * projection.currentRate * offerValue; const after = projection.annualPresentations * multiplier * projection.afterRate * offerValue; return <tr key={label} className={label === 'Year' ? 'total' : undefined}><td>{label}</td><td>{money(now)}</td><td>{money(after)}</td><td>{money(after - now)}</td></tr> })}</tbody></table></div><section className="discovery-what-means"><h3>What This Means</h3><p>Based on your existing presentation volume and average offer value, the modeled conversion improvement could represent <strong>{projection.additionalWins.toFixed(1)} additional clients and {money(projection.annualExtra)} in annual revenue</strong>{baseline.mode === 'team' ? ` across your ${projection.repCount}-rep team` : ''}. No additional presentations are assumed.</p></section></section>
      </aside> : null}</div>
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
