import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { findMenuItem } from './SideBar'

function pageMeta(pathname) {
  const path = pathname.replace(/^\/admin/, '') || '/'
  if (path === '/profile') return { crumb: 'Account', title: 'Profile' }
  const [groupSlug, itemSlug] = path.split('/').filter(Boolean)
  const match = groupSlug && itemSlug ? findMenuItem(groupSlug, itemSlug) : null
  if (match) return { crumb: match.group, title: match.item }
  return { crumb: 'Front Office', title: 'Dashboard' }
}

export default function Navbar({ query, onQueryChange, onToggle, onLogout, notices = [] }) {
  const { pathname } = useLocation()
  const { crumb, title } = pageMeta(pathname)
  const [noticesOpen, setNoticesOpen] = useState(false)

  return (
    <header className="navbar">
      <button type="button" className="navbar-menu-btn" onClick={onToggle} aria-label="Open sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className="navbar-heading">
        <span>{crumb}</span>
        <strong>{title}</strong>
      </div>

      <label className="navbar-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="6" />
          <path d="M15.5 15.5 20 20" />
        </svg>
        <input type="search" placeholder="Search menu" value={query} onChange={(event) => onQueryChange(event.target.value)} aria-label="Search menu" />
      </label>

      <div className="navbar-actions">
        <div className="navbar-notices-wrap">
          <button type="button" className="navbar-icon-btn" aria-label="Notifications" aria-expanded={noticesOpen} onClick={() => setNoticesOpen((open) => !open)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16z" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
          </button>
          {noticesOpen && (
            <div className="navbar-notices" role="status">
              {notices.length === 0 ? 'No new notifications' : notices.map((notice) => <p key={notice}>{notice}</p>)}
            </div>
          )}
        </div>
        <button type="button" className="navbar-icon-btn" aria-label="Log out" onClick={onLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 7V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-2" />
            <path d="M4 12h11" />
            <path d="M12 8l4 4-4 4" />
          </svg>
        </button>
      </div>
    </header>
  )
}
