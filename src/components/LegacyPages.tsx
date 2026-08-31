import type { ModuleId, ProjectionResult, RoiInputs, RoiResults } from '../domain/types'
import { formatCurrency, formatNumber, formatPercent } from '../domain/calculations'
import { CalculatedField, NotesField, NumberField, RangeField } from './Controls'

export type UpdateInput = <K extends keyof RoiInputs>(key: K, value: RoiInputs[K]) => void

export function PageHeader({ title, value, subtitle = 'Total 2 Year Opportunity' }: { title: string; value: string; subtitle?: string }) {
  return (
    <header className="module-header">
      <h1>{title}</h1>
      <div><strong>{value}</strong><span>{subtitle}</span></div>
    </header>
  )
}

function ResultRail({ title, projection, conservativeFactor, implementationMonths, onConservativeFactor, onImplementationMonths }: {
  title: string
  projection: ProjectionResult
  conservativeFactor: number
  implementationMonths: number
  onConservativeFactor: (value: number) => void
  onImplementationMonths: (value: number) => void
}) {
  return (
    <aside className="result-rail" aria-label={`${title} results`}>
      <section className="rail-card">
        <h2>{title}</h2>
        <dl className="projection-list">
          <div><dt>Year 1</dt><dd>{formatCurrency(projection.year1)}</dd></div>
          <div><dt>Year 2</dt><dd>{formatCurrency(projection.year2)}</dd></div>
          <div className="projection-total"><dt>{title} Total</dt><dd>{formatCurrency(projection.total)}</dd></div>
        </dl>
      </section>
      <section className="rail-card rail-controls">
        <RangeField id={`${title}-factor`} label="Conservative Factor" value={conservativeFactor} suffix="%" onChange={onConservativeFactor} />
        <RangeField id={`${title}-period`} label="Implementation Period" value={implementationMonths} suffix={implementationMonths === 1 ? ' month' : ' months'} max={12} onChange={onImplementationMonths} />
      </section>
    </aside>
  )
}

function FormGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="form-group"><h2>{title}</h2><div className="legacy-field-grid">{children}</div></section>
}

function DashboardModuleIcon({ module }: { module: Exclude<ModuleId, 'dashboard' | 'summary'> }) {
  if (module === 'lead') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17V9m6 8V5m6 12v-7m4 7H2"/><path d="m5 6 5-3 5 4 5-4"/></svg>
  }
  if (module === 'conversion') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M7 16l3-4 3 2 4-6"/><path d="M15 8h2v2"/></svg>
  }
  if (module === 'discount') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 8-8h6l2 2v6l-8 8z"/><path d="M15.5 8.5h.01M9 15l6-6m-5 1h.01m4 4h.01"/></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9m5 10V5m5 14v-7m4 7V8"/><path d="m4 6 5-3 5 4 6-4"/></svg>
}

function OpportunityCard({ number, module, title, projection, conservativeFactor, implementationMonths, onConservativeFactor, onImplementationMonths, onOpen }: {
  number: number
  module: Exclude<ModuleId, 'dashboard' | 'summary'>
  title: string
  projection: ProjectionResult
  conservativeFactor: number
  implementationMonths: number
  onConservativeFactor: (value: number) => void
  onImplementationMonths: (value: number) => void
  onOpen: () => void
}) {
  return (
    <article className="opportunity-card">
      <header className="opportunity-card-header">
        <span className="dashboard-module-icon"><DashboardModuleIcon module={module} /></span>
        <button type="button" className="opportunity-title-button" onClick={onOpen} aria-label={`Open ${title}`}>
          <small>{number}</small><strong>{title}</strong>
        </button>
        <div className="opportunity-total"><strong>{formatCurrency(projection.total)}</strong><small>Total 2 Year Opportunity</small></div>
      </header>
      <dl className="opportunity-financials">
        <div><dt>Year 1</dt><dd>{formatCurrency(projection.year1)}</dd></div>
        <div><dt>Year 2</dt><dd>{formatCurrency(projection.year2)}</dd></div>
        <div className="opportunity-total-row"><dt>Total Opportunity</dt><dd>{formatCurrency(projection.total)}</dd></div>
      </dl>
      <div className="opportunity-controls">
        <RangeField id={`dashboard-${module}-factor`} label="Conservative Factor" value={conservativeFactor} suffix="%" onChange={onConservativeFactor} />
        <RangeField id={`dashboard-${module}-period`} label="Implementation Period" value={implementationMonths} suffix={implementationMonths === 1 ? ' month' : ' months'} max={12} onChange={onImplementationMonths} />
      </div>
      <button type="button" className="opportunity-status" onClick={onOpen}><span aria-hidden="true">✓</span> Status: On Track <b aria-hidden="true">→</b></button>
    </article>
  )
}

