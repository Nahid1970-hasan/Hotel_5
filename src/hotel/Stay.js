import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { shift } from '@floating-ui/react'
import DatePicker from 'react-datepicker'
import { toast } from 'react-toastify'
import 'react-datepicker/dist/react-datepicker.css'

const popperModifiers = [shift({ padding: 12 })]
import { addDays, api, money, nightCount, prettyDate } from './api'
import { Btn, Field } from './admin/ui'
import { PageIntro, useGuest } from './PublicLayout'

function isoToDate(iso) {
  if (!iso) return null
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function dateToIso(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const DateTrigger = forwardRef(function DateTrigger({ value, onClick, id, ...rest }, ref) {
  const empty = !value
  return (
    <button
      {...rest}
      id={id}
      ref={ref}
      type="button"
      className={empty ? 'date-trigger is-empty' : 'date-trigger'}
      onClick={onClick}
      aria-haspopup="dialog"
    >
      {empty ? 'Add date' : value}
    </button>
  )
})

function StayRangeNote({ checkIn, checkOut }) {
  return (
    <div className="stay-cal-foot">
      <span>{!checkIn ? 'Select check-in' : !checkOut ? 'Select check-out' : `${prettyDate(checkIn)} – ${prettyDate(checkOut)}`}</span>
      {checkIn && checkOut ? <span>{nightCount(checkIn, checkOut)} nights</span> : null}
    </div>
  )
}

export function SearchForm({ hotel, values }) {
  const navigate = useNavigate()
  const checkInRef = useRef(null)
  const checkOutRef = useRef(null)
  const [openField, setOpenField] = useState(null)
  const [form, setForm] = useState({
    checkIn: values?.checkIn || '',
    checkOut: values?.checkOut || '',
    adults: values?.adults || '2',
    children: values?.children || '0',
    rooms: values?.rooms || '1',
  })
  const today = hotel?.today || dateToIso(new Date())
  const todayDate = isoToDate(today)
  const checkInDate = isoToDate(form.checkIn)
  const checkOutDate = isoToDate(form.checkOut)

  useEffect(() => {
    if (!hotel?.today || form.checkIn) return
    setForm((current) => ({ ...current, checkIn: hotel.today, checkOut: addDays(hotel.today, 2) }))
  }, [hotel, form.checkIn])

  useEffect(() => {
    if (!values?.checkIn) return
    setForm({
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      adults: values.adults || '2',
      children: values.children || '0',
      rooms: values.rooms || '1',
    })
  }, [values?.checkIn, values?.checkOut, values?.adults, values?.children, values?.rooms])

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const pickCheckIn = (date) => {
    if (!date) return
    const iso = dateToIso(date)
    const keepOut = Boolean(form.checkOut && form.checkOut > iso)
    setForm((current) => ({
      ...current,
      checkIn: iso,
      checkOut: keepOut ? current.checkOut : '',
    }))
    if (!keepOut) window.setTimeout(() => checkOutRef.current?.setOpen(true), 0)
  }

  const pickCheckOut = (date) => {
    if (!date) return
    setForm((current) => ({ ...current, checkOut: dateToIso(date) }))
  }

  const submit = (event) => {
    event.preventDefault()
    if (!form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) {
      const field = form.checkIn ? checkOutRef : checkInRef
      field.current?.setOpen(true)
      return
    }
    const params = new URLSearchParams(form)
    navigate(`/availability?${params.toString()}`)
  }

  return (
    <form className="search" onSubmit={submit}>
      <div className={openField === 'checkIn' ? 'date-field is-open' : 'date-field'}>
        <label htmlFor="stay-check-in">Check in</label>
        <DatePicker
          id="stay-check-in"
          ref={checkInRef}
          selected={checkInDate}
          onChange={pickCheckIn}
          selectsStart
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={todayDate}
          openToDate={checkInDate || todayDate}
          monthsShown={1}
          dateFormat="d MMM yyyy"
          calendarStartDay={0}
          showPopperArrow={false}
          popperPlacement="bottom-start"
          popperModifiers={popperModifiers}
          calendarClassName="stay-cal"
          popperClassName="stay-cal-popper"
          customInput={<DateTrigger />}
          onCalendarOpen={() => setOpenField('checkIn')}
          onCalendarClose={() => setOpenField((current) => (current === 'checkIn' ? null : current))}
        >
          <StayRangeNote checkIn={form.checkIn} checkOut={form.checkOut} />
        </DatePicker>
      </div>
      <div className={openField === 'checkOut' ? 'date-field date-field-out is-open' : 'date-field date-field-out'}>
        <label htmlFor="stay-check-out">Check out</label>
        <DatePicker
          id="stay-check-out"
          ref={checkOutRef}
          selected={checkOutDate}
          onChange={pickCheckOut}
          selectsEnd
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={form.checkIn ? isoToDate(addDays(form.checkIn, 1)) : todayDate}
          openToDate={checkOutDate || checkInDate || todayDate}
          monthsShown={1}
          dateFormat="d MMM yyyy"
          calendarStartDay={0}
          showPopperArrow={false}
          popperPlacement="bottom-end"
          popperModifiers={popperModifiers}
          calendarClassName="stay-cal"
          popperClassName="stay-cal-popper"
          customInput={<DateTrigger />}
          onCalendarOpen={() => setOpenField('checkOut')}
          onCalendarClose={() => setOpenField((current) => (current === 'checkOut' ? null : current))}
        >
          <StayRangeNote checkIn={form.checkIn} checkOut={form.checkOut} />
        </DatePicker>
      </div>
      <Field label="Adults" type="number" name="adults" required value={form.adults} onChange={set('adults')} />
      <Field label="Children" type="number" name="children" value={form.children} onChange={set('children')} />
      <Field label="Rooms" type="number" name="rooms" required value={form.rooms} onChange={set('rooms')} />
      <Btn className="btn" type="submit" label="Check availability" />
    </form>
  )
}

export function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [stories, setStories] = useState([])
  const [error, setError] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [sleeps, setSleeps] = useState(1)

  useEffect(() => {
    api('/room-types').then((result) => setRooms(result.data)).catch((err) => setError(err.message))
    api('/public-portal/rooms-and-suites').then((result) => setStories(result.data)).catch(() => setStories([]))
  }, [])

  const categories = ['All', ...new Set(rooms.map((room) => room.category))]
  const visible = rooms
    .filter((room) => category === 'All' || room.category === category)
    .filter((room) => room.capacityAdults >= Number(sleeps))
    .sort((a, b) => {
      if (sort === 'price') return a.basePrice - b.basePrice
      if (sort === 'size') return b.sizeSqm - a.sizeSqm
      return a.sortOrder - b.sortOrder
    })

  return (
    <>
      <PageIntro kicker="Rooms & Suites" title="Choose the room, then the dates." lede="Prices shown here are starting rates. The stay total, tax, and service charge are calculated when you check dates." />
      <section className="section">
        <div className="filters">
          {categories.map((item) => (
            <button key={item} type="button" className={item === category ? 'chip on' : 'chip'} onClick={() => setCategory(item)}>{item}</button>
          ))}
          <label className="chip">Sleeps
            <select value={sleeps} onChange={(event) => setSleeps(event.target.value)} aria-label="Minimum adults">
              {[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count}+</option>)}
            </select>
          </label>
          <label className="chip">Sort
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort rooms">
              <option value="featured">Featured</option>
              <option value="price">Price</option>
              <option value="size">Size</option>
            </select>
          </label>
        </div>
        {stories.length > 0 && (
          <div className="stack" style={{ marginBottom: 22 }}>
            {stories.map((story) => (
              <article className="plain-card" key={story.id}>
                {story.imageUrl && <img src={story.imageUrl} alt="" style={{ height: 180, width: '100%', objectFit: 'cover' }} />}
                <div>
                  {story.category && <p className="kicker" style={{ color: '#9c7b45' }}>{story.category}</p>}
                  <h3>{story.title}</h3>
                  <p>{story.summary}</p>
                  {story.priceLabel && <p>{story.priceLabel}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="cards">
          {visible.map((room) => (
            <Link className="room-card" key={room.id} to={`/rooms/${room.slug}`}>
              <img src={room.images[0]?.url} alt={room.images[0]?.alt || room.name} />
              <div>
                <div className="meta"><h3>{room.name}</h3><span className="price">From {money(room.basePrice, room.currency)}</span></div>
                <p>{room.summary}</p>
                <p>{room.view} · {room.bedConfig} · {room.sizeSqm} m² · Up to {room.capacityAdults} adults</p>
              </div>
            </Link>
          ))}
        </div>
        {visible.length === 0 && !error && <p>No rooms match those filters.</p>}
      </section>
    </>
  )
}

export function RoomDetailPage() {
  const { slug } = useParams()
  const { hotel } = useGuest()
  const [room, setRoom] = useState(null)
  const [photo, setPhoto] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/room-types/${slug}`).then((result) => { setRoom(result.data); setPhoto(0) }).catch((err) => setError(err.message))
  }, [slug])

  if (error) return <section className="section"><p>This room could not be opened.</p></section>
  if (!room) return <section className="section"><p>Loading room…</p></section>
  const image = room.images[photo] || room.images[0]

  return (
    <section className="section">
      <p className="kicker" style={{ color: '#9c7b45' }}>{room.category}</p>
      <div className="detail">
        <div>
          <img className="gallery-main" src={image?.url} alt={image?.alt || room.name} />
          <div className="thumbs">
            {room.images.map((item, index) => (
              <button key={item.url} type="button" className={index === photo ? 'on' : undefined} onClick={() => setPhoto(index)}>
                <img src={item.url} alt={item.alt || ''} />
              </button>
            ))}
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)', marginTop: 18 }}>{room.name}</h1>
          <p>{room.description}</p>
          <ul className="amenity-list">{room.amenities.map((item) => <li key={item}>{item}</li>)}</ul>
          <p>{room.accessibility}</p>
        </div>
        <aside className="plain-card">
          <div>
            <p className="price">From {money(room.basePrice, room.currency)} / night</p>
            <p>{room.bedConfig} · {room.sizeSqm} m² · {room.view}</p>
            <p>Up to {room.capacityAdults} adults and {room.capacityChildren} children.</p>
            <p>Check-in {hotel?.checkInTime || '15:00'} · Check-out {hotel?.checkOutTime || '12:00'}</p>
            <Link className="btn" to={`/availability?adults=${room.capacityAdults > 2 ? 2 : room.capacityAdults}&children=0&rooms=1`}>Check dates</Link>
          </div>
        </aside>
      </div>
    </section>
  )
}

export function AvailabilityPage() {
  const { hotel } = useGuest()
  const [params] = useSearchParams()
  const values = {
    checkIn: params.get('checkIn') || '',
    checkOut: params.get('checkOut') || '',
    adults: params.get('adults') || '2',
    children: params.get('children') || '0',
    rooms: params.get('rooms') || '1',
  }
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!values.checkIn || !values.checkOut) return undefined
    setLoading(true)
    setError('')
    const query = new URLSearchParams(values).toString()
    api(`/availability?${query}`)
      .then((response) => setResult(response.data))
      .catch((err) => { setResult(null); setError(err.message) })
      .finally(() => setLoading(false))
    return undefined
  }, [values.checkIn, values.checkOut, values.adults, values.children, values.rooms])

  return (
    <>
      <PageIntro kicker="Availability" title="Dates first, then the rate." lede="Totals include the configured service charge and tax. A displayed starting price is not the final price." />
      <SearchForm hotel={hotel} values={values} />
      <section className="section">
        {loading && <p>Checking the books…</p>}
        {result && <p>{prettyDate(result.checkIn)} to {prettyDate(result.checkOut)} · {result.nights} nights · {result.adults} adults · {result.children} children · {result.rooms} room{Number(result.rooms) > 1 ? 's' : ''}</p>}
        <div className="stack">
          {result?.roomTypes?.map((room) => (
            <article className="plain-card" key={room.id}>
              <div className="detail">
                <div>
                  <img src={room.images[0]?.url} alt={room.images[0]?.alt || room.name} style={{ height: 180, width: '100%', objectFit: 'cover', borderRadius: 12 }} />
                  <h3 style={{ marginTop: 10 }}>{room.name}</h3>
                  <p>{room.availableQuantity} available · {room.bedConfig} · {room.view}</p>
                </div>
                <div>
                  {room.ratePlans.map((plan) => {
                    const next = new URLSearchParams({ ...values, room: room.slug, rate: String(plan.id) })
                    return (
                      <div className="rate" key={plan.id}>
                        <header>
                          <strong>{plan.name}</strong>
                          <span>{money(plan.total, plan.currency)}</span>
                        </header>
                        <p>{plan.mealPlan}</p>
                        <p>{plan.cancellationPolicy}</p>
                        <p>{plan.nightlyPrices.map((price) => money(price, plan.currency)).join(' · ')}</p>
                        <Link className="btn" to={`/book?${next.toString()}`}>Continue</Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            </article>
          ))}
          {result && result.roomTypes.length === 0 && <p className="note">Nothing is open for that stay. Try fewer rooms or different dates.</p>}
        </div>
      </section>
    </>
  )
}

export function BookPage() {
  const { guest, hotel } = useGuest()
  const [params] = useSearchParams()
  const [quote, setQuote] = useState(null)
  const [promo, setPromo] = useState(params.get('promo') || '')
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
    method: 'pay_at_hotel',
  })

  const checkIn = params.get('checkIn') || ''
  const checkOut = params.get('checkOut') || ''
  const adults = params.get('adults') || '2'
  const children = params.get('children') || '0'
  const rooms = params.get('rooms') || '1'
  const roomSlug = params.get('room') || ''
  const rateId = params.get('rate') || ''
  const stay = useMemo(() => ({
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    room: roomSlug,
    rate: rateId,
  }), [checkIn, checkOut, adults, children, rooms, roomSlug, rateId])

  useEffect(() => {
    if (!guest) return
    setForm((current) => ({
      ...current,
      name: current.name || guest.guest.name,
      email: current.email || guest.guest.email,
      phone: current.phone || guest.guest.phone || '',
    }))
  }, [guest])

  useEffect(() => {
    if (!stay.checkIn || !stay.room) return undefined
    const query = new URLSearchParams({
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      adults: stay.adults,
      children: stay.children,
      rooms: stay.rooms,
      ...(promo ? { promo } : {}),
    })
    api(`/availability?${query}`)
      .then((result) => {
        const room = result.data.roomTypes.find((item) => item.slug === stay.room)
        const plan = room?.ratePlans?.find((item) => String(item.id) === String(stay.rate))
        setQuote(room && plan ? { room, plan, search: result.data } : null)
        if (!room || !plan) {
          setError('unavailable')
          toast.error('That room is no longer available for these dates.')
        } else setError('')
      })
      .catch(() => setError('unavailable'))
    return undefined
  }, [stay, promo])

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!quote) return
    setSaving(true)
    setError('')
    try {
      const result = await api('/bookings', {
        method: 'POST',
        auth: tokenExists(),
        headers: { 'Idempotency-Key': idempotency() },
        body: {
          roomTypeId: quote.room.id,
          ratePlanId: quote.plan.id,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          adults: Number(stay.adults),
          children: Number(stay.children),
          rooms: Number(stay.rooms),
          method: form.method,
          promoCode: promo || undefined,
          specialRequests: form.specialRequests,
          guest: { name: form.name, email: form.email, phone: form.phone },
        },
      })
      setBooking(result.data)
    } catch {
      // The request toast already reported the error.
    } finally {
      setSaving(false)
    }
  }

  const confirmPayment = async () => {
    const payment = booking.payments.find((item) => item.status === 'PENDING')
    setSaving(true)
    try {
      const result = await api('/payments/confirm', { method: 'POST', body: { paymentId: payment.id } })
      setBooking(result.data)
    } catch {
      // The request toast already reported the error.
    } finally {
      setSaving(false)
    }
  }

  if (booking) {
    const pending = booking.status === 'PENDING'
    return (
      <section className="section">
        <p className="kicker" style={{ color: '#9c7b45' }}>{pending ? 'Payment' : 'Confirmed'}</p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>{pending ? 'Confirm the payment on the server.' : 'Your stay is confirmed.'}</h1>
        <div className="note">
          <p><strong style={{ color: '#1c2622' }}>{booking.reference}</strong></p>
          <p>{prettyDate(booking.checkIn)} to {prettyDate(booking.checkOut)} · {booking.lines[0]?.roomType} · {booking.lines[0]?.ratePlan}</p>
          <p>Total {money(booking.total, booking.currency)} · {booking.status}</p>
          <p>A confirmation record is stored for {booking.guest.email}. Card numbers are not collected or stored.</p>
        </div>
        {pending && <Btn className="btn" label="Complete secure payment" onClick={confirmPayment} disabled={saving} />}
        <p><Link to="/my-bookings">View your stays</Link></p>
      </section>
    )
  }

  return (
    <section className="section">
      <p className="kicker" style={{ color: '#9c7b45' }}>Reservation</p>
      <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>Review the stay before it is held.</h1>
      {!quote && !error && <p>Preparing the quote…</p>}
      {quote && (
        <div className="detail">
          <form className="form" onSubmit={submit}>
            <Field label="Full name" name="guestName" required value={form.name} onChange={set('name')} />
            <Field label="Email" name="guestEmail" required value={form.email} onChange={set('email')} />
            <Field label="Phone" name="guestPhone" value={form.phone} onChange={set('phone')} />
            <Field label="Promotion code" name="promo" value={promo} onChange={(event) => setPromo(event.target.value.toUpperCase())} placeholder="CORAL10 or STAY4" />
            <Field className="wide" label="Requests" type="textarea" name="specialRequests" value={form.specialRequests} onChange={set('specialRequests')} placeholder="Airport car, cot, celebration" />
            <fieldset className="wide">
              <legend>Guarantee</legend>
              <label><input type="radio" name="method" value="pay_at_hotel" checked={form.method === 'pay_at_hotel'} onChange={set('method')} /> Pay at the hotel. The room is confirmed now and settled on arrival.</label>
              <label><input type="radio" name="method" value="card" checked={form.method === 'card'} onChange={set('method')} /> Pay now. The room is held until the server verifies payment. No card number is entered here.</label>
            </fieldset>
            <Btn className="btn" type="submit" disabled={saving} label={saving ? 'Saving…' : 'Confirm reservation'} />
          </form>
          <aside className="plain-card">
            <div className="breakdown">
              <h3>{quote.room.name}</h3>
              <p>{quote.plan.name} · {quote.plan.mealPlan}</p>
              <p>{prettyDate(stay.checkIn)} – {prettyDate(stay.checkOut)} · {nightCount(stay.checkIn, stay.checkOut)} nights</p>
              <div><span>Room</span><strong>{money(quote.plan.subtotal, quote.plan.currency)}</strong></div>
              <div><span>Discount</span><strong>-{money(quote.plan.discount, quote.plan.currency)}</strong></div>
              <div><span>Service {hotel?.serviceFeePercent}%</span><strong>{money(quote.plan.serviceFee, quote.plan.currency)}</strong></div>
              <div><span>Tax {hotel?.taxPercent}%</span><strong>{money(quote.plan.tax, quote.plan.currency)}</strong></div>
              <div><span>Total</span><strong>{money(quote.plan.total, quote.plan.currency)}</strong></div>
              <p>{quote.plan.cancellationPolicy}</p>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}

function tokenExists() {
  return localStorage.getItem('gh_guest_token') ? 'guest' : undefined
}

function idempotency() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `web-${Date.now()}`
}
