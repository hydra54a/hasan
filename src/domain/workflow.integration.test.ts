import { describe, expect, it } from 'vitest'
import { calculateRoi } from './calculations'
import { DEFAULT_INPUTS, migrateLegacyInputs, parseInputsFromUrl } from './persistence'

describe('cross-module synchronization', () => {
  it('propagates the shared close rate and deal value through all modules', () => {
    const result = calculateRoi({ ...DEFAULT_INPUTS, currentCloseRate: 20, averageDealValue: 12_000 })
    expect(result.currentLeadWins).toBe(180)
    expect(result.currentLeadRevenue).toBe(2_160_000)
    expect(result.lossRate).toBe(80)
    expect(result.conversionRevenue).toBe(600_000)
    expect(result.projectedAnnualSales).toBe(2_400_000)
    expect(result.discountRevenue).toBe(240_000)
  })

  it('updates dashboard and summary totals when a module control changes', () => {
    const baseline = calculateRoi(DEFAULT_INPUTS)
    const conservative = calculateRoi({ ...DEFAULT_INPUTS, leadConservativeFactor: 50 })
    expect(conservative.leadProjection.total).toBe(baseline.leadProjection.total / 2)
    expect(conservative.netTotal).toBe(baseline.netTotal - baseline.leadProjection.total / 2)
  })

  it('preserves financial values when impact confirmation changes to review', () => {
    const baseline = calculateRoi(DEFAULT_INPUTS)
    const review = calculateRoi({ ...DEFAULT_INPUTS, risks: { ...DEFAULT_INPUTS.risks, operations: 'yes' } })
    expect(review.riskStatus).toBe('review')
    expect(review.reallocationValue).toBe(baseline.reallocationValue)
    expect(review.incrementalRevenue).toBe(baseline.incrementalRevenue)
  })

  it('migrates the original v1 marketing-only schema into the expanded calculator', () => {
    const migrated = migrateLegacyInputs({ schemaVersion: 1, inputs: { annualLeads: 2_400, currentCloseRate: 10, averageDealValue: 5_000, annualAdvertisingSpend: 1_000_000, modeledFutureCloseRate: 12 } })
    expect(migrated.monthlyInboundLeads).toBe(200)
    expect(migrated.currentCloseRate).toBe(10)
    expect(migrated.averageDealValue).toBe(5_000)
    expect(migrated.numberSalespeople).toBe(DEFAULT_INPUTS.numberSalespeople)
  })

  it('continues to accept the previous share URL parameter names', () => {
    const parsed = parseInputsFromUrl('?leads=2400&closeRate=10&dealValue=5000&months=2', DEFAULT_INPUTS)
    expect(parsed.monthlyInboundLeads).toBe(200)
    expect(parsed.currentCloseRate).toBe(10)
    expect(parsed.averageDealValue).toBe(5_000)
    expect(parsed.selectedMonths).toBe(2)
  })
})
