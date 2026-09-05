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
    return next
  } catch { return { ...EMPTY_DISCOVERY_BASELINE } }
}

export function summarizeDiscoveryAreas(areas: DiscoveryArea[]) {
  const count = areas.length
  const current = count ? areas.reduce((sum, area) => sum + area.now, 0) / count : 0
  const after = count ? areas.reduce((sum, area) => sum + area.after, 0) / count : 0
  const lift = after - current
  return { count, current, after, lift, improvement: current > 0 ? lift / current * 100 : 0 }
}

export function calculateDiscovery(baseline: DiscoveryBaseline, areas: DiscoveryArea[], sensitivity: number, conservative: number) {
  const ready = Object.keys(baselineErrors(baseline)).length === 0
  const repCount = baseline.mode === 'team' ? Number(baseline.reps) : 1
  const annualPresentations = ready ? Number(baseline.weeklyPresentations) * repCount * 52 : 0
  const currentRate = ready ? Number(baseline.closeRate) / 100 : 0
  const averageLift = summarizeDiscoveryAreas(areas).lift
  // Keep the existing 85% projection ceiling without reducing a higher entered baseline.
  const afterRate = Math.max(currentRate, Math.min(.85, currentRate * (1 + averageLift * sensitivity / 100 * conservative / 100)))
  const currentWins = annualPresentations * currentRate
  const projectedWins = annualPresentations * afterRate
  const additionalWins = projectedWins - currentWins
  return { ready, repCount, annualPresentations, currentRate, afterRate, averageLift, currentWins, projectedWins, additionalWins, annualExtra: additionalWins * (ready ? Number(baseline.offerValue) : 0) }
}
