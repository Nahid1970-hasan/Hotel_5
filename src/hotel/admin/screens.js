import { useEffect, useState } from 'react'
import Card from '../../components/Card'
import { Flex } from '../../components/Flex'
import InfoCard from '../../components/InfoCard'
import { money, prettyDate } from '../api'
import { useAdmin } from './AdminShell'

function useData(loader, deps) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const reload = () => {
    setLoading(true)
    setError('')
    loader()
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    reload()
  }, deps)
  return { data, error, loading, reload, setError }
}

function Badge({ value }) {
  return <span className="badge" data-status={value}>{value}</span>
}

function Table({ columns, rows }) {
  if (!rows?.length) return <p>Nothing to show.</p>
  return (
    <div className="admin-table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id || row.reference}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Page({ title, lede, children }) {
  return (
    <div className="hotel-admin">
      <div className="admin-head">
        <div>
          <h1>{title}</h1>
          {lede && <p>{lede}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function DashboardPage() {
  const { call } = useAdmin()
  const board = useData(() => call('/admin/dashboard'), [])
  const bookings = useData(() => call('/admin/bookings'), [])
  const today = board.data?.today
  const arrivals = (bookings.data || []).filter((item) => item.checkIn === today && ['CONFIRMED', 'CHECKED_IN'].includes(item.status))
  const departures = (bookings.data || []).filter((item) => item.checkOut === today && item.status === 'CHECKED_IN')
  const kpis = board.data ? [
    ['Arrivals', board.data.arrivals, 'Expected today'],
    ['Departures', board.data.departures, 'Leaving today'],
    ['In house', board.data.inHouse, 'Checked in'],
    ['Occupancy', `${board.data.occupancy}%`, 'In-house rooms'],
    ['Ready', board.data.rooms.ready, 'Can be assigned'],
    ['Out of service', board.data.rooms.outOfService, 'Blocked rooms'],
    ['Pending holds', board.data.pending, 'Awaiting payment'],
    ['Month revenue', board.data.monthRevenue == null ? '—' : money(board.data.monthRevenue, board.data.currency), 'Collected less refunds'],
  ] : []

  return (
    <Page title="Dashboard" lede={today ? `Hotel date ${prettyDate(today)}` : 'Loading the day'}>
      {board.error && <p className="alert">{board.error}</p>}
      <Flex row>
        {kpis.map(([label, value, note]) => (
          <Flex key={label} md={3} xs={12}>
            <InfoCard title label={label} bodyClassName="kpi-body">
              <strong>{value}</strong>
              <span>{note}</span>
            </InfoCard>
          </Flex>
        ))}
      </Flex>
      <div className="admin-grid">
        <Card title="Arrivals" subTitle="Confirmed guests for today">
          <BookingList rows={arrivals} onChanged={bookings.reload} />
        </Card>
        <Card title="Departures" subTitle="Guests due to leave">
          <BookingList rows={departures} onChanged={bookings.reload} />
        </Card>
      </div>
      {board.data && (
        <p>Alerts: {board.data.alerts.unpaidInHouse} unpaid in-house · {board.data.alerts.openMaintenance} open faults · {board.data.alerts.pendingReviews} reviews waiting · {board.data.alerts.newMessages} new messages.</p>
      )}
    </Page>
  )
}

export function ArrivalsPage() {
  const { call } = useAdmin()
  const board = useData(() => call('/admin/dashboard'), [])
  const bookings = useData(() => call('/admin/bookings'), [])
  const today = board.data?.today
  const rows = (bookings.data || []).filter((item) => item.checkIn === today || item.checkOut === today)
  return (
    <Page title="Arrivals" lede="Today's arrivals and departures.">
      {bookings.error && <p className="alert">{bookings.error}</p>}
      <Card title="Front desk" subTitle={today ? prettyDate(today) : ''}>
        <BookingList rows={rows} onChanged={bookings.reload} />
      </Card>
    </Page>
  )
}

function BookingList({ rows, onChanged }) {
  const { call } = useAdmin()
  const [error, setError] = useState('')
  const act = async (path) => {
    setError('')
    try {
      await call(path, { method: 'POST', body: {} })
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <>
      {error && <p className="alert">{error}</p>}
      <Table
        rows={rows}
        columns={[
          { key: 'reference', label: 'Reference' },
          { key: 'guest', label: 'Guest', render: (row) => row.guest.name },
          { key: 'stay', label: 'Stay', render: (row) => `${prettyDate(row.checkIn)} – ${prettyDate(row.checkOut)}` },
          { key: 'room', label: 'Room', render: (row) => `${row.lines[0]?.roomType || ''} ${row.lines.map((line) => line.roomNumber).filter(Boolean).join(', ')}` },
          { key: 'total', label: 'Total', render: (row) => money(row.total, row.currency) },
          { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="row-actions">
                {row.status === 'CONFIRMED' && <button className="ha-btn" type="button" onClick={() => act(`/admin/bookings/${row.id}/check-in`)}>Check in</button>}
                {row.status === 'CHECKED_IN' && <button className="ha-btn" type="button" onClick={() => act(`/admin/bookings/${row.id}/check-out`)}>Check out</button>}
                {['CONFIRMED', 'PENDING'].includes(row.status) && <button className="ha-btn-line" type="button" onClick={() => act(`/admin/bookings/${row.id}/cancel`)}>Cancel</button>}
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

export function ReservationsPage() {
  const { call } = useAdmin()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const bookings = useData(() => call(`/admin/bookings?q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`), [query, status])
  const types = useData(() => call('/admin/room-types'), [])
  const rates = useData(() => call('/admin/rates'), [])
  const [form, setForm] = useState({ guestName: '', guestEmail: '', guestPhone: '', roomTypeId: '', ratePlanId: '', checkIn: '', checkOut: '', adults: 2, children: 0, rooms: 1, source: 'walk-in' })
  const [message, setMessage] = useState('')

  const create = async (event) => {
    event.preventDefault()
    setMessage('')
    try {
      const result = await call('/admin/bookings', {
        method: 'POST',
        body: {
          roomTypeId: Number(form.roomTypeId),
          ratePlanId: Number(form.ratePlanId),
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          adults: Number(form.adults),
          children: Number(form.children),
          rooms: Number(form.rooms),
          source: form.source,
          method: 'pay_at_hotel',
          guest: { name: form.guestName, email: form.guestEmail, phone: form.guestPhone },
        },
      })
      setMessage(`${result.data.reference} created.`)
      bookings.reload()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <Page title="Reservations" lede="Search the book, or take a walk-in.">
      <div className="admin-head-actions" style={{ marginBottom: 12 }}>
        <input placeholder="Reference, name, or email" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search reservations" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {bookings.error && <p className="alert">{bookings.error}</p>}
      {message && <p className="ok-note">{message}</p>}
      <Card title="Book" subTitle="Price is calculated on the server">
        <form className="ha-form" onSubmit={create}>
          <label>Guest<input required value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} /></label>
          <label>Email<input type="email" required value={form.guestEmail} onChange={(event) => setForm({ ...form, guestEmail: event.target.value })} /></label>
          <label>Phone<input value={form.guestPhone} onChange={(event) => setForm({ ...form, guestPhone: event.target.value })} /></label>
          <label>Source
            <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
              <option value="walk-in">Walk-in</option>
              <option value="phone">Phone</option>
            </select>
          </label>
          <label>Room type
            <select required value={form.roomTypeId} onChange={(event) => setForm({ ...form, roomTypeId: event.target.value })}>
              <option value="">Choose</option>
              {(types.data || []).map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
            </select>
          </label>
          <label>Rate
            <select required value={form.ratePlanId} onChange={(event) => setForm({ ...form, ratePlanId: event.target.value })}>
              <option value="">Choose</option>
              {(rates.data?.plans || []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
            </select>
          </label>
          <label>Check in<input type="date" required value={form.checkIn} onChange={(event) => setForm({ ...form, checkIn: event.target.value })} /></label>
          <label>Check out<input type="date" required value={form.checkOut} onChange={(event) => setForm({ ...form, checkOut: event.target.value })} /></label>
          <label>Adults<input type="number" min="1" value={form.adults} onChange={(event) => setForm({ ...form, adults: event.target.value })} /></label>
          <label>Rooms<input type="number" min="1" max="5" value={form.rooms} onChange={(event) => setForm({ ...form, rooms: event.target.value })} /></label>
          <div className="span-2"><button className="ha-btn" type="submit">Create reservation</button></div>
        </form>
      </Card>
      <Card title="All reservations">
        <BookingList rows={bookings.data || []} onChanged={bookings.reload} />
      </Card>
    </Page>
  )
}

export function GuestsPage() {
  const { call } = useAdmin()
  const [query, setQuery] = useState('')
  const guests = useData(() => call(`/admin/guests?q=${encodeURIComponent(query)}`), [query])
  return (
    <Page title="Guests" lede="Profiles created from reservations and accounts.">
      <input placeholder="Search name or email" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search guests" />
      {guests.error && <p className="alert">{guests.error}</p>}
      <Card title="Guest book">
        <Table
          rows={guests.data || []}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'nationality', label: 'Nationality' },
            { key: 'stays', label: 'Stays' },
          ]}
        />
      </Card>
    </Page>
  )
}

export function RoomTypesPage() {
  const { call } = useAdmin()
  const rooms = useData(() => call('/admin/room-types'), [])
  const [form, setForm] = useState({ name: '', basePrice: '', capacityAdults: 2, capacityChildren: 0, bedConfig: '1 king', sizeSqm: 30, view: 'Ocean', category: 'Room', summary: '' })
  const [error, setError] = useState('')

  const create = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await call('/admin/room-types', { method: 'POST', body: { ...form, basePrice: Number(form.basePrice) } })
      rooms.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggle = async (room) => {
    await call(`/admin/room-types/${room.id}`, { method: 'PATCH', body: { active: !room.active } })
    rooms.reload()
  }

  return (
    <Page title="Room types" lede="What guests can book. Physical rooms sit underneath.">
      {error && <p className="alert">{error}</p>}
      <Card title="Add a room type">
        <form className="ha-form" onSubmit={create}>
          <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Nightly price<input required type="number" min="1" step="0.01" value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} /></label>
          <label>Adults<input type="number" min="1" value={form.capacityAdults} onChange={(event) => setForm({ ...form, capacityAdults: Number(event.target.value) })} /></label>
          <label>Children<input type="number" min="0" value={form.capacityChildren} onChange={(event) => setForm({ ...form, capacityChildren: Number(event.target.value) })} /></label>
          <label>Beds<input value={form.bedConfig} onChange={(event) => setForm({ ...form, bedConfig: event.target.value })} /></label>
          <label>Size m²<input type="number" value={form.sizeSqm} onChange={(event) => setForm({ ...form, sizeSqm: Number(event.target.value) })} /></label>
          <label className="span-2">Summary<input value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></label>
          <div><button className="ha-btn" type="submit">Save room type</button></div>
        </form>
      </Card>
      <Card title="Catalogue">
        <Table
          rows={rooms.data || []}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'occupancy', label: 'Occupancy', render: (row) => `${row.capacityAdults}+${row.capacityChildren}` },
            { key: 'price', label: 'From', render: (row) => money(row.basePrice, row.currency) },
            { key: 'active', label: 'Shown', render: (row) => (row.active ? 'Yes' : 'No') },
            { key: 'toggle', label: '', render: (row) => <button className="ha-btn-line" type="button" onClick={() => toggle(row)}>{row.active ? 'Hide' : 'Show'}</button> },
          ]}
        />
      </Card>
    </Page>
  )
}

export function RoomsPage() {
  const { call } = useAdmin()
  const rooms = useData(() => call('/admin/rooms'), [])
  const types = useData(() => call('/admin/room-types'), [])
  const [form, setForm] = useState({ roomNumber: '', roomTypeId: '', floor: '', wing: 'Main' })
  const [error, setError] = useState('')
  const statuses = ['READY', 'DIRTY', 'CLEANING', 'INSPECTING', 'OUT_OF_SERVICE']

  const create = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await call('/admin/rooms', { method: 'POST', body: { ...form, roomTypeId: Number(form.roomTypeId) } })
      rooms.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const updateStatus = async (room, operationalStatus) => {
    await call(`/admin/rooms/${room.id}`, { method: 'PATCH', body: { operationalStatus } })
    rooms.reload()
  }

  return (
    <Page title="Physical rooms" lede="Housekeeping status is separate from who is sleeping in the room.">
      {error && <p className="alert">{error}</p>}
      <Card title="Add a room">
        <form className="ha-form" onSubmit={create}>
          <label>Number<input required value={form.roomNumber} onChange={(event) => setForm({ ...form, roomNumber: event.target.value })} /></label>
          <label>Type
            <select required value={form.roomTypeId} onChange={(event) => setForm({ ...form, roomTypeId: event.target.value })}>
              <option value="">Choose</option>
              {(types.data || []).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
          <label>Floor<input value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} /></label>
          <label>Wing<input value={form.wing} onChange={(event) => setForm({ ...form, wing: event.target.value })} /></label>
          <div><button className="ha-btn" type="submit">Add room</button></div>
        </form>
      </Card>
      <Card title="Inventory of keys">
        <Table
          rows={rooms.data || []}
          columns={[
            { key: 'room_number', label: 'Room' },
            { key: 'room_type_name', label: 'Type' },
            { key: 'floor', label: 'Floor' },
            { key: 'status', label: 'Status', render: (row) => <Badge value={row.operational_status} /> },
            {
              key: 'change',
              label: 'Set',
              render: (row) => (
                <select value={row.operational_status} aria-label={`Status for ${row.room_number}`} onChange={(event) => updateStatus(row, event.target.value)}>
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              ),
            },
          ]}
        />
      </Card>
    </Page>
  )
}

export function InventoryPage() {
  const { call } = useAdmin()
  const inventory = useData(() => call('/admin/inventory'), [])
  const [form, setForm] = useState({ roomTypeId: '', startDate: '', endDate: '', quantity: 1, reason: '' })
  const [error, setError] = useState('')

  const block = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await call('/admin/inventory/blocks', { method: 'POST', body: { ...form, roomTypeId: Number(form.roomTypeId), quantity: Number(form.quantity) } })
      inventory.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const dates = inventory.data?.dates || []
  return (
    <Page title="Inventory" lede="Available rooms by night, after bookings, holds, and blocks.">
      {error && <p className="alert">{error}</p>}
      <Card title="Block dates">
        <form className="ha-form" onSubmit={block}>
          <label>Room type
            <select required value={form.roomTypeId} onChange={(event) => setForm({ ...form, roomTypeId: event.target.value })}>
              <option value="">Choose</option>
              {(inventory.data?.roomTypes || []).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
          <label>Quantity<input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label>
          <label>From<input type="date" required value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label>
          <label>Until<input type="date" required value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label>
          <label className="span-2">Reason<input required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label>
          <div><button className="ha-btn" type="submit">Block</button></div>
        </form>
      </Card>
      <Card title="Next 14 nights">
        <div className="calendar">
          {(inventory.data?.roomTypes || []).map((type) => (
            <div className="calendar-row" key={type.id}>
              <strong>{type.name}</strong>
              {type.nights.map((night) => (
                <div key={night.date} className={night.available === 0 ? 'day-cell none' : night.available < 2 ? 'day-cell low' : 'day-cell'} title={night.date}>
                  {night.available}
                </div>
              ))}
            </div>
          ))}
          {dates.length > 0 && <p>{prettyDate(dates[0])} through {prettyDate(dates[dates.length - 1])}</p>}
        </div>
      </Card>
    </Page>
  )
}

export function RatesPage() {
  const { call } = useAdmin()
  const rates = useData(() => call('/admin/rates'), [])
  const [form, setForm] = useState({ code: '', name: '', discountType: 'percent', discountValue: 10, terms: '' })
  const [error, setError] = useState('')

  const create = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await call('/admin/promotions', { method: 'POST', body: { ...form, discountValue: Number(form.discountValue) } })
      rates.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Page title="Rate plans" lede="Prices for each date are stored when the calendar is seeded. Promotions change the quote on the server.">
      {error && <p className="alert">{error}</p>}
      <Card title="Plans">
        <Table
          rows={rates.data?.plans || []}
          columns={[
            { key: 'name', label: 'Plan' },
            { key: 'meal_plan', label: 'Meals' },
            { key: 'adjust', label: 'Adjust', render: (row) => `${row.price_adjust_percent}%` },
            { key: 'policy', label: 'Cancellation', render: (row) => row.summary },
          ]}
        />
      </Card>
      <Card title="Promotion codes">
        <form className="ha-form" onSubmit={create}>
          <label>Code<input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /></label>
          <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Type
            <select value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value })}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
              <option value="free_night">Free night after N nights</option>
            </select>
          </label>
          <label>Value<input type="number" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: event.target.value })} /></label>
          <label className="span-2">Terms<input value={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.value })} /></label>
          <div><button className="ha-btn" type="submit">Add code</button></div>
        </form>
        <Table
          rows={rates.data?.promotions || []}
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'discount_type', label: 'Type' },
            { key: 'discount_value', label: 'Value' },
            { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
          ]}
        />
      </Card>
    </Page>
  )
}

