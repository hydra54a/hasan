import { calculateRoi } from './calculations'
import { DEFAULT_INPUTS } from './persistence'
import { describe, expect, it } from 'vitest'
import { baselineErrors, discoveryOpportunityLoss, normalizeSalesCycle, calculateDiscovery, calculateDiscoveryFromConversion, EMPTY_DISCOVERY_BASELINE, summarizeDiscoveryAreas, type DiscoveryArea } from './discovery'

const baseline = { ...EMPTY_DISCOVERY_BASELINE, weeklyPresentations: '10', offerValue: '5000', closeRate: '20' }
const areas: DiscoveryArea[] = [
  { id: 1, side: 'rep', name: 'Confidence', quote: '', now: 4, after: 6 },
  { id: 2, side: 'prospect', name: 'Clarity', quote: '', now: 5, after: 6 },
]

describe('Discovery Framework independent baseline', () => {
  it('requires manual sales inputs and accepts optional decision context', () => {
    expect(Object.keys(baselineErrors(EMPTY_DISCOVERY_BASELINE))).toHaveLength(3)
    expect(baselineErrors(baseline)).toEqual({})
    expect(calculateDiscovery(EMPTY_DISCOVERY_BASELINE, areas, 20, 100).ready).toBe(false)
  })

  it('uses whole weekly counts and validates team and percentage inputs', () => {
    expect(baselineErrors({ ...baseline, weeklyPresentations: '1.5' }).weeklyPresentations).toBeTruthy()
    expect(baselineErrors({ ...baseline, mode: 'team', reps: '0' }).reps).toBeTruthy()
    expect(baselineErrors({ ...baseline, closeRate: '101' }).closeRate).toBeTruthy()
    expect(baselineErrors({ ...baseline, noDecisionRate: '90' }).noDecisionRate).toBeTruthy()
    expect(baselineErrors({ ...baseline, offerValue: 'NaN' }).offerValue).toBeTruthy()
  })

  it('scales volume, clients and revenue with team size but keeps close rate unchanged', () => {
    const individual = calculateDiscovery(baseline, areas, 20, 100)
    const team = calculateDiscovery({ ...baseline, mode: 'team', reps: '5' }, areas, 20, 100)
    expect(individual.annualPresentations).toBe(520)
    expect(individual.currentWins).toBe(104)
    expect(individual.afterRate).toBeCloseTo(.26)
    expect(individual.annualExtra).toBeCloseTo(156000)
    expect(team.annualPresentations).toBe(2600)
    expect(team.afterRate).toBe(individual.afterRate)
    expect(team.additionalWins).toBeCloseTo(individual.additionalWins * 5)
    expect(team.annualExtra).toBeCloseTo(individual.annualExtra * 5)
    expect(calculateDiscovery({ ...baseline, reps: '5' }, areas, 20, 100).annualPresentations).toBe(520)
  })

  it('summarizes each side independently, including custom areas', () => {
    expect(summarizeDiscoveryAreas(areas.filter((area) => area.side === 'rep'))).toEqual({ count: 1, current: 4, after: 6, lift: 2, improvement: 50 })
    expect(summarizeDiscoveryAreas([...areas, { ...areas[0], id: 3, now: 3, after: 8 }]).lift).toBeCloseTo(8 / 3)
    expect(summarizeDiscoveryAreas([]).lift).toBe(0)
  })

  it('does not invent sales-cycle or no-decision improvements', () => {
    expect(calculateDiscovery({ ...baseline, noDecisionRate: '50', salesCycle: '3', salesCycleUnit: 'months' }, areas, 20, 100)).toEqual(calculateDiscovery(baseline, areas, 20, 100))
  })

  it('handles zero volume, zero lift, and a close rate above the existing projection ceiling', () => {
    expect(calculateDiscovery({ ...baseline, weeklyPresentations: '0' }, areas, 20, 100).annualExtra).toBe(0)
    expect(calculateDiscovery(baseline, areas.map((area) => ({ ...area, after: area.now })), 20, 100).annualExtra).toBe(0)
    const highRate = calculateDiscovery({ ...baseline, closeRate: '90' }, areas, 20, 100)
    expect(highRate.afterRate).toBe(.9)
    expect(highRate.annualExtra).toBe(0)
  })
})

