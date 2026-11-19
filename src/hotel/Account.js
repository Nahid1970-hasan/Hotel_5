import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api, money, prettyDate, setToken } from './api'
import { Btn, Field } from './admin/ui'
import { useGuest } from './PublicLayout'

function AuthShell({ title, lede, children }) {
  return (
    <section className="section" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>{title}</h1>
      {lede && <p>{lede}</p>}
      {children}
    </section>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { refresh } = useGuest()
  const [form, setForm] = useState({ email: '', password: '' })

  const submit = async (event) => {
    event.preventDefault()
    try {
      const result = await api('/auth/login', { method: 'POST', body: { ...form, portal: 'guest' } })
      setToken('guest', result.data.token)
      await refresh()
      navigate('/my-bookings')
    } catch {
      // The request toast already reported the error.
    }
  }

  return (
    <AuthShell title="Guest sign in" lede="Use the email on your reservation.">
      <form className="form" onSubmit={submit}>
        <Field label="Email" name="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <Field label="Password" type="password" name="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <Btn className="btn" type="submit" label="Sign in" />
      </form>
      <p className="demo">Sample guest: lina.moreau@example.com / Guest#2026</p>
      <p><Link to="/register">Create an account</Link> · <Link to="/forgot-password">Forgot password</Link></p>
    </AuthShell>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { refresh } = useGuest()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    try {
      const result = await api('/auth/register', { method: 'POST', body: form })
      setToken('guest', result.data.token)
      await refresh()
      navigate('/my-bookings')
    } catch {
      // The request toast already reported the error.
    }
  }

  return (
    <AuthShell title="Create a guest account" lede="An account is optional. You can still book without one.">
      <form className="form" onSubmit={submit}>
        <Field label="Name" name="name" required value={form.name} onChange={set('name')} />
        <Field label="Email" name="email" required value={form.email} onChange={set('email')} />
        <Field label="Phone" name="phone" value={form.phone} onChange={set('phone')} />
        <Field label="Password" type="password" name="password" required minLength={8} value={form.password} onChange={set('password')} />
        <Btn className="btn" type="submit" label="Create account" />
      </form>
    </AuthShell>
  )
}

export function ForgotPage() {
  const [email, setEmail] = useState('')
  const [token, setReset] = useState('')
  const [password, setPassword] = useState('')

  const requestCode = async (event) => {
    event.preventDefault()
    try {
      const result = await api('/auth/forgot-password', { method: 'POST', body: { email } })
      if (result.data.resetToken) setReset(result.data.resetToken)
    } catch {
      // The request toast already reported the error.
    }
  }

  const reset = async (event) => {
    event.preventDefault()
    try {
      await api('/auth/reset-password', { method: 'POST', body: { email, token, password } })
    } catch {
      // The request toast already reported the error.
    }
  }

  return (
    <AuthShell title="Reset a password" lede="In this local demo the reset code is shown here instead of being emailed.">
      <form className="form" onSubmit={requestCode}>
        <Field label="Email" name="resetEmail" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Btn className="btn light" type="submit" label="Request code" />
      </form>
      <form className="form" onSubmit={reset}>
        <Field label="Reset code" name="resetCode" value={token} onChange={(event) => setReset(event.target.value)} />
        <Field label="New password" type="password" name="newPassword" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
        <Btn className="btn" type="submit" label="Update password" />
      </form>
    </AuthShell>
  )
}

export function MyBookingsPage() {
  const { guest, refresh } = useGuest()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [services, setServices] = useState([])

  const load = () => {
    api('/me/bookings', { auth: 'guest' }).then((result) => setBookings(result.data)).catch(() => setBookings([]))
    api('/services').then((result) => setServices(result.data)).catch(() => setServices([]))
  }

  useEffect(() => {
    if (guest) load()
  }, [guest])

  if (!guest) {
    return (
      <AuthShell title="Your stays" lede="Sign in to see reservations linked to your account.">
        <Link className="btn" to="/login">Sign in</Link>
      </AuthShell>
    )
  }

  const logout = () => {
    setToken('guest', null)
    refresh()
    navigate('/')
  }

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <p className="kicker" style={{ color: '#9c7b45' }}>Guest</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>{guest.guest.name}</h1>
          <p>{guest.guest.email}</p>
        </div>
        <Btn className="btn light" label="Sign out" onClick={logout} />
      </div>
      <div className="stack">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} services={services} onChange={load} />
        ))}
        {bookings.length === 0 && <p>No stays yet.</p>}
      </div>
    </section>
  )
}

