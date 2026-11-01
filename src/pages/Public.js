import { useEffect, useState } from 'react'
import '../style/public.css'

const slides = [
  { src: '/images/hero-green.jpg', position: 'center 64%', label: 'Green mountain ridge' },
  { src: '/images/hero-valley.jpg', position: 'center center', label: 'Snowy mountain valley' },
  { src: '/images/hero-trail.jpg', position: 'center 42%', label: 'Hikers on a mountain trail' },
]

const articles = [
  {
    id: 'level',
    num: '01',
    kicker: 'Get started',
    title: 'What level of hiker are you?',
    body: 'Determining what level of hiker you are can be an important tool when planning future hikes. This hiking level guide will help you plan hikes according to different hike ratings set by various websites like All Trails and Modern Hiker. What type of hiker are you – novice, moderate, advanced moderate, expert, or expert backpacker?',
    image: '/images/hiker-ridge.jpg',
    alt: 'Hiker walking a high green ridge above a valley',
    position: 'center 70%',
    more: '#gear',
  },
  {
    id: 'gear',
    num: '02',
    kicker: 'Hiking essentials',
    title: 'Picking the right Hiking Gear!',
    body: "The nice thing about beginning hiking is that you don't really need any special gear, you can probably get away with things you already have. Let's start with clothing. A typical mistake hiking beginners make is wearing jeans and regular clothes, which will get heavy and chafe if they get sweaty or wet.",
    image: '/images/hiker-summit.jpg',
    alt: 'Hiker with a red backpack standing on a rocky summit',
    position: 'center 40%',
    flip: true,
    more: '#map',
  },
  {
    id: 'map',
    num: '03',
    kicker: 'Where you go is the key',
    title: 'Understand Your Map & Timing',
    body: "To start, print out the hiking guide and map. If it's raining, throw them in a Zip-Lock bag. Read over the guide, study the map, and have a good idea of what to expect. I like to know what my next landmark is as I hike. For example, I'll read the guide and know that say, in a mile, I make a right turn at the junction.",
    image: '/images/map-desk.jpg',
    alt: 'Map, camera, and notebook laid out for planning a route',
    position: 'center',
    more: '#blog',
  },
]

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

function Instagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.4" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Twitter() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.6 7.3c.5-.3.9-.8 1.1-1.4-.5.3-1 .5-1.6.6A2.7 2.7 0 0 0 14.4 9c0 .2 0 .4.1.6-2.2-.1-4.2-1.2-5.5-2.8-.2.4-.3.8-.3 1.3 0 .9.5 1.8 1.2 2.2-.4 0-.9-.1-1.2-.4v.1c0 1.3.9 2.4 2.2 2.6-.2.1-.5.1-.7.1-.2 0-.3 0-.5-.1.3 1.1 1.3 1.8 2.5 1.9A5.4 5.4 0 0 1 6 16.6 7.6 7.6 0 0 0 10.1 18c4.9 0 7.6-4.1 7.6-7.6v-.3c.5-.4.9-.8 1.3-1.3-.5.2-1 .4-1.4.4z" />
    </svg>
  )
}

export default function Public({ onLogin }) {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const root = document.documentElement
    const previousScroll = root.style.scrollBehavior
    const previousBg = document.body.style.background
    const previousTitle = document.title
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) root.style.scrollBehavior = 'smooth'
    document.body.style.background = '#0b1d26'
    document.title = 'A Hiking Guide'
    return () => {
      root.style.scrollBehavior = previousScroll
      document.body.style.background = previousBg
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="mntn" id="top">
      <section className="mntn-hero" aria-label="Introduction">
        {slides.map((item, index) => (
          <div
            key={item.src}
            className={index === slide ? 'mntn-hero-bg is-on' : 'mntn-hero-bg'}
            style={{ backgroundImage: `url(${item.src})`, backgroundPosition: item.position }}
          />
        ))}
        <div className="mntn-hero-shade" />

        <header className="mntn-nav">
          <a className="mntn-logo" href="#top">
            Logo
          </a>
          <nav className="mntn-links" aria-label="Primary">
            <a href="#gear">Equipment</a>
            <a href="#level">About us</a>
            <a href="#blog">Blog</a>
          </nav>
          <button type="button" className="mntn-login" onClick={onLogin}>
            Log in
          </button>
        </header>

        <div className="mntn-social">
          <span className="mntn-follow">Follow us</span>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
            <Instagram />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
            <Twitter />
          </a>
        </div>

        <div className="mntn-rail" aria-label="Hero slides">
          <button type="button" className="mntn-rail-start" onClick={() => setSlide(0)}>
            Start
          </button>
          <div className="mntn-rail-track">
            {slides.map((item, index) => (
              <button
                key={item.src}
                type="button"
                className={index === slide ? 'is-on' : undefined}
                aria-label={item.label}
                aria-current={index === slide ? 'true' : undefined}
                onClick={() => setSlide(index)}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        <div className="mntn-hero-copy">
          <p className="mntn-kicker">A hiking guide</p>
          <h1>
            <span>Be Prepared For The</span>
            <span>Mountains And Beyond!</span>
          </h1>
          <a className="mntn-scroll" href="#level">
            scroll down
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" />
              <path d="M6 13l6 6 6-6" />
            </svg>
          </a>
          <div className="mntn-steps">
            {slides.map((item, index) => (
              <button
                key={item.src}
                type="button"
                className={index === slide ? 'is-on' : undefined}
                aria-label={item.label}
                onClick={() => setSlide(index)}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main>
        {articles.map((article) => (
          <article key={article.id} id={article.id} className="mntn-article">
            {article.flip && (
              <figure className="mntn-photo">
                <img src={article.image} alt={article.alt} style={{ objectPosition: article.position }} />
              </figure>
            )}
            <div className="mntn-copy">
              <span className="mntn-watermark" aria-hidden="true">
                {article.num}
              </span>
              <p className="mntn-kicker">{article.kicker}</p>
              <h2>{article.title}</h2>
              <p className="mntn-text">{article.body}</p>
              <a className="mntn-more" href={article.more}>
                read more <Arrow />
              </a>
            </div>
            {!article.flip && (
              <figure className="mntn-photo">
                <img src={article.image} alt={article.alt} style={{ objectPosition: article.position }} />
              </figure>
            )}
          </article>
        ))}
      </main>

      <footer className="mntn-footer">
        <div className="mntn-foot">
          <p className="mntn-tagline">Get out there & discover your next slope, mountain & destination!</p>
          <div id="blog">
            <h2>More on The Blog</h2>
            <a href="#level">About MNTN</a>
            <a href="#gear">Contributors & Writers</a>
            <a href="#map">Write For Us</a>
            <a href="#top">Contact Us</a>
            <a href="#top">Privacy Policy</a>
          </div>
          <div>
            <h2>More on MNTN</h2>
            <a href="#level">The Team</a>
            <a href="#gear">Jobs</a>
            <a href="#map">Press</a>
          </div>
        </div>
        <p className="mntn-legal">
          Copyright 2023 MNTN, Inc. <a href="#top">Terms & Privacy</a>
        </p>
      </footer>
    </div>
  )
}