describe('Discovery shared conversion baseline', () => {
  it('uses exact conversion volume and revenue without rounding weekly counts', () => {
    const inputs = { ...DEFAULT_INPUTS, numberSalespeople: 3, annualSalesPerRep: 123456, currentCloseRate: 17, averageDealValue: 7000 }
    const results = calculateRoi(inputs)
    const projection = calculateDiscoveryFromConversion(inputs, results, areas, 20, 100)
    expect(projection.ready).toBe(true)
    expect(projection.annualPresentations).toBe(results.opportunitiesWorked)
    expect(projection.currentWins).toBeCloseTo(results.dealsNeeded)
    expect(projection.currentWins * inputs.averageDealValue).toBeCloseTo(results.expectedAnnualSales)
    expect(projection.annualExtra).toBeCloseTo(results.expectedAnnualSales * .3)
    const empty = { ...inputs, numberSalespeople: 0 }
    expect(calculateDiscoveryFromConversion(empty, calculateRoi(empty), areas, 20, 100).annualExtra).toBe(0)
  })
})

describe('Discovery PDF baseline requirements', () => {
  it('converts days above 59 to months, including 75 days to 2.5 months', () => {
    expect(normalizeSalesCycle({ ...baseline, salesCycle: '59' }).salesCycleUnit).toBe('days')
    expect(normalizeSalesCycle({ ...baseline, salesCycle: '60' })).toMatchObject({ salesCycle: '2', salesCycleUnit: 'months' })
    const converted = normalizeSalesCycle({ ...baseline, salesCycle: '75' })
    expect(converted).toMatchObject({ salesCycle: '2.5', salesCycleUnit: 'months' })
    expect(normalizeSalesCycle(converted)).toEqual(converted)
    expect(normalizeSalesCycle({ ...baseline, salesCycle: '' }).salesCycle).toBe('')
    expect(normalizeSalesCycle({ ...baseline, salesCycle: '10001' })).toMatchObject({ salesCycle: '10001', salesCycleUnit: 'days' })
    expect(normalizeSalesCycle({ ...baseline, salesCycle: '75', salesCycleUnit: 'weeks' })).toMatchObject({ salesCycle: '75', salesCycleUnit: 'weeks' })
  })

  it('calculates annual opportunity loss and scales it by the assessed team', () => {
    const reference = { ...baseline, weeklyPresentations: '28', noDecisionRate: '80' }
    expect(discoveryOpportunityLoss(reference)).toBe(5824000)
    expect(discoveryOpportunityLoss({ ...reference, mode: 'team', reps: '3' })).toBe(17472000)
    expect(discoveryOpportunityLoss({ ...reference, closeRate: '100', noDecisionRate: '0' })).toBe(0)
    expect(discoveryOpportunityLoss({ ...reference, closeRate: '0', noDecisionRate: '100' })).toBe(7280000)
    expect(discoveryOpportunityLoss({ ...reference, weeklyPresentations: '0' })).toBe(0)
    expect(discoveryOpportunityLoss(EMPTY_DISCOVERY_BASELINE)).toBeNull()
  })
})


describe('Opportunity loss calculation inputs', () => {
  it('does not depend on optional sales cycle or a stored no-decision rate', () => {
    expect(discoveryOpportunityLoss({ ...baseline, salesCycle: '-1', noDecisionRate: '99' })).toBe(2080000)
  })

  it('distinguishes invalid inputs from a valid zero loss', () => {
    for (const invalid of [
      { weeklyPresentations: '' }, { weeklyPresentations: '-1' },
      { offerValue: 'NaN' }, { closeRate: '101' },
      { mode: 'team' as const, reps: '0' },
    ]) expect(discoveryOpportunityLoss({ ...baseline, ...invalid })).toBeNull()
    expect(discoveryOpportunityLoss({ ...baseline, offerValue: '0' })).toBe(0)
    expect(discoveryOpportunityLoss({ ...baseline, closeRate: '100' })).toBe(0)
  })

  it('uses decimal values without rounding the intermediate revenue', () => {
    const input = { ...baseline, weeklyPresentations: '1', offerValue: '99.99', closeRate: '33.3' }
    expect(discoveryOpportunityLoss(input)).toBeCloseTo(3468.05316, 5)
    expect(discoveryOpportunityLoss({ ...input, reps: '100' })).toBe(discoveryOpportunityLoss(input))
  })
})
