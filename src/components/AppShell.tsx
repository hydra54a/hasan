import type { ReactNode } from 'react'
import type { ModuleId } from '../domain/types'
import { LinkIcon, MenuIcon, PrintIcon, ScreenIcon } from './Icons'

export const MODULES: { id: ModuleId; label: string; shortLabel: string }[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard' },
  { id: 'lead', label: 'Lead Generation Impact', shortLabel: 'Lead Generation Impact' },
  { id: 'conversion', label: 'Conversion Rate Impact', shortLabel: 'Conversion Rate Impact' },
  { id: 'discount', label: 'Discount Reduction Impact', shortLabel: 'Discount Reduction Impact' },
  { id: 'marketing', label: 'Marketing Investment Optimization', shortLabel: 'Marketing Optimization' },
  { id: 'summary', label: 'Summary', shortLabel: 'Summary' },
]

interface AppShellProps {
  activeModule: ModuleId
  presentationMode: boolean
  shareStatus: string
  children: ReactNode
  onModuleChange: (module: ModuleId) => void
  onToggleMenu: () => void
  onTogglePresentation: () => void
  onShare: () => void
}

function ModuleIcon({ id }: { id: ModuleId }) {
  const paths: Record<ModuleId, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    lead: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-4 2.4-6 6-6s6 2 6 6M14 15c3.7-.8 7 1 7 5"/></>,
    conversion: <><path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/><path d="m4 9 6-5 6 8 6-6"/></>,
    discount: <><path d="M20 13 11 22 2 13V3h10Z"/><circle cx="8" cy="8" r="1.5"/></>,
    marketing: <><path d="M4 14V9l13-5v15L4 14Z"/><path d="M7 15v5h4v-4M20 8v7"/></>,
    summary: <><circle cx="12" cy="12" r="9"/><path d="M12 3v9h9M8 16h8"/></>,
    'discovery-impact': <><circle cx="12" cy="12" r="9"/><path d="m12 7 1.6 3.4L17 12l-3.4 1.6L12 17l-1.6-3.4L7 12l3.4-1.6Z"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[id]}</svg>
}

export function AppShell({ activeModule, presentationMode, shareStatus, children, onModuleChange, onToggleMenu, onTogglePresentation, onShare }: AppShellProps) {
  return (
    <div className={presentationMode ? 'app presentation' : 'app'}>
      <aside className="sidebar" aria-label="ROI sections">
        <div className="brand"><img src="/hasan-consulting-logo.png" alt="Hasan Consulting" /></div>
        <div className="discovery-nav">
          <button type="button" className={activeModule === 'discovery-impact' ? 'discovery-label active' : 'discovery-label'} onClick={() => onModuleChange('discovery-impact')} aria-current={activeModule === 'discovery-impact' ? 'page' : undefined}><ModuleIcon id="discovery-impact" /><span>Discovery Framework</span></button>
        </div>
        <div className="nav-label">ROI Sections</div>
        <nav className="module-nav">
          {MODULES.map((module) => (
            <button key={module.id} type="button" className={activeModule === module.id ? 'module-item active' : 'module-item'} onClick={() => onModuleChange(module.id)} aria-current={activeModule === module.id ? 'page' : undefined}>
              <ModuleIcon id={module.id} />
              <span>{module.label}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="my-rois" onClick={() => onModuleChange('dashboard')}><span aria-hidden="true">★</span> My ROIs</button>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" onClick={onToggleMenu} aria-label="Open ROI section navigation"><MenuIcon /></button>
          <div className="topbar-title">Hasan Consulting ROI Calculator</div>
          <div className="topbar-actions">
            <span className="share-status" aria-live="polite">{shareStatus}</span>
            <button className="share-button" type="button" onClick={onShare}><LinkIcon /> Share Calculator</button>
            <button className="utility-button" type="button" onClick={() => window.print()}><PrintIcon /> Print</button>
            <button className="presentation-button" type="button" onClick={onTogglePresentation}><ScreenIcon /> Presentation Mode</button>
            <span className="powered-by">Powered by <a href="https://theroishop.com/" target="_blank" rel="noreferrer">The ROI Shop</a></span>
          </div>
        </header>
        {presentationMode ? <button className="presentation-exit" type="button" onClick={onTogglePresentation}>Exit Presentation</button> : null}
        <main>{children}</main>
      </div>
    </div>
  )
}