function BookingCard({ booking, services, onChange }) {
  const [request, setRequest] = useState({ serviceType: 'Airport car', details: '' })
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' })

  const cancel = async () => {
    try {
      await api(`/me/bookings/${booking.id}/cancel`, { method: 'POST', auth: 'guest', body: { reason: 'Guest cancellation' }, notify: 'error' })
      toast.success(`${booking.reference} was cancelled.`)
      onChange()
    } catch {
      // The request toast already reported the error.
    }
  }

  const sendRequest = async (event) => {
    event.preventDefault()
    try {
      await api(`/me/bookings/${booking.id}/service-requests`, { method: 'POST', auth: 'guest', body: request, notify: 'error' })
      setRequest((current) => ({ ...current, details: '' }))
      toast.success('Request sent to the hotel.')
      onChange()
    } catch {
      // The request toast already reported the error.
    }
  }

  const sendReview = async (event) => {
    event.preventDefault()
    try {
      await api(`/me/bookings/${booking.id}/reviews`, { method: 'POST', auth: 'guest', body: review, notify: 'error' })
      toast.success('Review submitted for moderation.')
      onChange()
    } catch {
      // The request toast already reported the error.
    }
  }

  return (
    <article className="note">
      <div className="meta">
        <h3>{booking.reference}</h3>
        <span>{booking.status}</span>
      </div>
      <p>{prettyDate(booking.checkIn)} – {prettyDate(booking.checkOut)} · {booking.lines[0]?.roomType} · {booking.lines[0]?.ratePlan}</p>
      <p>{booking.rooms} room · {booking.adults} adults · {booking.children} children</p>
      <p>Room {money(booking.subtotal, booking.currency)} · Discount {money(booking.discount, booking.currency)} · Fees {money(booking.serviceFee + booking.tax, booking.currency)} · Total {money(booking.total, booking.currency)}</p>
      <p>Payment {booking.payments.map((payment) => `${payment.method} ${payment.status} ${money(payment.amount, payment.currency)}`).join(', ')}</p>
      {booking.lines[0]?.nights?.length > 0 && <p>Nightly {booking.lines[0].nights.map((night) => `${prettyDate(night.date)} ${money(night.rate, booking.currency)}`).join(' · ')}</p>}
      {['PENDING', 'CONFIRMED'].includes(booking.status) && <Btn className="btn light" label="Cancel reservation" onClick={cancel} />}
      {['CONFIRMED', 'CHECKED_IN'].includes(booking.status) && (
        <form className="form" onSubmit={sendRequest}>
          <label>Request
            <select value={request.serviceType} onChange={(event) => setRequest({ ...request, serviceType: event.target.value })}>
              {services.map((service) => <option key={service.id}>{service.name}</option>)}
              <option>Change of dates</option>
            </select>
          </label>
          <Field label="Note" name="requestNote" required value={request.details} onChange={(event) => setRequest({ ...request, details: event.target.value })} />
          <Btn className="btn light" type="submit" label="Send request" />
        </form>
      )}
      {booking.status === 'CHECKED_OUT' && (
        <form className="form" onSubmit={sendReview}>
          <label>Rating
            <select value={review.rating} onChange={(event) => setReview({ ...review, rating: Number(event.target.value) })}>
              {[5, 4, 3, 2, 1].map((score) => <option key={score} value={score}>{score}</option>)}
            </select>
          </label>
          <Field label="Title" name="reviewTitle" value={review.title} onChange={(event) => setReview({ ...review, title: event.target.value })} />
          <Field label="Comment" type="textarea" name="reviewComment" required value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} />
          <Btn className="btn light" type="submit" label="Submit review" />
        </form>
      )}
    </article>
  )
}
