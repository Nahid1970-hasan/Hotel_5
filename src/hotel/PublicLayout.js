import { createContext, useContext, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { api, token } from './api'
import '../style/hotel.css'

const GuestContext = createContext(null)
export function useGuest() {
  return useContext(GuestContext)
}

const links = [
  ['/rooms', 'Rooms & Suites'],
  ['/dining', 'Dining'],
  ['/experiences', 'Experiences'],
  ['/facilities', 'Facilities'],
  ['/offers', 'Offers'],
  ['/gallery', 'Gallery'],
  ['/destination', 'Destination'],
  ['/contact', 'Contact'],
]

export default function PublicLayout() {
  const location = useLocation()
  const [hotel, setHotel] = useState(null)
  const [guest, setGuest] = useState(null)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const refresh = async () => {
    if (!token('guest')) {
      setGuest(null)
      return
    }
    try {
      const result = await api('/me', { auth: 'guest' })
      setGuest(result.data)
    } catch (error) {
      setGuest(null)
    }
  }

  useEffect(() => {
    api('/hotel').then((result) => setHotel(result.data)).catch(() => setHotel(null))
    refresh()
  }, [])

  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const previous = document.title
    document.title = hotel ? `${hotel.name}` : 'Grand Horizon Luxury Hotel'
    return () => {
      document.title = previous
    }
  }, [hotel])

  return (
    <GuestContext.Provider value={{ hotel, guest, refresh, setGuest }}>
      <div className="gh">
        <a className="skip" href="#content">Skip to content</a>
        <header className={scrolled ? 'topbar is-scrolled' : 'topbar'}>
          <Link className="brand" to="/">
            <strong>Grand Horizon</strong>
            <span>Cox&apos;s Bazar</span>
          </Link>
          <button type="button" className="btn light menu-btn" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            Menu
          </button>
          <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Primary">
            {links.map(([href, label]) => (
              <NavLink key={href} to={href} className={({ isActive }) => (isActive ? 'active' : undefined)}>{label}</NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            {guest ? <Link className="btn light ghost" to="/my-bookings">My stays</Link> : <Link className="btn light ghost" to="/login">Sign in</Link>}
            <Link className="btn" to="/availability">Book now</Link>
          </div>
        </header>
        <main id="content">
          <Outlet />
        </main>
        <footer className="site-footer">
          <div className="foot-grid">
            <div>
              <h2>Grand Horizon</h2>
              <p>{hotel?.address || "Marine Drive, Kolatoli, Cox's Bazar"}</p>
              <p>{hotel?.phone} · {hotel?.email}</p>
            </div>
            <div>
              <strong>Visit</strong>
              <ul>
                <li><Link to="/rooms">Rooms & Suites</Link></li>
                <li><Link to="/dining">Dining</Link></li>
                <li><Link to="/experiences">Experiences</Link></li>
                <li><Link to="/gallery">Gallery</Link></li>
              </ul>
            </div>
            <div>
              <strong>Plan</strong>
              <ul>
                <li><Link to="/offers">Offers</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/booking-policy">Booking policy</Link></li>
                <li><Link to="/destination">Getting here</Link></li>
              </ul>
            </div>
            <div>
              <strong>House</strong>
              <ul>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/reviews">Reviews</Link></li>
                <li><Link to="/privacy-policy">Privacy</Link></li>
                <li><Link to="/terms">Terms</Link></li>
                <li><Link to="/admin/login">Staff entrance</Link></li>
              </ul>
            </div>
          </div>
          <div className="legal">
            <span>© {new Date().getFullYear()} Grand Horizon Luxury Hotel</span>
            <span>Check-in {hotel?.checkInTime || '15:00'} · Check-out {hotel?.checkOutTime || '12:00'} · {hotel?.timezone || 'Asia/Dhaka'}</span>
          </div>
        </footer>
      </div>
    </GuestContext.Provider>
  )
}

export function PageIntro({ kicker, title, lede }) {
  return (
    <div className="section" style={{ paddingBottom: 0 }}>
      <p className="kicker" style={{ color: '#9c7b45' }}>{kicker}</p>
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}>{title}</h1>
      {lede && <p className="lede">{lede}</p>}
    </div>
  )
}
