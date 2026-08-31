import { useState } from 'react'
import type { MarketingStageId, RiskAnswer, RoiInputs, RoiResults } from '../domain/types'
import { REALLOCATION_MONTHS } from '../domain/types'
import { formatCurrency, formatNumber, formatPercent } from '../domain/calculations'
import type { UpdateInput } from './LegacyPages'
import { PageHeader } from './LegacyPages'
import { NumberField, RangeField, RiskControl } from './Controls'
import { Kpi } from './Kpi'
import { AllocationBar, RevenueBridge } from './Visuals'
import { CheckIcon } from './Icons'

const STAGES: { id: MarketingStageId; label: string }[] = [
  { id: 'investment', label: 'Current Investment' },
  { id: 'reallocation', label: 'Reallocation Opportunity' },
  { id: 'impact', label: 'Business Impact' },
  { id: 'economics', label: 'Acquisition Economics' },
  { id: 'analysis', label: 'Conversion Analysis' },
  { id: 'outcome', label: 'Executive Outcome' },
]

export function MarketingPage({ inputs, results, updateInput }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput }) {
  const [activeStage, setActiveStage] = useState<MarketingStageId>('investment')
  const updateRisk = (key: keyof RoiInputs['risks'], value: Exclude<RiskAnswer, null>) => {
    updateInput('risks', { ...inputs.risks, [key]: value })
  }
  const goToStage = (stage: MarketingStageId) => {
    setActiveStage(stage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <>
      <PageHeader title="MARKETING INVESTMENT OPTIMIZATION" value={formatCurrency(results.marketingProjection.total)} />
      <div className="marketing-page">
        <div className="marketing-intro"><div><h2>Marketing Investment Optimization &amp; Reallocation</h2><p>Make the investment you already make work harder.</p></div><div><strong>{formatCurrency(results.reallocationValue)}</strong><span>identified reallocation opportunity</span></div></div>
        <nav className="marketing-steps" aria-label="Marketing optimization stages">
          {STAGES.map((stage, index) => <button key={stage.id} type="button" className={activeStage === stage.id ? 'active' : ''} onClick={() => goToStage(stage.id)}><span>{index + 1}</span>{stage.label}</button>)}
        </nav>
        <div className="marketing-layout"><div className="marketing-stage">
          {activeStage === 'investment' ? <section><StageHeader number="01" title="Current marketing investment" description="Connect the investment already creating demand to the lead and conversion performance captured elsewhere in this calculator." /><div className="input-grid four">
            <NumberField id="annual-spend" label="Annual advertising investment" prefix="$" value={inputs.annualAdvertisingSpend} step={1000} onChange={(value) => updateInput('annualAdvertisingSpend', value)} />
            <div className="field calculated-field"><span className="field-label">Annual leads generated</span><span className="field-hint">Synchronized with Lead Generation</span><output className="calculated-value">{formatNumber(results.annualLeads)}</output></div>
            <div className="field calculated-field"><span className="field-label">Current close rate</span><span className="field-hint">Synchronized with Lead Generation</span><output className="calculated-value">{formatPercent(inputs.currentCloseRate, 1)}</output></div>
            <div className="field calculated-field"><span className="field-label">Average deal value</span><span className="field-hint">Synchronized with Lead Generation</span><output className="calculated-value">{formatCurrency(inputs.averageDealValue)}</output></div>
          </div><div className="calculated-strip"><Kpi label="Average monthly investment" value={formatCurrency(results.averageMonthlySpend)} /><Kpi label="Current wins" value={formatNumber(results.currentLeadWins)} /><Kpi label="Revenue generated" value={formatCurrency(results.currentLeadRevenue)} tone="positive" /></div><StageFooter next="Explore reallocation opportunity" onNext={() => goToStage('reallocation')} /></section> : null}

          {activeStage === 'reallocation' ? <section><StageHeader number="02" title="Reallocation opportunity" description="How much could reasonably be redirected before leadership notices a meaningful business impact?" /><div className="month-control" role="group" aria-label="Reallocation time horizon"><span className="month-line" aria-hidden="true" />{REALLOCATION_MONTHS.map((month) => <button key={month} type="button" className={inputs.selectedMonths === month ? 'month-option selected' : 'month-option'} aria-pressed={inputs.selectedMonths === month} onClick={() => updateInput('selectedMonths', month)}><strong>{month}</strong><span>{month === 1 ? 'month' : 'months'}</span></button>)}</div><AllocationBar reallocated={results.reallocationPercentage} reallocationValue={results.reallocationValue} remainingValue={results.remainingAdvertisingInvestment} /><div className="calculated-strip"><Kpi label="Average monthly investment" value={formatCurrency(results.averageMonthlySpend)} /><Kpi label="Annual advertising investment" value={formatCurrency(inputs.annualAdvertisingSpend)} /><Kpi label="Remaining investment" value={formatCurrency(results.remainingAdvertisingInvestment)} tone="positive" /></div><StageFooter next="Confirm business impact" onNext={() => goToStage('impact')} /></section> : null}

          {activeStage === 'impact' ? <section><StageHeader number="03" title="Confirm the business impact" description="Validate the opportunity against the three safeguards that matter to leadership." /><div className="impact-layout"><div className="risk-list"><RiskControl id="operations" label="Create a material threat to the company’s ability to operate?" value={inputs.risks.operations} onChange={(value) => updateRisk('operations', value)} /><RiskControl id="profitability" label="Create an unacceptable impact on annual profitability?" value={inputs.risks.profitability} onChange={(value) => updateRisk('profitability', value)} /><RiskControl id="employment" label="Create a material risk to current employment levels?" value={inputs.risks.employment} onChange={(value) => updateRisk('employment', value)} /></div><ImpactStatus status={results.riskStatus} /></div><StageFooter next="Review acquisition economics" onNext={() => goToStage('economics')} /></section> : null}

          {activeStage === 'economics' ? <section><StageHeader number="04" title="Current acquisition economics" description="See how efficiently today’s marketing investment converts opportunities into revenue." /><div className="economics-grid"><Kpi label="Annual advertising investment" value={formatCurrency(inputs.annualAdvertisingSpend)} /><Kpi label="Current leads generated" value={formatNumber(results.annualLeads)} /><Kpi label="Current close rate" value={formatPercent(inputs.currentCloseRate)} /><Kpi label="Current wins" value={formatNumber(results.currentLeadWins)} /><Kpi label="Average deal value" value={formatCurrency(inputs.averageDealValue)} /><Kpi label="Revenue generated" value={formatCurrency(results.currentLeadRevenue)} tone="positive" /><Kpi label="Cost per lead" value={formatCurrency(results.costPerLead)} /><Kpi label="Advertising cost per won customer" value={formatCurrency(results.currentAdvertisingCostPerWin)} /></div><div className="insight-callout"><span>Executive insight</span><p>You are already investing to create opportunities. The question is whether part of that investment could generate a better return by converting more of the opportunities you are already paying to create.</p></div><StageFooter next="Model conversion improvement" onNext={() => goToStage('analysis')} /></section> : null}

          {activeStage === 'analysis' ? <section><StageHeader number="05" title="Conversion investment analysis" description="Define the smallest conversion lift needed to cover the investment, then compare it with the modeled upside." /><div className="conversion-inputs"><NumberField id="system-cost" label="Pipeline Conversion System investment" prefix="$" value={inputs.systemInvestmentCost} step={1000} onChange={(value) => updateInput('systemInvestmentCost', value)} /><NumberField id="presentation-volume" label="Annual presentation volume" hint="Kept distinct from leads" value={inputs.presentationVolume} onChange={(value) => updateInput('presentationVolume', value)} /><NumberField id="future-rate" label="Modeled future close rate" suffix="%" value={inputs.modeledFutureCloseRate} max={100} step={0.1} onChange={(value) => updateInput('modeledFutureCloseRate', value)} /></div><div className="analysis-grid"><div className="breakeven-panel"><span className="panel-label">Break-even requirement</span><strong>{formatNumber(results.breakEvenAdditionalDeals)}</strong><p>additional deals</p><div className="breakeven-meter"><span style={{ width: `${Math.min(100, results.breakEvenCloseRateLift ?? 0)}%` }} /></div><small>{formatPercent(results.breakEvenCloseRateLift)} close-rate lift across {formatNumber(inputs.presentationVolume)} presentations</small></div><div className="future-panel"><Kpi label="Modeled future wins" value={formatNumber(results.futureWins)} tone="positive" /><Kpi label="Incremental wins" value={`+${formatNumber(results.incrementalWins)}`} tone="positive" /><Kpi label="Incremental revenue" value={`+${formatCurrency(results.incrementalRevenue)}`} tone="positive" /><Kpi label="Future cost per won customer" value={formatCurrency(results.futureAdvertisingCostPerWin)} /></div></div><RevenueBridge currentRevenue={results.currentLeadRevenue} incrementalRevenue={results.incrementalRevenue} /><StageFooter next="Present executive outcome" onNext={() => goToStage('outcome')} /></section> : null}

          {activeStage === 'outcome' ? <section className="executive-section"><StageHeader number="06" title="Executive outcome" description="A board-ready statement generated from the live calculator." /><div className="outcome-hero"><div><span>Modeled incremental annual revenue</span><strong>{formatCurrency(results.incrementalRevenue)}</strong><small>without requiring additional lead volume</small></div><div className="outcome-stats"><Kpi label="Reallocated" value={formatPercent(results.reallocationPercentage)} detail={formatCurrency(results.reallocationValue)} /><Kpi label="Additional wins" value={formatNumber(results.incrementalWins)} /><Kpi label="Return multiple" value={results.returnMultiple === null ? 'Not available' : `${formatNumber(results.returnMultiple, 1)}×`} /></div></div><blockquote className="executive-narrative">{buildNarrative(inputs, results)}</blockquote><p className="central-message">The opportunity is not to advertise less. It is to make the investment you are already making work harder.</p></section> : null}
        </div><aside className="marketing-rail"><h2>Your reallocation opportunity</h2><dl><div><dt>Reallocation opportunity</dt><dd>{formatCurrency(results.reallocationValue)}</dd></div><div><dt>Average monthly investment</dt><dd>{formatCurrency(results.averageMonthlySpend)}</dd></div><div><dt>Remaining investment</dt><dd>{formatCurrency(results.remainingAdvertisingInvestment)}</dd></div><div><dt>Modeled upside</dt><dd>{formatCurrency(results.incrementalRevenue)}</dd></div></dl><ImpactStatus compact status={results.riskStatus} /><RangeField id="marketing-factor" label="Conservative Factor" value={inputs.marketingConservativeFactor} suffix="%" onChange={(value) => updateInput('marketingConservativeFactor', value)} /><RangeField id="marketing-period" label="Implementation Period" value={inputs.marketingImplementationMonths} suffix={inputs.marketingImplementationMonths === 1 ? ' month' : ' months'} max={12} onChange={(value) => updateInput('marketingImplementationMonths', value)} /></aside></div>
      </div>
    </>
  )
}

function StageHeader({ number, title, description }: { number: string; title: string; description: string }) {
  return <header className="section-header"><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></header>
}

function StageFooter({ next, onNext }: { next: string; onNext: () => void }) {
  return <footer className="stage-footer"><button className="primary-button" type="button" onClick={onNext}>{next}<span aria-hidden="true">→</span></button></footer>
}

function ImpactStatus({ status, compact = false }: { status: RoiResults['riskStatus']; compact?: boolean }) {
  const content = status === 'confirmed'
    ? { title: 'No material business impact identified', body: 'This amount could potentially be redirected without threatening operations, profitability, or employment stability.' }
    : status === 'review'
      ? { title: 'Leadership review required', body: 'At least one safeguard is at risk. Revise the reallocation period before presenting this as an opportunity.' }
      : { title: 'Complete the impact review', body: 'Answer all three safeguards to assess the selected amount.' }
  return <div className={`impact-status ${status} ${compact ? 'compact' : ''}`} role="status"><span className="status-icon">{status === 'confirmed' ? <CheckIcon /> : '!'}</span><div><strong>{content.title}</strong>{compact ? null : <p>{content.body}</p>}</div></div>
}

function buildNarrative(inputs: RoiInputs, results: RoiResults): string {
  const safety = results.riskStatus === 'confirmed'
    ? 'would not create a material threat to operations, profitability, or employment stability'
    : results.riskStatus === 'review'
      ? 'requires further leadership review before it can be treated as a responsible reallocation'
      : 'still requires completion of the business-impact review'
  return `You identified that reallocating the equivalent of ${inputs.selectedMonths} ${inputs.selectedMonths === 1 ? 'month' : 'months'} of advertising ${safety}. That represents ${formatPercent(results.reallocationPercentage)} of the annual advertising investment, or approximately ${formatCurrency(results.reallocationValue)}. Improving conversion from ${formatPercent(inputs.currentCloseRate, 1)} to ${formatPercent(inputs.modeledFutureCloseRate, 1)} would produce approximately ${formatNumber(results.incrementalWins)} additional wins and ${formatCurrency(results.incrementalRevenue)} in additional annual revenue, without requiring additional lead volume.`
}