function DashboardSummary({ inputs, results, updateInput, onOpen }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput; onOpen: () => void }) {
  return (
    <section className="dashboard-summary-panel">
      <header className="dashboard-summary-header">
        <button type="button" onClick={onOpen}><small>EXECUTIVE</small><strong>Summary</strong></button>
        <div><strong>{formatCurrency(results.netTotal)}</strong><span>Net 2 Year Opportunity</span></div>
      </header>
      <div className="dashboard-summary-content">
        <div className="dashboard-summary-table-wrap"><table className="dashboard-summary-table">
          <thead><tr><th scope="col">Opportunity</th><th scope="col">Year 1</th><th scope="col">Year 2</th><th scope="col">Total</th></tr></thead>
          <tbody>
            {summaryRows(results).map(([label, projection]) => <tr key={label}><th scope="row">{label}</th><td>{formatCurrency(projection.year1)}</td><td>{formatCurrency(projection.year2)}</td><td>{formatCurrency(projection.total)}</td></tr>)}
            <tr className="gross-row"><th scope="row">Gross Opportunity</th><td>{formatCurrency(results.grossYear1)}</td><td>{formatCurrency(results.grossYear2)}</td><td>{formatCurrency(results.grossTotal)}</td></tr>
            <tr className="cost-row"><th scope="row">Costs</th><td>({formatCurrency(results.costYear1)})</td><td>({formatCurrency(results.costYear2)})</td><td>({formatCurrency(results.totalCost)})</td></tr>
            <tr className="net-row"><th scope="row">Net Opportunity</th><td>{formatCurrency(results.netYear1)}</td><td>{formatCurrency(results.netYear2)}</td><td>{formatCurrency(results.netTotal)}</td></tr>
          </tbody>
        </table></div>
        <aside className="dashboard-roi-statistics">
          <h2>ROI Statistics</h2>
          <dl>
            <div><dt>Return on Investment</dt><dd>{formatPercent(results.roiPercentage, 0)}</dd></div>
            <div><dt>Net Present Value</dt><dd>{formatCurrency(results.netPresentValue)}</dd></div>
            <div><dt>Payback Period</dt><dd>{formatNumber(results.paybackMonths, 1)} months</dd></div>
          </dl>
          <RangeField id="dashboard-summary-period" label="Implementation Period" value={inputs.summaryImplementationMonths} suffix={inputs.summaryImplementationMonths === 1 ? ' month' : ' months'} max={12} onChange={(value) => updateInput('summaryImplementationMonths', value)} />
          <button type="button" className="summary-review-button" onClick={onOpen}>Review full summary <span aria-hidden="true">→</span></button>
        </aside>
      </div>
    </section>
  )
}

export function DashboardPage({ inputs, results, updateInput, onOpen }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput; onOpen: (module: ModuleId) => void }) {
  return (
    <>
      <PageHeader title="ROI Dashboard | 2 Year Projection" value={formatCurrency(results.netTotal)} subtitle="Net 2 Year Opportunity" />
      <div className="dashboard-page">
        <div className="executive-dashboard-grid">
          <OpportunityCard number={1} module="lead" title="Lead Generation" projection={results.leadProjection} conservativeFactor={inputs.leadConservativeFactor} implementationMonths={inputs.leadImplementationMonths} onConservativeFactor={(value) => updateInput('leadConservativeFactor', value)} onImplementationMonths={(value) => updateInput('leadImplementationMonths', value)} onOpen={() => onOpen('lead')} />
          <OpportunityCard number={2} module="conversion" title="Conversion" projection={results.conversionProjection} conservativeFactor={inputs.conversionConservativeFactor} implementationMonths={inputs.conversionImplementationMonths} onConservativeFactor={(value) => updateInput('conversionConservativeFactor', value)} onImplementationMonths={(value) => updateInput('conversionImplementationMonths', value)} onOpen={() => onOpen('conversion')} />
          <OpportunityCard number={3} module="discount" title="Discount Reduction" projection={results.discountProjection} conservativeFactor={inputs.discountConservativeFactor} implementationMonths={inputs.discountImplementationMonths} onConservativeFactor={(value) => updateInput('discountConservativeFactor', value)} onImplementationMonths={(value) => updateInput('discountImplementationMonths', value)} onOpen={() => onOpen('discount')} />
          <OpportunityCard number={4} module="marketing" title="Marketing Investment Optimization" projection={results.marketingProjection} conservativeFactor={inputs.marketingConservativeFactor} implementationMonths={inputs.marketingImplementationMonths} onConservativeFactor={(value) => updateInput('marketingConservativeFactor', value)} onImplementationMonths={(value) => updateInput('marketingImplementationMonths', value)} onOpen={() => onOpen('marketing')} />
          <DashboardSummary inputs={inputs} results={results} updateInput={updateInput} onOpen={() => onOpen('summary')} />
        </div>
      </div>
    </>
  )
}

