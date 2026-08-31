import { formatCurrency, formatPercent } from '../domain/calculations'

export function AllocationBar({ reallocated, reallocationValue, remainingValue }: { reallocated: number; reallocationValue: number; remainingValue: number }) {
  const safeWidth = Math.max(0, Math.min(100, reallocated))
  return (
    <figure className="allocation-figure" aria-labelledby="allocation-title" aria-describedby="allocation-description">
      <figcaption id="allocation-title">Your investment allocation</figcaption>
      <div className="allocation-track" role="img" aria-label={`${formatPercent(safeWidth)} reallocated, ${formatPercent(100 - safeWidth)} remaining`}>
        <span className="allocation-reallocated" style={{ width: `${safeWidth}%` }} />
      </div>
      <div className="allocation-labels" id="allocation-description">
        <span><strong>{formatPercent(safeWidth)}</strong><small>Reallocated · {formatCurrency(reallocationValue)}</small></span>
        <span className="align-right"><strong>{formatPercent(100 - safeWidth)}</strong><small>Remaining · {formatCurrency(remainingValue)}</small></span>
      </div>
    </figure>
  )
}

export function RevenueBridge({ currentRevenue, incrementalRevenue }: { currentRevenue: number; incrementalRevenue: number }) {
  const total = Math.max(1, currentRevenue + incrementalRevenue)
  const currentWidth = (currentRevenue / total) * 100
  const incrementalWidth = (incrementalRevenue / total) * 100
  return (
    <figure className="revenue-bridge" aria-labelledby="bridge-title" aria-describedby="bridge-description">
      <figcaption id="bridge-title">Revenue uplift from the same lead volume</figcaption>
      <div className="bridge-bar" role="img" aria-label={`Current revenue ${formatCurrency(currentRevenue)} plus incremental revenue ${formatCurrency(incrementalRevenue)}`}>
        <span className="bridge-current" style={{ width: `${currentWidth}%` }} />
        <span className="bridge-incremental" style={{ width: `${incrementalWidth}%` }} />
      </div>
      <div className="bridge-key" id="bridge-description"><span><i className="key-current" /> Current {formatCurrency(currentRevenue)}</span><span><i className="key-incremental" /> Incremental {formatCurrency(incrementalRevenue)}</span></div>
    </figure>
  )
}
