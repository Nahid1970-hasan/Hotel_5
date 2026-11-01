import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, money } from './api'
import { PageIntro, useGuest } from './PublicLayout'

function useList(path) {
  const [data, setData] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    api(path).then((result) => setData(result.data)).catch((err) => setError(err.message))
  }, [path])
  return { data, error }
}

export function DiningPage() {
  const { data, error } = useList('/dining')
  return (
    <>
      <PageIntro kicker="Dining" title="Three rooms, one kitchen rhythm." lede="Tell us about allergies when you book. The kitchen marks what it can confirm that day." />
      <section className="section cards">
        {error && <p className="error">{error}</p>}
        {data.map((venue) => (
          <article className="plain-card" key={venue.id}>
            <img src={venue.image_url} alt={`${venue.name} dining room`} />
            <div>
              <p className="kicker" style={{ color: '#9c7b45' }}>{venue.cuisine}</p>
              <h3>{venue.name}</h3>
              <p>{venue.description}</p>
              <p>Hours {venue.hours}</p>
              <p>Dress {venue.dress_code}</p>
              <p>{venue.dietary_notes}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

export function FacilitiesPage() {
  const { data, error } = useList('/facilities')
  return (
    <>
      <PageIntro kicker="Facilities" title="The parts of the house you can use." />
      <section className="section cards">
        {error && <p className="error">{error}</p>}
        {data.map((item) => (
          <article className="plain-card" key={item.id}>
            <img src={item.image_url} alt={item.name} />
            <div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>Open {item.hours}</p>
              <p>{item.booking_note}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

export function ExperiencesPage() {
  const { data, error } = useList('/experiences')
  return (
    <>
      <PageIntro kicker="Experiences" title="Outings arranged by the hotel." lede="These are enquiries, not instant tickets. Capacity is limited to the number shown." />
      <section className="section cards">
        {error && <p className="error">{error}</p>}
        {data.map((item) => (
          <article className="plain-card" key={item.id}>
            <img src={item.image_url} alt="" />
            <div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>{item.duration} · {item.schedule} · Up to {item.capacity}</p>
              <p>Includes {item.inclusions}</p>
              <p>Not included: {item.exclusions}</p>
              <p className="price">{money(item.price, item.currency)} per person</p>
              <Link className="btn light" to={`/contact?topic=${encodeURIComponent(item.name)}`}>Enquire</Link>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

export function OffersPage() {
  const { data, error } = useList('/offers')
  return (
    <>
      <PageIntro kicker="Offers" title="Only the offers that are active." />
      <section className="section stack">
        {error && <p className="error">{error}</p>}
        {data.map((offer) => (
          <article className="plain-card" key={offer.id}>
            <div className="split">
              <img src={offer.image_url} alt="" style={{ height: 220, objectFit: 'cover' }} />
              <div>
                <p className="kicker" style={{ color: '#9c7b45' }}>{offer.discount_label}</p>
                <h3>{offer.title}</h3>
                <p>{offer.summary}</p>
                <p>{offer.terms}</p>
                <p>Valid {offer.valid_from} to {offer.valid_to}</p>
                <Link className="btn" to="/availability">Book with this stay</Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

export function GalleryPage() {
  const { data, error } = useList('/gallery')
  const [category, setCategory] = useState('All')
  const categories = ['All', ...new Set(data.map((item) => item.category))]
  const visible = data.filter((item) => category === 'All' || item.category === category)
  return (
    <>
      <PageIntro kicker="Gallery" title="The house, the rooms, the shore." />
      <section className="section">
        {error && <p className="error">{error}</p>}
        <div className="filters">
          {categories.map((item) => (
            <button key={item} type="button" className={item === category ? 'chip on' : 'chip'} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <div className="cards">
          {visible.map((item) => (
            <figure className="room-card" key={item.id} style={{ margin: 0 }}>
              <img src={item.image_url} alt={item.alt_text} />
              <figcaption className="pad">{item.alt_text}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  )
}

export function DestinationPage() {
  const { data, error } = useList('/destination')
  return (
    <>
      <PageIntro kicker="Destination" title="Cox's Bazar, from the hotel gate." lede="Travel times are typical, not a promise in holiday traffic." />
      <section className="section cards">
        {error && <p className="error">{error}</p>}
        {data.map((item) => (
          <article className="plain-card" key={item.id}>
            <img src={item.image_url} alt="" />
            <div>
              <p className="kicker" style={{ color: '#9c7b45' }}>{item.category}</p>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>{item.travel_time}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

export function ReviewsPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api('/reviews').then((result) => setData(result.data)).catch((err) => setError(err.message))
  }, [])
  return (
    <>
      <PageIntro kicker="Reviews" title={data ? `${data.summary.average || '–'} from ${data.summary.count} published notes` : 'Reviews'} lede="Only moderated notes from verified stays are published." />
      <section className="section stack">
        {error && <p className="error">{error}</p>}
        {data?.reviews?.map((review) => (
          <article className="note" key={review.id}>
            <p className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
            <h3>{review.title}</h3>
            <p>{review.comment}</p>
            <p>{review.guest_name}</p>
            {review.response && <p><strong style={{ color: '#1c2622' }}>Hotel.</strong> {review.response}</p>}
          </article>
        ))}
      </section>
    </>
  )
}

export function FaqPage() {
  const { data, error } = useList('/faqs')
  const groups = data.reduce((map, item) => {
    map[item.category] = map[item.category] || []
    map[item.category].push(item)
    return map
  }, {})
  return (
    <>
      <PageIntro kicker="FAQ" title="Before you write to us." />
      <section className="section faq stack">
        {error && <p className="error">{error}</p>}
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <h2>{category}</h2>
            {items.map((item) => (
              <details key={item.id}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        ))}
      </section>
    </>
  )
}

export function PolicyPage({ slug }) {
  const [page, setPage] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api(`/pages/${slug}`).then((result) => setPage(result.data)).catch((err) => setError(err.message))
  }, [slug])
  return (
    <section className="section" style={{ maxWidth: 800 }}>
      {error && <p className="error">{error}</p>}
      {!page && !error && <p>Loading…</p>}
      {page && (
        <>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}>{page.title}</h1>
          {page.body.split('\n\n').map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
        </>
      )}
    </section>
  )
}

export function ContactPage() {
  const { hotel } = useGuest()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: params.get('topic') || 'General', message: '' })
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')
    try {
      await api('/contact', { method: 'POST', body: form })
      setStatus('Message received. The hotel will reply by email.')
      setForm((current) => ({ ...current, message: '' }))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageIntro kicker="Contact" title="Write, or call the desk." />
      <section className="section detail">
        <form className="form" onSubmit={submit}>
          {error && <p className="error">{error}</p>}
          {status && <p className="ok">{status}</p>}
          <label>Name<input required value={form.name} onChange={set('name')} /></label>
          <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
          <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
          <label>Topic<input value={form.topic} onChange={set('topic')} /></label>
          <label className="wide">Message<textarea required value={form.message} onChange={set('message')} /></label>
          <button className="btn" type="submit">Send</button>
        </form>
        <aside>
          <p>{hotel?.address}</p>
          <p>{hotel?.city}, {hotel?.country}</p>
          <p><a href={`tel:${hotel?.phone}`}>{hotel?.phone}</a></p>
          <p><a href={`mailto:${hotel?.email}`}>{hotel?.email}</a></p>
          <iframe className="map" title="Map of Kolatoli, Cox's Bazar" src="https://www.openstreetmap.org/export/embed.html?bbox=91.97%2C21.40%2C92.05%2C21.46&layer=mapnik&marker=21.4272%2C92.0058" />
        </aside>
      </section>
    </>
  )
}

export function NotFoundPage() {
  return (
    <section className="section">
      <h1>That page is not in the house.</h1>
      <Link className="btn" to="/">Back home</Link>
    </section>
  )
}