export function LeadGenerationPage({ inputs, results, updateInput }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput }) {
  return (
    <>
      <PageHeader title="LEAD GENERATION" value={formatCurrency(results.leadProjection.total)} />
      <div className="legacy-layout"><div className="legacy-form">
        <FormGroup title="CURRENT STATE">
          <NumberField id="monthly-leads" label="Estimated number of monthly inbound leads" value={inputs.monthlyInboundLeads} onChange={(value) => updateInput('monthlyInboundLeads', value)} />
          <CalculatedField label="Annual leads" value={formatNumber(results.annualLeads)} />
          <NumberField id="lead-win-rate" label={`What % of the ${formatNumber(results.annualLeads)} annual leads will you win (win rate % - typically 10 - 25%)`} suffix="%" max={100} step={0.1} value={inputs.currentCloseRate} onChange={(value) => updateInput('currentCloseRate', value)} />
          <CalculatedField label="Estimated deals won from leads" value={formatNumber(results.currentLeadWins)} />
          <NumberField id="lead-deal-value" label="Average deal value (annually)" prefix="$" step={100} value={inputs.averageDealValue} onChange={(value) => updateInput('averageDealValue', value)} />
          <CalculatedField label="Estimated Annual Sales From Generated Leads - Current State" value={formatCurrency(results.currentLeadRevenue)} />
        </FormGroup>
        <FormGroup title="FUTURE STATE WITH HASAN CONSULTING">
          <NumberField id="lead-increase" label="% Increase in LEADS with lead magnet / other materials (typically between 10 - 30%)" suffix="%" max={100} step={0.1} value={inputs.leadIncreaseRate} onChange={(value) => updateInput('leadIncreaseRate', value)} />
          <CalculatedField label="Increase in annual leads" value={formatNumber(results.increasedAnnualLeads, 1)} />
          <CalculatedField label={`Additional deals won based on your ${formatPercent(inputs.currentCloseRate, 1)} win rate`} value={formatNumber(results.additionalLeadWins)} />
          <CalculatedField label="Average deal value" value={formatCurrency(inputs.averageDealValue)} />
          <CalculatedField label="Projected Increase In Sales Revenue" value={formatCurrency(results.leadGenerationRevenue)} />
          <NotesField id="lead-notes" value={inputs.leadNotes} onChange={(value) => updateInput('leadNotes', value)} />
        </FormGroup>
      </div><ResultRail title="Lead Generation" projection={results.leadProjection} conservativeFactor={inputs.leadConservativeFactor} implementationMonths={inputs.leadImplementationMonths} onConservativeFactor={(value) => updateInput('leadConservativeFactor', value)} onImplementationMonths={(value) => updateInput('leadImplementationMonths', value)} /></div>
    </>
  )
}

