import { describe, expect, it } from 'vitest'
import { baselineErrors, calculateDiscovery, EMPTY_DISCOVERY_BASELINE, summarizeDiscoveryAreas, type DiscoveryArea } from './discovery'

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
