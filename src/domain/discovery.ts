import type { RoiInputs, RoiResults } from './types'

export type DiscoverySide = 'rep' | 'prospect'
export type DiscoveryArea = { id: number; side: DiscoverySide; name: string; quote: string; now: number; after: number; removable?: boolean }
export type DiscoveryBaseline = {
  mode: 'individual' | 'team'
  reps: string
  weeklyPresentations: string
  offerValue: string
  closeRate: string
  noDecisionRate: string
  salesCycle: string
  salesCycleUnit: 'days' | 'weeks' | 'months'
}

export const EMPTY_DISCOVERY_BASELINE: DiscoveryBaseline = {
  mode: 'individual', reps: '1', weeklyPresentations: '', offerValue: '', closeRate: '',
  noDecisionRate: '', salesCycle: '', salesCycleUnit: 'days',
}
export const DISCOVERY_BASELINE_KEY = 'hasan-discovery-baseline:v1'

export function baselineErrors(baseline: DiscoveryBaseline) {
  const errors: Partial<Record<keyof DiscoveryBaseline, string>> = {}
  const check = (key: keyof DiscoveryBaseline, min: number, max: number, whole = false, optional = false) => {
    const raw = baseline[key]
    if (optional && raw === '') return
    const value = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(value) || value < min || value > max || (whole && !Number.isInteger(value))) {
      errors[key] = whole ? `Enter a whole number from ${min} to ${max.toLocaleString('en-US')}.` : `Enter a number from ${min} to ${max.toLocaleString('en-US')}.`
    }
  }
  check('weeklyPresentations', 0, 10000, true)
  check('offerValue', 0, 1000000000)
  check('closeRate', 0, 100)
  if (baseline.mode === 'team') check('reps', 1, 10000, true)
  check('noDecisionRate', 0, 100, false, true)
  check('salesCycle', 0, 10000, false, true)
  if (!errors.closeRate && !errors.noDecisionRate && Number(baseline.closeRate) + Number(baseline.noDecisionRate) > 100) {
    errors.noDecisionRate = 'Close rate and no-decision rate together cannot exceed 100%.'
  }
  return errors
}

export function loadDiscoveryBaseline(): DiscoveryBaseline {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DISCOVERY_BASELINE_KEY) ?? 'null')
    if (!saved || typeof saved !== 'object') return { ...EMPTY_DISCOVERY_BASELINE }
    const next = { ...EMPTY_DISCOVERY_BASELINE }
    for (const key of Object.keys(next) as (keyof DiscoveryBaseline)[]) {
      const value = (saved as Record<string, unknown>)[key]
      if (typeof value === 'string') Object.assign(next, { [key]: value })
    }
    if (next.mode !== 'team' && next.mode !== 'individual') next.mode = 'individual'
    if (!['days', 'weeks', 'months'].includes(next.salesCycleUnit)) next.salesCycleUnit = 'days'
    next.closeRate = next.closeRate === '' ? '' : String(Math.min(100, Math.max(0, Number(next.closeRate) || 0)))
    next.noDecisionRate = next.closeRate === '' ? '' : String(100 - Number(next.closeRate))
    return normalizeSalesCycle(next)
  } catch { return { ...EMPTY_DISCOVERY_BASELINE } }
}

// Each rating point contributes 1.5 weighted lift points.
export function discoveryRatingLift(current: number, after: number): number {
  return (after - current) * 1.5
}

export function summarizeDiscoveryAreas(areas: DiscoveryArea[]) {
  const count = areas.length
  const current = count ? areas.reduce((sum, area) => sum + area.now, 0) / count : 0
  const after = count ? areas.reduce((sum, area) => sum + area.after, 0) / count : 0
  const lift = discoveryRatingLift(current, after)
  return { count, current, after, lift, improvement: current > 0 ? lift / current * 100 : 0 }
}

export function calculateDiscovery(baseline: DiscoveryBaseline, areas: DiscoveryArea[], sensitivity: number, conservative: number) {
  const ready = Object.keys(baselineErrors(baseline)).length === 0
  const repCount = baseline.mode === 'team' ? Number(baseline.reps) : 1
  const annualPresentations = ready ? Number(baseline.weeklyPresentations) * repCount * 52 : 0
  const currentRate = ready ? Number(baseline.closeRate) / 100 : 0
  return projectDiscovery(ready, repCount, annualPresentations, currentRate, ready ? Number(baseline.offerValue) : 0, areas, sensitivity, conservative)
}

export function calculateDiscoveryFromConversion(inputs: RoiInputs, results: RoiResults, areas: DiscoveryArea[], sensitivity: number, conservative: number) {
  const nonnegative = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0
  return projectDiscovery(true, nonnegative(inputs.numberSalespeople), nonnegative(results.opportunitiesWorked), Math.min(100, nonnegative(inputs.currentCloseRate)) / 100, nonnegative(inputs.averageDealValue), areas, sensitivity, conservative)
}

function projectDiscovery(ready: boolean, repCount: number, annualPresentations: number, currentRate: number, offerValue: number, areas: DiscoveryArea[], sensitivity: number, conservative: number) {
  const averageLift = summarizeDiscoveryAreas(areas).lift
  // Keep the existing 85% projection ceiling without reducing a higher entered baseline.
  const afterRate = Math.max(currentRate, Math.min(.85, currentRate * (1 + averageLift * sensitivity / 100 * conservative / 100)))
  const currentWins = annualPresentations * currentRate
  const projectedWins = annualPresentations * afterRate
  const additionalWins = projectedWins - currentWins
  return { ready, repCount, annualPresentations, currentRate, afterRate, averageLift, currentWins, projectedWins, additionalWins, annualExtra: additionalWins * offerValue }
}

export function normalizeSalesCycle(baseline: DiscoveryBaseline): DiscoveryBaseline {
  if (baseline.salesCycleUnit === 'days' && Number(baseline.salesCycle) > 59 && !baselineErrors(baseline).salesCycle) {
    return { ...baseline, salesCycle: String(Number((Number(baseline.salesCycle) / 30).toFixed(4))), salesCycleUnit: 'months' }
  }
  return baseline
}

/** Annual revenue gap against converting every existing presentation (52 weeks). */
export function discoveryOpportunityLoss(baseline: DiscoveryBaseline): number | null {
  const errors = baselineErrors(baseline)
  // Only inputs used by this calculation can prevent a result.
  if (errors.weeklyPresentations || errors.offerValue || errors.closeRate || errors.reps) return null

  const repCount = baseline.mode === 'team' ? Number(baseline.reps) : 1
  const annualPresentations = Number(baseline.weeklyPresentations) * 52 * repCount
  const potentialRevenue = annualPresentations * Number(baseline.offerValue)
  const currentRevenue = potentialRevenue * Number(baseline.closeRate) / 100
  return Math.max(0, potentialRevenue - currentRevenue)
}