export function ConversionPage({ inputs, results, updateInput }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput }) {
  return (
    <>
      <PageHeader title="CONVERSION - CLOSE RATE IMPROVEMENT" value={formatCurrency(results.conversionProjection.total)} />
      <div className="legacy-layout"><div className="legacy-form">
        <FormGroup title="CURRENT SALES ENVIRONMENT">
          <NumberField id="salespeople" label="Number of salespeople" value={inputs.numberSalespeople} onChange={(value) => updateInput('numberSalespeople', value)} />
          <CalculatedField label="Average deal value (annually)" value={formatCurrency(inputs.averageDealValue)} detail="Synchronized with Lead Generation" />
          <NumberField id="sales-per-rep" label="What is the expected annual sales for 1 salesperson" prefix="$" step={1000} value={inputs.annualSalesPerRep} onChange={(value) => updateInput('annualSalesPerRep', value)} />
          <CalculatedField label={`Expected annual sales for all ${formatNumber(inputs.numberSalespeople)} salespeople`} value={formatCurrency(results.expectedAnnualSales)} />
          <CalculatedField label={`Deals needed to hit your sales goal of ${formatCurrency(results.expectedAnnualSales)}`} value={formatNumber(results.dealsNeeded)} />
          <CalculatedField label="Average number of deals each rep needs to win to hit the sales goal" value={formatNumber(results.dealsPerRep, 2)} />
          <CalculatedField label="Win rate (typically 10 - 20%)" value={formatPercent(inputs.currentCloseRate, 1)} detail="Synchronized with Lead Generation" />
          <CalculatedField label="Loss rate" value={formatPercent(results.lossRate, 1)} />
          <CalculatedField label="Opportunities lost throughout the year based on win rate" value={formatNumber(results.opportunitiesLost)} detail={`Opportunities worked = ${formatNumber(results.opportunitiesWorked)} · Money left on the table = ${formatCurrency(results.moneyLeftOnTable)}`} />
          <NotesField id="loss-reasons" label="What are the main reasons why your salespeople are losing deals?" value={inputs.lossReasons} onChange={(value) => updateInput('lossReasons', value)} />
        </FormGroup>
        <FormGroup title="INCREASE SALES WITH THE PIPELINE CONVERSION KIT PROCESS">
          <NumberField id="additional-wins" label={`Out of the ${formatNumber(results.opportunitiesLost)} deals lost, how many could you have won by implementing the All-Inclusive Sales Kit best practices?`} hint="Additional Wins" value={inputs.additionalConversionWins} onChange={(value) => updateInput('additionalConversionWins', value)} />
          <CalculatedField label="Projected increase in sales" value={formatCurrency(results.conversionRevenue)} />
          <CalculatedField label="Required reduction in loss rate" value={formatPercent(results.lossRateReductionNeeded)} />
          <NotesField id="conversion-notes" value={inputs.conversionNotes} onChange={(value) => updateInput('conversionNotes', value)} />
        </FormGroup>
        <p className="executive-equivalence">Winning an additional <strong>{formatNumber(inputs.additionalConversionWins)}</strong> deals would represent an increase in sales of <strong>{formatCurrency(results.conversionRevenue)}</strong>. This requires reducing the loss rate by only <strong>{formatPercent(results.lossRateReductionNeeded)}</strong>.</p>
      </div><ResultRail title="Conversion" projection={results.conversionProjection} conservativeFactor={inputs.conversionConservativeFactor} implementationMonths={inputs.conversionImplementationMonths} onConservativeFactor={(value) => updateInput('conversionConservativeFactor', value)} onImplementationMonths={(value) => updateInput('conversionImplementationMonths', value)} /></div>
    </>
  )
}

