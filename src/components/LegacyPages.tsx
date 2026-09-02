import type { ModuleId, ProjectionResult, RoiInputs, RoiResults } from '../domain/types'
import { formatCurrency, formatNumber, formatPercent } from '../domain/calculations'
import { CalculatedField, NotesField, NumberField, RangeField } from './Controls'

export type UpdateInput = <K extends keyof RoiInputs>(key: K, value: RoiInputs[K]) => void

export function PageHeader({ title, value, subtitle = 'Total 2 Year Opportunity' }: { title: string; value: string; subtitle?: string }) {
  return (
    <header className="module-header">
      <h1>{title}</h1>
      <div><strong>{value}</strong>{subtitle ? <span>{subtitle}</span> : null}</div>
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

function OpportunityCard({ module, title, projection, conservativeFactor, onConservativeFactor, onOpen }: {
  module: Exclude<ModuleId, 'dashboard' | 'summary'>
  title: string
  projection: ProjectionResult
  conservativeFactor: number
  onConservativeFactor: (value: number) => void
  onOpen: () => void
}) {
  return (
    <article className="opportunity-card">
      <header><button type="button" onClick={onOpen}>{title}</button></header>
      <div className="opportunity-card-body">
        <strong>{formatCurrency(projection.total)}</strong>
        <div className="opportunity-divider" />
        <RangeField id={`dashboard-${module}-factor`} label="Conservative Factor" value={conservativeFactor} suffix="%" onChange={onConservativeFactor} />
      </div>
    </article>
  )
}

function DashboardSummary({ results, onOpen }: { results: RoiResults; onOpen: () => void }) {
  return (
    <article className="dashboard-summary-card">
      <header><button type="button" onClick={onOpen}>Summary</button></header>
      <div className="dashboard-summary-card-body">
        <strong>{formatCurrency(results.netTotal)}</strong>
        <div className="opportunity-divider" />
      </div>
    </article>
  )
}

export function DashboardPage({ inputs, results, updateInput, onOpen }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput; onOpen: (module: ModuleId) => void }) {
  return (
    <>
      <PageHeader title="ROI Dashboard" value={formatCurrency(results.netTotal)} subtitle="" />
      <div className="dashboard-page">
        <section className="dashboard-intro" aria-labelledby="dashboard-guidance-title">
          <h3 id="dashboard-guidance-title">Select a section below to review your ROI</h3>
          <p>To calculate your return on investment, begin with the first section below. The information entered therein will automatically populate corresponding fields in the other sections. You will be able to move from section to section to add and/or adjust values to best reflect your organization and process. To return to this screen, click the ROI Dashboard button to the left.</p>
        </section>
        <div className="executive-dashboard-grid">
          <OpportunityCard module="lead" title="Lead Generation Impact" projection={results.leadProjection} conservativeFactor={inputs.leadConservativeFactor} onConservativeFactor={(value) => updateInput('leadConservativeFactor', value)} onOpen={() => onOpen('lead')} />
          <OpportunityCard module="conversion" title="Conversion Rate Baseline" projection={results.conversionProjection} conservativeFactor={inputs.conversionConservativeFactor} onConservativeFactor={(value) => updateInput('conversionConservativeFactor', value)} onOpen={() => onOpen('conversion')} />
          <OpportunityCard module="discount" title="Discount Reduction Impact" projection={results.discountProjection} conservativeFactor={inputs.discountConservativeFactor} onConservativeFactor={(value) => updateInput('discountConservativeFactor', value)} onOpen={() => onOpen('discount')} />
          <DashboardSummary results={results} onOpen={() => onOpen('summary')} />
        </div>
      </div>
    </>
  )
}

export function LeadGenerationPage({ inputs, results, updateInput }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput }) {
  return (
    <>
      <PageHeader title="LEAD GENERATION IMPACT" value={formatCurrency(results.leadProjection.total)} />
      <div className="legacy-layout"><div className="legacy-form">
        <FormGroup title="CURRENT CONVERSION BASELINE">
          <NumberField id="monthly-leads" label="Estimated number of monthly inbound leads" value={inputs.monthlyInboundLeads} onChange={(value) => updateInput('monthlyInboundLeads', value)} />
          <CalculatedField label="Annual leads" value={formatNumber(results.annualLeads)} />
          <NumberField id="lead-win-rate" label={`What % of the ${formatNumber(results.annualLeads)} annual leads will you win (win rate % - typically 10 - 25%)`} suffix="%" max={100} step={0.1} value={inputs.currentCloseRate} onChange={(value) => updateInput('currentCloseRate', value)} />
          <CalculatedField label="Estimated deals won from leads" value={formatNumber(results.currentLeadWins)} />
          <NumberField id="lead-deal-value" label="Average deal value (annually)" prefix="$" step={100} value={inputs.averageDealValue} onChange={(value) => updateInput('averageDealValue', value)} />
          <CalculatedField label="Estimated Annual Sales From Generated Leads - Current Conversion Baseline" value={formatCurrency(results.currentLeadRevenue)} />
        </FormGroup>
        <FormGroup title="AFTER PIPELINE CONVERSION SYSTEM IMPLEMENTATION">
          <NumberField id="lead-increase" label="% Increase in LEADS with lead magnet / other materials (typically between 10 - 30%)" suffix="%" max={100} step={0.1} value={inputs.leadIncreaseRate} onChange={(value) => updateInput('leadIncreaseRate', value)} />
          <CalculatedField label="Increase in annual leads" value={formatNumber(results.increasedAnnualLeads, 1)} />
          <CalculatedField label={`Additional deals won based on your ${formatPercent(inputs.currentCloseRate, 1)} win rate`} value={formatNumber(results.additionalLeadWins)} />
          <CalculatedField label="Average deal value" value={formatCurrency(inputs.averageDealValue)} />
          <CalculatedField label="Projected Increase In Sales Revenue" value={formatCurrency(results.leadGenerationRevenue)} />
          <NotesField id="lead-notes" value={inputs.leadNotes} onChange={(value) => updateInput('leadNotes', value)} />
        </FormGroup>
      </div><ResultRail title="Lead Generation Impact" projection={results.leadProjection} conservativeFactor={inputs.leadConservativeFactor} implementationMonths={inputs.leadImplementationMonths} onConservativeFactor={(value) => updateInput('leadConservativeFactor', value)} onImplementationMonths={(value) => updateInput('leadImplementationMonths', value)} /></div>
    </>
  )
}