export function PaymentsPage() {
  const { call } = useAdmin()
  const payments = useData(() => call('/admin/payments'), [])
  const [error, setError] = useState('')

  const mark = async (row) => {
    setError('')
    try {
      await call(`/admin/payments/${row.id}/mark-paid`, { method: 'POST', body: {} })
      payments.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const refund = async (row) => {
    const amount = window.prompt('Refund amount', String(row.amount))
    if (!amount) return
    setError('')
    try {
      await call(`/admin/payments/${row.id}/refunds`, { method: 'POST', body: { amount: Number(amount), reason: 'Desk refund' } })
      payments.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Page title="Payments" lede="Pay-at-hotel balances can be marked paid at the desk. Card numbers are never stored.">
      {error && <p className="alert">{error}</p>}
      <Card title="Ledger">
        <Table
          rows={payments.data || []}
          columns={[
            { key: 'booking_reference', label: 'Booking' },
            { key: 'guest_name', label: 'Guest' },
            { key: 'method', label: 'Method' },
            { key: 'amount', label: 'Amount', render: (row) => money(row.amount, row.currency) },
            { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
            {
              key: 'actions',
              label: '',
              render: (row) => (
                <div className="row-actions">
                  {row.status === 'UNPAID' && <button className="ha-btn" type="button" onClick={() => mark(row)}>Mark paid</button>}
                  {['PAID', 'PARTIALLY_REFUNDED'].includes(row.status) && <button className="ha-btn-line" type="button" onClick={() => refund(row)}>Refund</button>}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </Page>
  )
}

export function ReportsPage() {
  const { call } = useAdmin()
  const [range, setRange] = useState({ from: '', to: '' })
  const report = useData(() => call(`/admin/reports/revenue?from=${range.from}&to=${range.to}`), [range.from, range.to])
  const data = report.data
  return (
    <Page title="Reports" lede="Occupancy uses stay nights. Revenue is room revenue after discounts. ADR is room revenue divided by rooms sold. RevPAR divides that revenue by available room nights.">
      <div className="admin-head-actions">
        <label>From<input type="date" value={range.from} onChange={(event) => setRange({ ...range, from: event.target.value })} /></label>
        <label>To<input type="date" value={range.to} onChange={(event) => setRange({ ...range, to: event.target.value })} /></label>
      </div>
      {report.error && <p className="alert">{report.error}</p>}
      {data && (
        <Flex row>
          {[
            ['Occupancy', `${data.occupancy}%`],
            ['Rooms sold', data.roomsSold],
            ['Available nights', data.availableRoomNights],
            ['Room revenue', money(data.roomRevenue, data.currency)],
            ['ADR', money(data.adr, data.currency)],
            ['RevPAR', money(data.revpar, data.currency)],
            ['Collected', money(data.netCollected, data.currency)],
            ['Cancellations', data.cancellations],
          ].map(([label, value]) => (
            <Flex key={label} md={3} xs={12}>
              <InfoCard title label={label} bodyClassName="kpi-body"><strong>{value}</strong></InfoCard>
            </Flex>
          ))}
        </Flex>
      )}
      {data && (
        <Card title="Sources">
          <Table rows={(data.sources || []).map((item) => ({ id: item.source, ...item }))} columns={[{ key: 'source', label: 'Source' }, { key: 'count', label: 'Bookings' }]} />
        </Card>
      )}
    </Page>
  )
}

export function HousekeepingPage() {
  const { call } = useAdmin()
  const tasks = useData(() => call('/admin/housekeeping'), [])
  const [error, setError] = useState('')
  const advance = async (task) => {
    setError('')
    try {
      await call(`/admin/housekeeping/${task.id}/advance`, { method: 'POST', body: {} })
      tasks.reload()
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <Page title="Housekeeping" lede="Dirty, cleaning, inspecting, then ready. The room status moves with the task.">
      {error && <p className="alert">{error}</p>}
      <Card title="Queue">
        <Table
          rows={tasks.data || []}
          columns={[
            { key: 'room_number', label: 'Room' },
            { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
            { key: 'priority', label: 'Priority' },
            { key: 'notes', label: 'Notes' },
            { key: 'go', label: '', render: (row) => row.status !== 'READY' && <button className="ha-btn" type="button" onClick={() => advance(row)}>Advance</button> },
          ]}
        />
      </Card>
    </Page>
  )
}

export function MaintenancePage() {
  const { call } = useAdmin()
  const tickets = useData(() => call('/admin/maintenance'), [])
  const rooms = useData(() => call('/admin/rooms'), [])
  const [form, setForm] = useState({ roomId: '', issue: '', severity: 'MEDIUM', blockRoom: true })
  const [error, setError] = useState('')

  const create = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await call('/admin/maintenance', { method: 'POST', body: { ...form, roomId: Number(form.roomId), blockRoom: Boolean(form.blockRoom) } })
      tickets.reload()
      rooms.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const resolve = async (ticket) => {
    await call(`/admin/maintenance/${ticket.id}/resolve`, { method: 'POST', body: {} })
    tickets.reload()
  }

  return (
    <Page title="Maintenance" lede="A blocked room leaves the sellable count until the ticket is resolved.">
      {error && <p className="alert">{error}</p>}
      <Card title="Open a ticket">
        <form className="ha-form" onSubmit={create}>
          <label>Room
            <select required value={form.roomId} onChange={(event) => setForm({ ...form, roomId: event.target.value })}>
              <option value="">Choose</option>
              {(rooms.data || []).map((room) => <option key={room.id} value={room.id}>{room.room_number}</option>)}
            </select>
          </label>
          <label>Severity
            <select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}>
              {['LOW', 'MEDIUM', 'HIGH'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="span-2">Issue<input required value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} /></label>
          <label><input type="checkbox" checked={form.blockRoom} onChange={(event) => setForm({ ...form, blockRoom: event.target.checked })} /> Take the room out of service</label>
          <div><button className="ha-btn" type="submit">Open ticket</button></div>
        </form>
      </Card>
      <Card title="Tickets">
        <Table
          rows={tickets.data || []}
          columns={[
            { key: 'room_number', label: 'Room' },
            { key: 'issue', label: 'Issue' },
            { key: 'severity', label: 'Severity' },
            { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
            { key: 'go', label: '', render: (row) => row.status !== 'RESOLVED' && <button className="ha-btn" type="button" onClick={() => resolve(row)}>Resolve</button> },
          ]}
        />
      </Card>
    </Page>
  )
}

export function ServicesPage() {
  const { call } = useAdmin()
  const services = useData(() => call('/admin/services'), [])
  const [error, setError] = useState('')
  const update = async (row, status) => {
    setError('')
    try {
      await call(`/admin/service-requests/${row.id}`, { method: 'PATCH', body: { status } })
      services.reload()
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <Page title="Services" lede="Guest requests for cars, cots, and other arranged services.">
      {error && <p className="alert">{error}</p>}
      <Card title="Requests">
        <Table
          rows={services.data?.requests || []}
          columns={[
            { key: 'booking_reference', label: 'Booking' },
            { key: 'guest_name', label: 'Guest' },
            { key: 'service_type', label: 'Request' },
            { key: 'details', label: 'Details' },
            { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
            {
              key: 'go',
              label: '',
              render: (row) => (
                <select value={row.status} aria-label="Request status" onChange={(event) => update(row, event.target.value)}>
                  {['OPEN', 'CONFIRMED', 'DONE', 'CANCELLED'].map((item) => <option key={item}>{item}</option>)}
                </select>
              ),
            },
          ]}
        />
      </Card>
    </Page>
  )
}

export function ContentPage() {
  const { call } = useAdmin()
  const content = useData(() => call('/admin/pages'), [])
  const [slug, setSlug] = useState('about')
  const [draft, setDraft] = useState({ title: '', body: '' })
  const [faq, setFaq] = useState({ category: 'General', question: '', answer: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    const page = content.data?.pages?.find((item) => item.slug === slug)
    if (page) setDraft({ title: page.title, body: page.body })
  }, [content.data, slug])

  const save = async (event) => {
    event.preventDefault()
    const result = await call(`/admin/pages/${slug}`, { method: 'PATCH', body: draft })
    setMessage(`${result.data.title} published.`)
    content.reload()
  }

  const addFaq = async (event) => {
    event.preventDefault()
    await call('/admin/faqs', { method: 'POST', body: faq })
    setFaq({ category: 'General', question: '', answer: '' })
    content.reload()
  }

  return (
    <Page title="Website content" lede="Published copy is what guests read. Save writes it live for this hotel.">
      {message && <p className="ok-note">{message}</p>}
      <Card title="Page">
        <form className="ha-form" onSubmit={save}>
          <label>Page
            <select value={slug} onChange={(event) => setSlug(event.target.value)}>
              {(content.data?.pages || []).map((page) => <option key={page.slug} value={page.slug}>{page.slug}</option>)}
            </select>
          </label>
          <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label className="span-2">Body<textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></label>
          <div><button className="ha-btn" type="submit">Publish</button></div>
        </form>
      </Card>
      <Card title="Add an FAQ">
        <form className="ha-form" onSubmit={addFaq}>
          <label>Category<input value={faq.category} onChange={(event) => setFaq({ ...faq, category: event.target.value })} /></label>
          <label>Question<input required value={faq.question} onChange={(event) => setFaq({ ...faq, question: event.target.value })} /></label>
          <label className="span-2">Answer<textarea required value={faq.answer} onChange={(event) => setFaq({ ...faq, answer: event.target.value })} /></label>
          <div><button className="ha-btn" type="submit">Add FAQ</button></div>
        </form>
      </Card>
    </Page>
  )
}

export function ReviewsPage() {
  const { call } = useAdmin()
  const reviews = useData(() => call('/admin/reviews'), [])
  const moderate = async (row, moderationStatus) => {
    await call(`/admin/reviews/${row.id}`, { method: 'PATCH', body: { moderationStatus } })
    reviews.reload()
  }
  return (
    <Page title="Reviews" lede="Approve a review before it appears on the public site.">
      <Card title="Moderation">
        <Table
          rows={reviews.data || []}
          columns={[
            { key: 'guest_name', label: 'Guest' },
            { key: 'rating', label: 'Rating' },
            { key: 'comment', label: 'Comment' },
            { key: 'moderation_status', label: 'Status', render: (row) => <Badge value={row.moderation_status} /> },
            {
              key: 'go',
              label: '',
              render: (row) => (
                <div className="row-actions">
                  <button className="ha-btn" type="button" onClick={() => moderate(row, 'APPROVED')}>Approve</button>
                  <button className="ha-btn-line" type="button" onClick={() => moderate(row, 'REJECTED')}>Reject</button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </Page>
  )
}

export function MessagesPage() {
  const { call } = useAdmin()
  const messages = useData(() => call('/admin/messages'), [])
  const mark = async (row) => {
    await call(`/admin/messages/${row.id}`, { method: 'PATCH', body: { status: 'READ' } })
    messages.reload()
  }
  return (
    <Page title="Messages" lede="Notes sent from the public contact form.">
      <Card title="Inbox">
        <Table
          rows={messages.data || []}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'topic', label: 'Topic' },
            { key: 'message', label: 'Message' },
            { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
            { key: 'go', label: '', render: (row) => row.status === 'NEW' && <button className="ha-btn-line" type="button" onClick={() => mark(row)}>Mark read</button> },
          ]}
        />
      </Card>
    </Page>
  )
}

export function UsersPage() {
  const { call } = useAdmin()
  const users = useData(() => call('/admin/users'), [])
  const roles = useData(() => call('/admin/roles'), [])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Front Desk' })
  const [error, setError] = useState('')

  const create = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await call('/admin/users', { method: 'POST', body: form })
      users.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggle = async (user) => {
    await call(`/admin/users/${user.id}`, { method: 'PATCH', body: { status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } })
    users.reload()
  }

  return (
    <Page title="Users" lede="Staff accounts and the role that gates each API.">
      {error && <p className="alert">{error}</p>}
      <Card title="New staff account">
        <form className="ha-form" onSubmit={create}>
          <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Password<input type="password" required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label>Role
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              {(roles.data || []).map((role) => <option key={role.id}>{role.name}</option>)}
            </select>
          </label>
          <div><button className="ha-btn" type="submit">Create account</button></div>
        </form>
      </Card>
      <Card title="Team">
        <Table
          rows={users.data || []}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'roles', label: 'Role', render: (row) => row.roles.join(', ') },
            { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
            { key: 'go', label: '', render: (row) => <button className="ha-btn-line" type="button" onClick={() => toggle(row)}>{row.status === 'ACTIVE' ? 'Disable' : 'Enable'}</button> },
          ]}
        />
      </Card>
    </Page>
  )
}

export function SettingsPage() {
  const { call } = useAdmin()
  const settings = useData(() => call('/admin/settings'), [])
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (settings.data) setDraft(settings.data)
  }, [settings.data])
  if (!draft) return <Page title="Settings">{settings.error && <p className="alert">{settings.error}</p>}</Page>
  const set = (key) => (event) => setDraft({ ...draft, [key]: event.target.value })
  const save = async (event) => {
    event.preventDefault()
    const result = await call('/admin/settings', {
      method: 'PATCH',
      body: {
        ...draft,
        taxPercent: Number(draft.taxPercent),
        serviceFeePercent: Number(draft.serviceFeePercent),
      },
    })
    setMessage('Settings saved. New quotes use these tax and service rates.')
    setDraft(result.data)
  }
  return (
    <Page title="Settings" lede={`${draft.name} · ${draft.timezone} · ${draft.currency}`}>
      {message && <p className="ok-note">{message}</p>}
      <Card title="Property">
        <form className="ha-form" onSubmit={save}>
          <label>Phone<input value={draft.phone} onChange={set('phone')} /></label>
          <label>Email<input value={draft.email} onChange={set('email')} /></label>
          <label>Check-in<input value={draft.checkInTime} onChange={set('checkInTime')} /></label>
          <label>Check-out<input value={draft.checkOutTime} onChange={set('checkOutTime')} /></label>
          <label>Tax %<input type="number" step="0.01" value={draft.taxPercent} onChange={set('taxPercent')} /></label>
          <label>Service %<input type="number" step="0.01" value={draft.serviceFeePercent} onChange={set('serviceFeePercent')} /></label>
          <label className="span-2">Tagline<input value={draft.tagline} onChange={set('tagline')} /></label>
          <label className="span-2">Description<textarea value={draft.description} onChange={set('description')} /></label>
          <div><button className="ha-btn" type="submit">Save settings</button></div>
        </form>
      </Card>
    </Page>
  )
}

export function AuditPage() {
  const { call } = useAdmin()
  const logs = useData(() => call('/admin/audit-logs'), [])
  return (
    <Page title="Audit log" lede="Staff actions on bookings, rooms, payments, and settings.">
      {logs.error && <p className="alert">{logs.error}</p>}
      <Card title="Recent events">
        <Table
          rows={logs.data || []}
          columns={[
            { key: 'created_at', label: 'When' },
            { key: 'actor_name', label: 'Who' },
            { key: 'action', label: 'Action' },
            { key: 'entity_type', label: 'Record' },
            { key: 'entity_id', label: 'Id' },
          ]}
        />
      </Card>
    </Page>
  )
}