export function DiscountPage({ inputs, results, updateInput }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput }) {
  return (
    <>
      <PageHeader title="DISCOUNT REDUCTION" value={formatCurrency(results.discountProjection.total)} />
      <div className="legacy-layout"><div className="legacy-form">
        <FormGroup title="REDUCE DISCOUNTING WITH BETTER MESSAGING">
          <CalculatedField label={'Number of "deals" needed to hit your sales goal'} value={formatNumber(results.dealsNeeded)} />
          <CalculatedField label="Average deal value" value={formatCurrency(inputs.averageDealValue)} detail="Synchronized with Lead Generation" />
          <CalculatedField label="Projected annual sales revenue" value={formatCurrency(results.projectedAnnualSales)} />
          <NumberField id="current-discount" label="Average discount applied per deal (%)" suffix="%" max={100} step={0.1} value={inputs.currentDiscountRate} onChange={(value) => updateInput('currentDiscountRate', value)} />
          <NumberField id="future-discount" label="Expected discount rate applied with a better value proposition and messaging (%)" suffix="%" max={100} step={0.1} value={inputs.improvedDiscountRate} onChange={(value) => updateInput('improvedDiscountRate', value)} />
          <CalculatedField label="Additional Revenue Generated by Reducing Discounting" value={formatCurrency(results.discountRevenue)} />
          <NotesField id="discount-notes" value={inputs.discountNotes} onChange={(value) => updateInput('discountNotes', value)} />
        </FormGroup>
        <p className="executive-equivalence">A <strong>{formatPercent(results.discountReduction, 1)}</strong> reduction in discounting would have the same impact as winning an additional <strong>{formatNumber(results.equivalentDeals, 1)}</strong> deals.</p>
      </div><ResultRail title="Discount Reduction" projection={results.discountProjection} conservativeFactor={inputs.discountConservativeFactor} implementationMonths={inputs.discountImplementationMonths} onConservativeFactor={(value) => updateInput('discountConservativeFactor', value)} onImplementationMonths={(value) => updateInput('discountImplementationMonths', value)} /></div>
    </>
  )
}

const summaryRows = (results: RoiResults) => [
  ['LEAD GENERATION', results.leadProjection],
  ['CONVERSION - CLOSE RATE IMPROVEMENT', results.conversionProjection],
  ['DISCOUNT REDUCTION', results.discountProjection],
  ['MARKETING INVESTMENT OPTIMIZATION', results.marketingProjection],
] as const

export function SummaryPage({ inputs, results, updateInput }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput }) {
  return (
    <>
      <PageHeader title="SUMMARY" value={formatCurrency(results.netTotal)} subtitle="Net 2 Year Opportunity" />
      <div className="summary-layout"><section className="summary-main">
        <h2>Costs</h2>
        <div className="cost-grid">
          <NumberField id="deposit" label="Deposit" prefix="$" step={100} value={inputs.deposit} onChange={(value) => updateInput('deposit', value)} />
          <NumberField id="subscription-one" label="Subscription - Year 1" prefix="$" step={100} value={inputs.subscriptionYear1} onChange={(value) => updateInput('subscriptionYear1', value)} />
          <NumberField id="subscription-two" label="Subscription - Year 2" prefix="$" step={100} value={inputs.subscriptionYear2} onChange={(value) => updateInput('subscriptionYear2', value)} />
        </div>
        <div className="table-scroll"><table className="summary-table"><thead><tr><th scope="col">Opportunity</th><th scope="col">Year 1</th><th scope="col">Year 2</th><th scope="col">Total</th></tr></thead><tbody>
          {summaryRows(results).map(([label, projection]) => <tr key={label}><th scope="row">{label}</th><td>{formatCurrency(projection.year1)}</td><td>{formatCurrency(projection.year2)}</td><td>{formatCurrency(projection.total)}</td></tr>)}
          <tr className="gross-row"><th scope="row">Gross opportunity</th><td>{formatCurrency(results.grossYear1)}</td><td>{formatCurrency(results.grossYear2)}</td><td>{formatCurrency(results.grossTotal)}</td></tr>
          <tr className="cost-row"><th scope="row">Cost</th><td>({formatCurrency(results.costYear1)})</td><td>({formatCurrency(results.costYear2)})</td><td>({formatCurrency(results.totalCost)})</td></tr>
          <tr className="net-row"><th scope="row">Net opportunity</th><td>{formatCurrency(results.netYear1)}</td><td>{formatCurrency(results.netYear2)}</td><td>{formatCurrency(results.netTotal)}</td></tr>
        </tbody></table></div>
      </section><aside className="summary-rail">
        <section><h2>ROI Statistics</h2><dl><div><dt>Return on Investment</dt><dd>{formatPercent(results.roiPercentage, 0)}</dd></div><div><dt>Net Present Value</dt><dd>{formatCurrency(results.netPresentValue)}</dd></div><div><dt>Payback Period</dt><dd>{formatNumber(results.paybackMonths, 1)} months</dd></div></dl></section>
        <section><RangeField id="summary-period" label="Implementation Period" value={inputs.summaryImplementationMonths} suffix={inputs.summaryImplementationMonths === 1 ? ' month' : ' months'} max={12} onChange={(value) => updateInput('summaryImplementationMonths', value)} /></section>
      </aside></div>
    </>
  )
}