export function ConversionPage({ inputs, results, updateInput }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput }) {
  return (
    <>
      <PageHeader title="CONVERSION RATE BASELINE" value={formatCurrency(results.conversionProjection.total)} />
      <div className="legacy-layout"><div className="legacy-form">
        <FormGroup title="SALES TEAM PERFORMANCE BASELINE">
          <NumberField id="salespeople" label="Number of salespeople" value={inputs.numberSalespeople} onChange={(value) => updateInput('numberSalespeople', value)} />
          <CalculatedField label="Average deal value (annually)" value={formatCurrency(inputs.averageDealValue)} detail="Synchronized with Lead Generation Impact" />
          <NumberField id="sales-per-rep" label="What is the expected annual sales for 1 salesperson" prefix="$" step={1000} value={inputs.annualSalesPerRep} onChange={(value) => updateInput('annualSalesPerRep', value)} />
          <CalculatedField label={`Expected annual sales for all ${formatNumber(inputs.numberSalespeople)} salespeople`} value={formatCurrency(results.expectedAnnualSales)} />
          <CalculatedField label={`Deals needed to hit your sales goal of ${formatCurrency(results.expectedAnnualSales)}`} value={formatNumber(results.dealsNeeded)} />
          <CalculatedField label="Average number of deals each rep needs to win to hit the sales goal" value={formatNumber(results.dealsPerRep, 2)} />
          <CalculatedField label="Win rate (typically 10 - 20%)" value={formatPercent(inputs.currentCloseRate, 1)} detail="Synchronized with Lead Generation Impact" />
          <CalculatedField label="Loss rate" value={formatPercent(results.lossRate, 1)} />
          <CalculatedField label="Opportunities lost throughout the year based on win rate" value={formatNumber(results.opportunitiesLost)} detail={`Opportunities worked = ${formatNumber(results.opportunitiesWorked)} · Money left on the table = ${formatCurrency(results.moneyLeftOnTable)}`} />
          <NotesField id="loss-reasons" label="What are the main reasons why your salespeople are losing deals?" value={inputs.lossReasons} onChange={(value) => updateInput('lossReasons', value)} />
        </FormGroup>
        <FormGroup title="LOST OPPORTUNITY RECOVERY">
          <NumberField id="additional-wins" label={`Out of the ${formatNumber(results.opportunitiesLost)} deals lost, how many could you have won by implementing the All-Inclusive Sales Kit best practices?`} hint="Additional Wins" value={inputs.additionalConversionWins} onChange={(value) => updateInput('additionalConversionWins', value)} />
          <CalculatedField label="Projected increase in sales" value={formatCurrency(results.conversionRevenue)} />
          <CalculatedField label="Required reduction in loss rate" value={formatPercent(results.lossRateReductionNeeded)} />
          <NotesField id="conversion-notes" value={inputs.conversionNotes} onChange={(value) => updateInput('conversionNotes', value)} />
        </FormGroup>
        <p className="executive-equivalence">Winning an additional <strong>{formatNumber(inputs.additionalConversionWins)}</strong> deals would represent an increase in sales of <strong>{formatCurrency(results.conversionRevenue)}</strong>. This requires reducing the loss rate by only <strong>{formatPercent(results.lossRateReductionNeeded)}</strong>.</p>
      </div><ResultRail title="Conversion Rate Baseline" projection={results.conversionProjection} conservativeFactor={inputs.conversionConservativeFactor} implementationMonths={inputs.conversionImplementationMonths} onConservativeFactor={(value) => updateInput('conversionConservativeFactor', value)} onImplementationMonths={(value) => updateInput('conversionImplementationMonths', value)} /></div>
    </>
  )
}

