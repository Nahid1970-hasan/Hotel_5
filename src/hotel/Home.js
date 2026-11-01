import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, money } from './api'
import { useGuest } from './PublicLayout'
import { SearchForm } from './Stay'

const hero = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80'

export default function Home() {
  const { hotel } = useGuest()
  const [rooms, setRooms] = useState([])
  const [offers, setOffers] = useState([])
  const [reviews, setReviews] = useState(null)
  const [facilities, setFacilities] = useState([])

  useEffect(() => {
    api('/room-types').then((result) => setRooms(result.data.slice(0, 3))).catch(() => setRooms([]))
    api('/offers').then((result) => setOffers(result.data.slice(0, 2))).catch(() => setOffers([]))
    api('/reviews').then((result) => setReviews(result.data)).catch(() => setReviews(null))
    api('/facilities').then((result) => setFacilities(result.data)).catch(() => setFacilities([]))
  }, [])

  return (
    <>
      <section className="hero" aria-label="Introduction">
        <img src={hero} alt="Grand Horizon seen from the beach side" />
        <div className="hero-copy">
          <p className="kicker">Cox&apos;s Bazar · Five-star stay</p>
          <h1>The bay, at a quieter pace.</h1>
          <p className="lede">{hotel?.tagline || 'Ocean rooms, a long pool, and a grill that buys fish in the morning.'}</p>
        </div>
      </section>
      <SearchForm hotel={hotel} />

      <section className="section">
        <div className="section-head">
          <div>
            <p className="kicker" style={{ color: '#9c7b45' }}>Rooms</p>
            <h2>Stay close to the water</h2>
          </div>
          <Link to="/rooms">All rooms</Link>
        </div>
        <div className="cards">
          {rooms.map((room) => (
            <Link className="room-card" key={room.id} to={`/rooms/${room.slug}`}>
              <img src={room.images[0]?.url} alt={room.images[0]?.alt || room.name} />
              <div>
                <div className="meta">
                  <h3>{room.name}</h3>
                  <span className="price">From {money(room.basePrice, room.currency)}</span>
                </div>
                <p>{room.summary}</p>
                <p>{room.bedConfig} · {room.sizeSqm} m² · Sleeps {room.capacityAdults}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="split">
          <div className="frame">
            <img src={facilities[0]?.image_url} alt={facilities[0]?.name || 'Hotel pool'} />
          </div>
          <div>
            <p className="kicker" style={{ color: '#9c7b45' }}>The house</p>
            <h2>Pool, spa, and a grill that faces the shore</h2>
            <div className="stack">
              {facilities.slice(0, 3).map((item) => (
                <p key={item.id}><strong style={{ color: '#1c2622' }}>{item.name}.</strong> {item.description}</p>
              ))}
            </div>
            <Link className="btn light" to="/facilities">Facilities</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Current offers</h2>
          <Link to="/offers">Offer terms</Link>
        </div>
        <div className="cards">
          {offers.map((offer) => (
            <article className="plain-card" key={offer.id}>
              <img src={offer.image_url} alt="" style={{ height: 180, width: '100%', objectFit: 'cover' }} />
              <div>
                <p className="kicker" style={{ color: '#9c7b45' }}>{offer.discount_label}</p>
                <h3>{offer.title}</h3>
                <p>{offer.summary}</p>
              </div>
            </article>
          ))}
          {reviews?.reviews?.[0] && (
            <article className="plain-card">
              <div>
                <p className="stars" aria-label={`${reviews.summary.average} out of 5`}>{ '★'.repeat(reviews.reviews[0].rating) }</p>
                <p className="quote">{reviews.reviews[0].title}</p>
                <p>{reviews.reviews[0].comment}</p>
                <p>{reviews.reviews[0].guest_name}</p>
                <Link to="/reviews">All reviews</Link>
              </div>
            </article>
          )}
        </div>
      </section>
    </>
  )
}
