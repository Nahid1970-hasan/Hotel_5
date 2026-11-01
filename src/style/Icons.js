import { useEffect, useMemo, useState } from 'react'
import { MATERIAL_ICONS } from '../pages/materialIconNames'
import './icons.css'

const STYLES = [
  { id: 'filled', label: 'Filled', className: 'material-icons' },
  { id: 'outlined', label: 'Outlined', className: 'material-icons-outlined' },
  { id: 'round', label: 'Round', className: 'material-icons-round' },
  { id: 'sharp', label: 'Sharp', className: 'material-icons-sharp' },
  { id: 'two-tone', label: 'Two tone', className: 'material-icons-two-tone' },
]

export default function Icons() {
  const [query, setQuery] = useState('')
  const [styleId, setStyleId] = useState('filled')
  const [copied, setCopied] = useState('')
  const style = STYLES.find((entry) => entry.id === styleId) || STYLES[0]

  const icons = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/\s+/g, '_')
    if (!needle) return MATERIAL_ICONS
    return MATERIAL_ICONS.filter((name) => name.includes(needle))
  }, [query])

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(''), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copyName = async (name) => {
    try {
      await navigator.clipboard.writeText(name)
      setCopied(name)
    } catch {
      setCopied('')
    }
  }

  return (
    <main className="app icons-page">
      <p className="kicker">Icons</p>
      <h1>Material Icons</h1>
      <p className="lede">All {MATERIAL_ICONS.length} icons from the material-icons package. Click an icon to copy its name.</p>

      <div className="icons-toolbar">
        <label className="icons-search">
          <span className="material-icons" aria-hidden="true">
            search
          </span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search icons" aria-label="Search icons" />
        </label>
        <div className="icons-styles" role="tablist" aria-label="Icon style">
          {STYLES.map((entry) => (
            <button key={entry.id} type="button" role="tab" aria-selected={styleId === entry.id} className={styleId === entry.id ? 'is-active' : undefined} onClick={() => setStyleId(entry.id)}>
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <p className="icons-count">
        {icons.length} {icons.length === 1 ? 'icon' : 'icons'}
        {copied ? ` · Copied ${copied}` : ''}
      </p>

      {icons.length === 0 ? (
        <p className="icons-empty">No icons match that search.</p>
      ) : (
        <ul className="icons-grid">
          {icons.map((name) => (
            <li key={name}>
              <button type="button" className="icon-card" onClick={() => copyName(name)} title={name}>
                <span className={style.className} aria-hidden="true">
                  {name}
                </span>
                <span className="icon-card-name">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
