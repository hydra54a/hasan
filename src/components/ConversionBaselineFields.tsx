import { formatCurrency } from '../domain/calculations'
import type { RoiInputs, RoiResults } from '../domain/types'
import { ConversionPage, type UpdateInput } from './LegacyPages'

export function ConversionBaselineFields({ inputs, results, updateInput }: {
  inputs: RoiInputs
  results: RoiResults
  updateInput: UpdateInput
}) {
  return <section className="discovery-conversion-baseline" aria-labelledby="discovery-conversion-title">
    <header className="discovery-conversion-header"><h2 id="discovery-conversion-title">Conversion Rate Baseline</h2><div><output aria-label="Conversion Rate Baseline total two year opportunity">{formatCurrency(results.conversionProjection.total)}</output><span>Total 2 Year Opportunity</span></div></header>
    <ConversionPage inputs={inputs} results={results} updateInput={updateInput} embedded />
  </section>
}
