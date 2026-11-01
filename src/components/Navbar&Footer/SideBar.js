import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

export const MENU = [
  { label: 'Front Office', icon: 'concierge', items: ['Dashboard', 'Arrivals', 'Reservations', 'Guests'] },
  { label: 'Rooms', icon: 'hotel', items: ['Room Types', 'Physical Rooms', 'Inventory'] },
  { label: 'Revenue', icon: 'payments', items: ['Rate Plans', 'Payments', 'Reports'] },
  { label: 'Operations', icon: 'cleaning_services', items: ['Housekeeping', 'Maintenance', 'Services'] },
  { label: 'Website', icon: 'web', items: ['Content', 'Reviews', 'Messages'] },
  { label: 'System', icon: 'admin_panel_settings', items: ['Users', 'Settings', 'Audit Logs'] },
]

export function slug(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function hrefFor(groupLabel, itemLabel) {
  return `/admin/${slug(groupLabel)}/${slug(itemLabel)}`
}

export function findMenuItem(groupSlug, itemSlug) {
  for (const group of MENU) {
    if (slug(group.label) !== groupSlug) continue
    const item = group.items.find((entry) => slug(entry) === itemSlug)
    if (item) return { group: group.label, item }
  }
  return null
}

function groupFromPath(pathname) {
  const path = pathname.replace(/^\/admin/, '')
  const group = MENU.find((entry) => path.startsWith(`/${slug(entry.label)}/`))
  return group ? group.label : null
}

function Icon({ name }) {
  return (
    <span className="material-icons sidebar-icon" aria-hidden="true">
      {name}
    </span>
  )
}

function Chevron() {
  return (
    <span className="material-icons sidebar-chevron" aria-hidden="true">
      expand_more
    </span>
  )
}

export default function SideBar({ collapsed, onToggle, query, onLogout, user }) {
  const location = useLocation()
  const userRef = useRef(null)
  const [userOpen, setUserOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState(() => groupFromPath(location.pathname))

  useEffect(() => {
    const next = groupFromPath(location.pathname)
    if (next) setOpenGroup(next)
  }, [location.pathname])

  useEffect(() => {
    if (!userOpen) return undefined
    const close = (event) => {
      if (!userRef.current?.contains(event.target)) setUserOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [userOpen])

  const needle = query.trim().toLowerCase()
  const groups = MENU.flatMap((group) => {
    if (!needle) return [group]
    const groupMatch = group.label.toLowerCase().includes(needle)
    if (groupMatch) return [group]
    const items = group.items.filter((item) => item.toLowerCase().includes(needle))
    return items.length ? [{ ...group, items }] : []
  })

  const toggleGroup = (label) => {
    if (collapsed) {
      onToggle()
      setOpenGroup(label)
      return
    }
    setOpenGroup((current) => (current === label ? null : label))
  }

  return (
    <aside className={collapsed ? 'sidebar is-collapsed' : 'sidebar'}>
      <button type="button" className="sidebar-collapse" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <span className="material-icons" aria-hidden="true">
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      <Link className="sidebar-brand" to="/admin/front-office/dashboard" aria-label="Grand Horizon desk">
        <span className="sidebar-logo-full">Horizon</span>
        <span className="sidebar-logo-mark">H</span>
      </Link>

      <div className="sidebar-user" ref={userRef}>
        <button type="button" className="sidebar-user-btn" onClick={() => setUserOpen((open) => !open)} aria-expanded={userOpen} aria-haspopup="menu">
          <span className="sidebar-avatar" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="32" fill="#d5dde6" />
              <circle cx="32" cy="26" r="10" fill="#8d6e63" />
              <path d="M14 56c3.2-11 10-16 18-16s14.8 5 18 16" fill="#5f6e7d" />
            </svg>
          </span>
          <span className="sidebar-user-meta">
            <strong>{user?.name || 'Staff'}</strong>
            <span>{user?.role || 'Hotel team'}</span>
          </span>
          <Chevron />
        </button>
        {userOpen && !collapsed && (
          <div className="sidebar-user-menu" role="menu">
            <Link to="/admin/profile" role="menuitem" onClick={() => setUserOpen(false)}>
              View profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setUserOpen(false)
                onLogout()
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-scroll">
        <p className="sidebar-label">Menu</p>
        <nav className="sidebar-nav" aria-label="Main">
          {groups.length === 0 && <p className="sidebar-empty">No matches</p>}
          {groups.map((group) => {
            const active = location.pathname.startsWith(`/${slug(group.label)}/`)
            const expanded = Boolean(needle) || openGroup === group.label
            return (
              <div key={group.label} className={active ? 'sidebar-group is-active' : 'sidebar-group'}>
                <button type="button" className="sidebar-group-btn" onClick={() => toggleGroup(group.label)} aria-expanded={expanded} title={group.label}>
                  <Icon name={group.icon} />
                  <span className="sidebar-group-text">{group.label}</span>
                  <Chevron />
                </button>
                <div className={expanded && !collapsed ? 'sidebar-sub is-open' : 'sidebar-sub'}>
                  <div className="sidebar-sub-inner">
                    {group.items.map((item) => (
                      <NavLink key={item} to={hrefFor(group.label, item)} className={({ isActive }) => (isActive ? 'sidebar-link is-active' : 'sidebar-link')}>
                        {item}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
