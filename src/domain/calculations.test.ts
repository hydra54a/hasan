import { describe, expect, it } from 'vitest'
import { calculateRoi, projectAnnualValue } from './calculations'
import { DEFAULT_INPUTS } from './persistence'

describe('legacy ROI calculation engine', () => {
  it('matches the populated ROI Shop lead-generation record', () => {
    const result = calculateRoi(DEFAULT_INPUTS)
    expect(result.annualLeads).toBe(900)
    expect(result.currentLeadWins).toBe(135)
    expect(result.currentLeadRevenue).toBe(1_350_000)
    expect(result.increasedAnnualLeads).toBe(180)
    expect(result.additionalLeadWins).toBe(27)
    expect(result.leadGenerationRevenue).toBe(270_000)
    expect(result.leadProjection.total).toBe(540_000)
  })

  it('matches the populated conversion record', () => {
    const result = calculateRoi(DEFAULT_INPUTS)
    expect(result.expectedAnnualSales).toBe(2_400_000)
    expect(result.dealsNeeded).toBe(240)
    expect(result.dealsPerRep).toBe(20)
    expect(result.opportunitiesWorked).toBe(1_600)
    expect(result.opportunitiesLost).toBe(1_360)
    expect(result.moneyLeftOnTable).toBe(13_600_000)
    expect(result.conversionProjection.total).toBe(1_000_000)
  })

  it('matches discount reduction and original summary values before the new module', () => {
    const withoutMarketing = { ...DEFAULT_INPUTS, modeledFutureCloseRate: DEFAULT_INPUTS.currentCloseRate }
    const result = calculateRoi(withoutMarketing)
    expect(result.discountRevenue).toBe(240_000)
    expect(result.equivalentDeals).toBe(24)
    expect(result.discountProjection.total).toBe(480_000)
    expect(result.totalCost).toBe(37_000)
    expect(result.netTotal).toBe(1_983_000)
    expect(result.roiPercentage).toBeCloseTo(5_359.46, 2)
    expect(result.netPresentValue).toBeCloseTo(1_924_990, -1)
    expect(result.paybackMonths).toBeCloseTo(0.44, 2)
  })

  it('applies conservative factor and implementation delay without changing the raw annual value', () => {
    const projection = projectAnnualValue(120_000, 25, 4)
    expect(projection.baseAnnual).toBe(120_000)
    expect(projection.year1).toBe(60_000)
    expect(projection.year2).toBe(90_000)
    expect(projection.total).toBe(150_000)
  })

  it('returns safe nulls instead of Infinity or NaN', () => {
    const result = calculateRoi({ ...DEFAULT_INPUTS, monthlyInboundLeads: 0, presentationVolume: 0, averageDealValue: 0, annualAdvertisingSpend: 0 })
    expect(result.costPerLead).toBeNull()
    expect(result.currentAdvertisingCostPerWin).toBeNull()
    expect(result.marketingCostPerPresentation).toBeNull()
    expect(result.breakEvenCloseRateLift).toBeNull()
    expect(result.futureAdvertisingCostPerWin).toBeNull()
    expect(result.roiPercentage).not.toBeNull()
  })
})

describe('marketing investment optimization', () => {
  it('still matches the executive acceptance example when shared inputs use those values', () => {
    const result = calculateRoi({ ...DEFAULT_INPUTS, monthlyInboundLeads: 200, currentCloseRate: 10, averageDealValue: 5_000, presentationVolume: 2_400, modeledFutureCloseRate: 12 })
    expect(result.averageMonthlySpend).toBeCloseTo(83_333.33, 2)
    expect(result.reallocationPercentage).toBeCloseTo(8.333, 2)
    expect(result.currentLeadWins).toBe(240)
    expect(result.futureWins).toBe(288)
    expect(result.incrementalWins).toBe(48)
    expect(result.incrementalRevenue).toBe(240_000)
    expect(result.costPerLead).toBeCloseTo(416.67, 2)
    expect(result.currentAdvertisingCostPerWin).toBeCloseTo(4_166.67, 2)
    expect(result.futureAdvertisingCostPerWin).toBeCloseTo(3_472.22, 2)
  })

  it('requires leadership review when any safeguard is yes', () => {
    const result = calculateRoi({ ...DEFAULT_INPUTS, risks: { ...DEFAULT_INPUTS.risks, operations: 'yes' } })
    expect(result.riskStatus).toBe('review')
  })
})
