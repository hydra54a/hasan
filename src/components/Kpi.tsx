import type { ReactNode } from 'react'

export function Kpi({ label, value, detail, tone = 'default' }: { label: string; value: ReactNode; detail?: string; tone?: 'default' | 'positive' | 'muted' }) {
  return <div className={`kpi ${tone}`}><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>
}
