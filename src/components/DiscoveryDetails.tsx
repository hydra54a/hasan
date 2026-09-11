import { discoveryRatingLift, baselineErrors, summarizeDiscoveryAreas, type DiscoveryArea, type DiscoveryBaseline } from '../domain/discovery'

export function DiscoveryBaselineForm({ baseline, onChange, showErrors }: { baseline: DiscoveryBaseline; onChange: (value: DiscoveryBaseline) => void; showErrors: boolean }) {
  const errors = baselineErrors(baseline)
  const field = (key: 'weeklyPresentations' | 'reps' | 'offerValue' | 'closeRate' | 'noDecisionRate' | 'salesCycle', label: string, hint: string, max: number, whole = false, optional = false) => <div className="discovery-baseline-field">
    <label htmlFor={`discovery-${key}`}>{label}{optional ? <span>Optional</span> : null}</label>
    <p id={`discovery-${key}-hint`}>{hint}</p>
    <input id={`discovery-${key}`} type="number" min={key === 'reps' ? 1 : 0} max={max} step={whole ? '1' : 'any'} inputMode={whole ? 'numeric' : 'decimal'} value={baseline[key]} placeholder={whole ? 'e.g. 10' : key === 'offerValue' ? 'e.g. 5000' : 'e.g. 20'} aria-invalid={showErrors && Boolean(errors[key])} aria-describedby={`discovery-${key}-hint${showErrors && errors[key] ? ` discovery-${key}-error` : ''}`} onChange={(event) => onChange({ ...baseline, [key]: event.target.value })} />
    {showErrors && errors[key] ? <small className="discovery-input-error" id={`discovery-${key}-error`}>{errors[key]}</small> : null}
  </div>
  return <section className="discovery-card discovery-baseline-card">
    <div className="discovery-section-heading"><div><h2>Sales Baseline</h2><p className="discovery-sub">Enter the numbers for this Discovery Framework assessment.</p></div></div>
    <fieldset className="discovery-audience"><legend>Who are you assessing?</legend><div>{(['individual', 'team'] as const).map((mode) => <label key={mode} className={baseline.mode === mode ? 'selected' : ''}><input type="radio" name="discovery-audience" value={mode} checked={baseline.mode === mode} onChange={() => onChange({ ...baseline, mode })} /><span><strong>{mode === 'individual' ? 'Individual rep' : 'Sales team'}</strong><small>{mode === 'individual' ? 'One rep’s conversations and results' : 'Shared assumptions across multiple reps'}</small></span></label>)}</div></fieldset>
    <div className="discovery-baseline-fields">
      {baseline.mode === 'team' ? field('reps', 'Number of sales reps', 'Reps included in this assessment.', 10000, true) : null}
      {field('weeklyPresentations', baseline.mode === 'team' ? 'Presentations per rep per week' : 'Presentations per week', 'Enter a whole number of sales presentations.', 10000, true)}
      {field('offerValue', 'Average offer value ($)', 'Average revenue from one new client.', 1000000000)}
      {field('closeRate', 'Current close rate (%)', 'Percentage of presentations that become clients.', 100)}
    </div>
    {baseline.weeklyPresentations !== '' && !errors.weeklyPresentations && !errors.reps ? <p className="discovery-volume-note"><strong>{(Number(baseline.weeklyPresentations) * (baseline.mode === 'team' ? Number(baseline.reps) : 1) * 52).toLocaleString('en-US')}</strong> presentations per year{baseline.mode === 'team' ? ` across ${baseline.reps} reps` : ' for one rep'} · Based on 52 weeks.</p> : null}
    <section className="discovery-decision-baseline" aria-labelledby="discovery-decision-title"><h3 id="discovery-decision-title">Decision Baseline</h3><p>Capture how prospects currently make decisions.</p><div className="discovery-baseline-fields">
      {field('noDecisionRate', 'No-Decision / Follow-Up Rate (%)', 'What percentage of presentations end without a clear YES or NO?', 100, false, true)}
      <div>{field('salesCycle', 'Average Sales Cycle', 'How long does it typically take a prospect to make a decision?', 10000, false, true)}<label className="discovery-cycle-unit" htmlFor="discovery-cycle-unit">Time unit<select id="discovery-cycle-unit" value={baseline.salesCycleUnit} onChange={(event) => onChange({ ...baseline, salesCycleUnit: event.target.value as DiscoveryBaseline['salesCycleUnit'] })}><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></label></div>
    </div></section>
  </section>
}

export function DecisionConditions({ areas }: { areas: DiscoveryArea[] }) {
  return <div className="discovery-conditions"><table><caption>Decision Conditions</caption><thead><tr><th scope="col">Area</th><th scope="col">Now</th><th scope="col">After</th><th scope="col">Lift</th></tr></thead><tbody>{areas.map((area) => <tr key={area.id}><th scope="row">{area.name}</th><td>{area.now}</td><td>{area.after}</td><td>+{discoveryRatingLift(area.now, area.after)}</td></tr>)}</tbody></table></div>
}

export function ImprovementSummary({ areas, side, compact = false }: { areas: DiscoveryArea[]; side: 'rep' | 'prospect'; compact?: boolean }) {
  const summary = summarizeDiscoveryAreas(areas)
  return <section className={`discovery-improvement-summary${compact ? ' compact' : ''}`} aria-label={`${side === 'rep' ? 'Sales Rep' : 'Prospect'} Improvement Summary`}>
    <header><span className="discovery-summary-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 19v-5M12 19V9M19 19V4" /></svg></span><div><h3>{side === 'rep' ? 'Sales Rep' : 'Prospect'} Improvement Summary</h3><p>A snapshot of your results across all {summary.count} areas.</p></div></header>
    <div className="discovery-improvement-values">
      <div><span>Current Average Score</span><strong>{summary.current.toFixed(1)}<small>/10</small></strong><div className="discovery-summary-meter" aria-hidden="true"><i style={{ width: `${summary.current * 10}%` }} /></div></div>
      <div><span>With Discovery Framework</span><strong>{summary.after.toFixed(1)}<small>/10</small></strong><div className="discovery-summary-meter" aria-hidden="true"><i style={{ width: `${summary.after * 10}%` }} /></div></div>
      <div><span>{side === 'rep' ? 'Average Lift' : 'Average Prospect Lift'}</span><strong>+{summary.lift.toFixed(1)}</strong><small>{summary.improvement.toFixed(0)}% weighted improvement relative to the current average {side === 'rep' ? 'sales rep' : 'prospect'} score.</small></div>
    </div>
    <details><summary>View details</summary><div className="discovery-summary-detail-list">{areas.map((area) => <div key={area.id}><span>{area.name}</span><strong>{area.now} to {area.after} <small>+{discoveryRatingLift(area.now, area.after)}</small></strong></div>)}</div></details>
    {!compact ? <p className="discovery-summary-takeaway">{side === 'rep' ? 'A more confident, aligned, and in-control conversation creates the conditions for more opportunities and greater results.' : 'More aligned, open, and clear conversations create better conditions for a confident buying decision.'}</p> : null}
  </section>
}

export function ProspectMeaning() {
  return <section className="discovery-prospect-meaning"><h3>What This Means for the Prospect</h3><p>The intended shift in the conversation:</p><div><section><h4>Less</h4><ul><li>Guarded</li><li>Skeptical</li><li>Uncertain</li><li>Defensive</li></ul></section><section><h4>More</h4><ul><li>Understood</li><li>Open</li><li>Aligned</li><li>Clear</li></ul></section><section><h4>Leading to</h4><strong>Greater Decision Confidence</strong></section></div></section>
}