export function DiscountPage({ inputs, results, updateInput }: { inputs: RoiInputs; results: RoiResults; updateInput: UpdateInput }) {
  return (
    <>
      <PageHeader title="DISCOUNT REDUCTION IMPACT" value={formatCurrency(results.discountProjection.total)} />
      <div className="legacy-layout"><div className="legacy-form">
        <FormGroup title="REDUCE DISCOUNTING WITH BETTER MESSAGING">
          <CalculatedField label={'Number of "deals" needed to hit your sales goal'} value={formatNumber(results.dealsNeeded)} />
          <CalculatedField label="Average deal value" value={formatCurrency(inputs.averageDealValue)} detail="Synchronized with Lead Generation Impact" />
          <CalculatedField label="Projected annual sales revenue" value={formatCurrency(results.projectedAnnualSales)} />
          <NumberField id="current-discount" label="Average discount applied per deal (%)" suffix="%" max={100} step={0.1} value={inputs.currentDiscountRate} onChange={(value) => updateInput('currentDiscountRate', value)} />
          <NumberField id="future-discount" label="Expected discount rate applied with a better value proposition and messaging (%)" suffix="%" max={100} step={0.1} value={inputs.improvedDiscountRate} onChange={(value) => updateInput('improvedDiscountRate', value)} />
          <CalculatedField label="Additional Revenue Generated by Reducing Discounting" value={formatCurrency(results.discountRevenue)} />
          <NotesField id="discount-notes" value={inputs.discountNotes} onChange={(value) => updateInput('discountNotes', value)} />
        </FormGroup>
        <p className="executive-equivalence">A <strong>{formatPercent(results.discountReduction, 1)}</strong> reduction in discounting would have the same impact as winning an additional <strong>{formatNumber(results.equivalentDeals, 1)}</strong> deals.</p>
      </div><ResultRail title="Discount Reduction Impact" projection={results.discountProjection} conservativeFactor={inputs.discountConservativeFactor} implementationMonths={inputs.discountImplementationMonths} onConservativeFactor={(value) => updateInput('discountConservativeFactor', value)} onImplementationMonths={(value) => updateInput('discountImplementationMonths', value)} /></div>
    </>
  )
}

const summaryRows = (results: RoiResults) => [
  ['LEAD GENERATION IMPACT', results.leadProjection],
  ['CONVERSION RATE BASELINE', results.conversionProjection],
  ['DISCOUNT REDUCTION IMPACT', results.discountProjection],
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
