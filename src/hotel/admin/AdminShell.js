import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import Footer from '../../components/Navbar&Footer/Footer'
import Navbar from '../../components/Navbar&Footer/Navbar'
import SideBar from '../../components/Navbar&Footer/SideBar'
import { api, setToken, token } from '../api'
import '../../style/hotel-admin.css'

const AdminContext = createContext(null)
export function useAdmin() {
  return useContext(AdminContext)
}

export function AdminShell() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 860px)').matches)
  const [query, setQuery] = useState('')
  const [user, setUser] = useState(null)
  const [notices, setNotices] = useState([])
  const [ready, setReady] = useState(false)

  const logout = () => {
    setToken('staff', null)
    setUser(null)
    navigate('/admin/login')
  }

  const call = async (path, options) => {
    try {
      return await api(path, { ...options, auth: 'staff' })
    } catch (error) {
      if (error.status === 401) logout()
      throw error
    }
  }

  useEffect(() => {
    let ignore = false
    if (!token('staff')) {
      setReady(true)
      return undefined
    }
    api('/admin/me', { auth: 'staff' })
      .then((result) => {
        if (!ignore) setUser(result.data)
      })
      .catch(() => {
        if (!ignore) setToken('staff', null)
      })
      .finally(() => {
        if (!ignore) setReady(true)
      })
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!user) return undefined
    api('/admin/notifications', { auth: 'staff' })
      .then((result) => setNotices(result.data.slice(0, 5).map((item) => item.subject || item.type)))
      .catch(() => setNotices([]))
    return undefined
  }, [user])

  if (!ready) return <div className="hotel-admin" style={{ padding: 32 }}>Opening the desk…</div>
  if (!user) return <Navigate to="/admin/login" replace />

  return (
    <AdminContext.Provider value={{ user, call, logout }}>
      <div className="shell">
        {!collapsed && <button type="button" className="sidebar-backdrop" onClick={() => setCollapsed(true)} aria-label="Close sidebar" />}
        <SideBar
          collapsed={collapsed}
          onToggle={() => setCollapsed((open) => !open)}
          query={query}
          onLogout={logout}
          user={{ name: user.name, role: user.roles[0] }}
        />
        <div className="shell-main">
          <Navbar query={query} onQueryChange={setQuery} onToggle={() => setCollapsed((open) => !open)} onLogout={logout} notices={notices} />
          <div className="shell-content">
            <Outlet />
          </div>
          <Footer />
        </div>
      </div>
    </AdminContext.Provider>
  )
}

export function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (token('staff')) navigate('/admin/front-office/dashboard', { replace: true })
  }, [navigate])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const result = await api('/auth/login', { method: 'POST', body: { ...form, portal: 'staff' } })
      setToken('staff', result.data.token)
      navigate('/admin/front-office/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="staff-login">
      <div className="staff-card">
        <p className="kicker">Grand Horizon</p>
        <h1>Staff entrance</h1>
        <p>Reservations, rooms, and the house books.</p>
        <form onSubmit={submit}>
          {error && <p className="alert">{error}</p>}
          <label>Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Password<input type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <button className="ha-btn" type="submit">Sign in</button>
        </form>
        <div className="demo">
          <p>Super admin: amira.rahman@grandhorizon.hotel / Horizon#2026</p>
          <p>Front desk: karim.hossain@grandhorizon.hotel / Desk#2026</p>
          <p>Housekeeping: nusrat.ahmed@grandhorizon.hotel / House#2026</p>
        </div>
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { user } = useAdmin()
  return (
    <div className="hotel-admin">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p>{user.roles.join(', ')}</p>
    </div>
  )
}
