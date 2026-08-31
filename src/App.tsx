import { useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/AppShell'
import {
  ConversionPage,
  DashboardPage,
  DiscountPage,
  LeadGenerationPage,
  SummaryPage,
} from './components/LegacyPages'
import { MarketingPage } from './components/MarketingPage'
import { calculateRoi } from './domain/calculations'
import { createShareUrl, loadInputs, saveInputs } from './domain/persistence'
import type { ModuleId, RoiInputs } from './domain/types'

function App() {
  const [inputs, setInputs] = useState<RoiInputs>(() => loadInputs())
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard')
  const [presentationMode, setPresentationMode] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const results = useMemo(() => calculateRoi(inputs), [inputs])

  useEffect(() => saveInputs(inputs), [inputs])

  const updateInput = <K extends keyof RoiInputs>(key: K, value: RoiInputs[K]) => {
    setInputs((current) => ({ ...current, [key]: value }))
  }

  const goToModule = (module: ModuleId) => {
    setActiveModule(module)
    document.body.classList.remove('nav-open')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const share = async () => {
    const url = createShareUrl(inputs)
    window.history.replaceState(null, '', url)
    try {
      await navigator.clipboard.writeText(url)
      setShareStatus('Link copied')
    } catch {
      setShareStatus('Share URL updated')
    }
    window.setTimeout(() => setShareStatus(''), 2200)
  }

  return (
    <AppShell activeModule={activeModule} presentationMode={presentationMode} shareStatus={shareStatus} onModuleChange={goToModule} onToggleMenu={() => document.body.classList.toggle('nav-open')} onTogglePresentation={() => setPresentationMode((current) => !current)} onShare={share}>
      {activeModule === 'dashboard' ? <DashboardPage inputs={inputs} results={results} updateInput={updateInput} onOpen={goToModule} /> : null}
      {activeModule === 'lead' ? <LeadGenerationPage inputs={inputs} results={results} updateInput={updateInput} /> : null}
      {activeModule === 'conversion' ? <ConversionPage inputs={inputs} results={results} updateInput={updateInput} /> : null}
      {activeModule === 'discount' ? <DiscountPage inputs={inputs} results={results} updateInput={updateInput} /> : null}
      {activeModule === 'marketing' ? <MarketingPage inputs={inputs} results={results} updateInput={updateInput} /> : null}
      {activeModule === 'summary' ? <SummaryPage inputs={inputs} results={results} updateInput={updateInput} /> : null}
    </AppShell>
  )
}

export default App
