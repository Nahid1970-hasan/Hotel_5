import { useEffect, useMemo, useState } from 'react'
import '../style/admin.css'

const BARS = [
  { day: 'S', height: 62, tone: 'mid' },
  { day: 'M', height: 88, tone: 'dark' },
  { day: 'T', height: 74, tone: 'light', tip: '74%' },
  { day: 'W', height: 100, tone: 'deep' },
  { day: 'T', height: 72, tone: 'stripe' },
  { day: 'F', height: 48, tone: 'stripe' },
  { day: 'S', height: 64, tone: 'stripe' },
]

const START_PROJECTS = [
  { id: 'api', name: 'Develop API Endpoints', due: 'Nov 26, 2024', color: '#3b82f6' },
  { id: 'flow', name: 'Onboarding Flow', due: 'Nov 28, 2024', color: '#14b8a6' },
  { id: 'dash', name: 'Build Dashboard', due: 'Nov 30, 2024', color: '#22c55e' },
  { id: 'speed', name: 'Optimize Page Load', due: 'Dec 5, 2024', color: '#eab308' },
  { id: 'test', name: 'Cross-Browser Testing', due: 'Dec 6, 2024', color: '#a855f7' },
]

const START_TEAM = [
  { id: 'alex', name: 'Alexandra Deff', task: 'Github Project Repository', status: 'Completed', hue: '#f0b429' },
  { id: 'edwin', name: 'Edwin Adenike', task: 'Integrate User Authentication System', status: 'In Progress', hue: '#d97756' },
  { id: 'isaac', name: 'Isaac Oluwatemilorun', task: 'Develop Search and Filter Functionality', status: 'Pending', hue: '#7c6a58' },
  { id: 'david', name: 'David Oshodi', task: 'Responsive Layout for Homepage', status: 'In Progress', hue: '#5b8def' },
]

const COLORS = ['#3b82f6', '#14b8a6', '#22c55e', '#eab308', '#a855f7', '#0f8a4b']
const BASE_SECONDS = 1 * 3600 + 24 * 60 + 8

function clock(total) {
  const safe = Math.max(0, total)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

function Icon({ name }) {
  const paths = {
    arrow: 'M7 17 17 7M9 7h8v8',
    plus: 'M12 5v14M5 12h14',
    video: 'M4 8.5A2.5 2.5 0 0 1 6.5 6h6A2.5 2.5 0 0 1 15 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 4 15.5v-7zM15 10.5l5-2.5v8l-5-2.5v-3z',
    trend: 'M5 14.5 9 10l3 2.5 6-6',
    bolt: 'M13 3 5 13h6l-1 8 8-11h-6l1-7z',
    pause: 'M8 6h2.4v12H8zM13.6 6H16v12h-2.4z',
    play: 'M8 6.5v11l9-5.5-9-5.5z',
  }
  return (
    <svg viewBox="0 0 24 24" fill={name === 'play' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}

export default function AdminDasboard() {
  const [projects, setProjects] = useState(START_PROJECTS)
  const [team, setTeam] = useState(START_TEAM)
  const [seconds, setSeconds] = useState(BASE_SECONDS)
  const [running, setRunning] = useState(true)
  const [meeting, setMeeting] = useState(false)
  const [imported, setImported] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const [memberOpen, setMemberOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDue, setProjectDue] = useState('')
  const [memberName, setMemberName] = useState('')
  const [memberTask, setMemberTask] = useState('')
  const [taskQuery, setTaskQuery] = useState('')

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const needle = taskQuery.trim().toLowerCase()
  const visibleProjects = useMemo(
    () => projects.filter((item) => item.name.toLowerCase().includes(needle)),
    [projects, needle],
  )
  const visibleTeam = useMemo(
    () => team.filter((item) => item.name.toLowerCase().includes(needle) || item.task.toLowerCase().includes(needle)),
    [team, needle],
  )
  const added = projects.length - START_PROJECTS.length
  const stats = [
    { label: 'Total Projects', value: 24 + added, note: 'Increased from last month', tone: 'green', trend: true },
    { label: 'Ended Projects', value: 10, note: 'Increased from last month', trend: true },
    { label: 'Running Projects', value: 12, note: 'Increased from last month', trend: true },
    { label: 'Pending Project', value: 2 + added, note: 'On Discuss', trend: false },
  ]

  const addProject = (event) => {
    event.preventDefault()
    const name = projectName.trim()
    if (!name) return
    setProjects((list) => [
      { id: `${Date.now()}`, name, due: projectDue.trim() || 'No due date', color: COLORS[list.length % COLORS.length] },
      ...list,
    ])
    setProjectName('')
    setProjectDue('')
    setProjectOpen(false)
  }

  const addMember = (event) => {
    event.preventDefault()
    const name = memberName.trim()
    if (!name) return
    setTeam((list) => [
      ...list,
      { id: `${Date.now()}`, name, task: memberTask.trim() || 'New assignment', status: 'Pending', hue: COLORS[list.length % COLORS.length] },
    ])
    setMemberName('')
    setMemberTask('')
    setMemberOpen(false)
  }

  return (
    <div className="dash">
      <div className="dash-top">
        <label className="dash-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6" />
            <path d="M15.5 15.5 20 20" />
          </svg>
          <input type="search" placeholder="Search task" value={taskQuery} onChange={(event) => setTaskQuery(event.target.value)} aria-label="Search task" />
        </label>
      </div>

      <div className="dash-head">
        <div>
          <h1>Dashboard</h1>
          <p>Plan, prioritize, and accomplish your tasks with ease.</p>
        </div>
        <div className="dash-actions">
          <button type="button" className="btn btn-solid" onClick={() => setProjectOpen((open) => !open)}>
            <Icon name="plus" /> Add Project
          </button>
          <button type="button" className="btn btn-line" onClick={() => setImported(true)} disabled={imported}>
            {imported ? 'Imported' : 'Import Data'}
          </button>
        </div>
      </div>

      {projectOpen && (
        <form className="dash-form" onSubmit={addProject}>
          <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" aria-label="Project name" required />
          <input value={projectDue} onChange={(event) => setProjectDue(event.target.value)} placeholder="Due date" aria-label="Due date" />
          <button type="submit" className="btn btn-solid">Add</button>
          <button type="button" className="btn btn-line" onClick={() => setProjectOpen(false)}>Cancel</button>
        </form>
      )}

      <section className="stat-row" aria-label="Project totals">
        {stats.map((stat) => (
          <article key={stat.label} className={stat.tone === 'green' ? 'stat stat-green' : 'stat'}>
            <header>
              <h2>{stat.label}</h2>
              <span className="stat-go" aria-hidden="true">
                <Icon name="arrow" />
              </span>
            </header>
            <p className="stat-value">{stat.value}</p>
            <p className="stat-note">
              {stat.trend && <Icon name="trend" />}
              {stat.note}
            </p>
          </article>
        ))}
      </section>

      <div className="dash-board">
        <section className="card analytics">
          <h2>Project Analytics</h2>
          <div className="bars" role="img" aria-label="Weekly project analytics. Tuesday is at 74 percent.">
            {BARS.map((bar, index) => (
              <div key={`${bar.day}-${index}`} className="bar-col">
                {bar.tip && <span className="bar-tip" style={{ bottom: `calc(${bar.height}% + 22px)` }}>{bar.tip}</span>}
                <div className={`bar is-${bar.tone}`} style={{ height: `${bar.height}%` }} />
                <span>{bar.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card reminder">
          <h2>Reminders</h2>
          <p className="reminder-title">Meeting with Arc Company</p>
          <p className="reminder-time">Time : 02:00 pm - 04:00 pm</p>
          <button type="button" className="btn btn-solid btn-wide" onClick={() => setMeeting((live) => !live)}>
            <Icon name="video" /> {meeting ? 'Meeting live' : 'Start Meeting'}
          </button>
        </section>

        <div className="dash-side">
          <section className="card projects">
            <header className="card-head">
              <h2>Project</h2>
              <button type="button" className="btn btn-soft" onClick={() => setProjectOpen(true)}>
                <Icon name="plus" /> New
              </button>
            </header>
            {visibleProjects.length === 0 && <p className="empty">No matching tasks.</p>}
            <ul>
              {visibleProjects.map((item) => (
                <li key={item.id}>
                  <span className="proj-icon" style={{ background: item.color }}>
                    <Icon name="bolt" />
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>Due date: {item.due}</small>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card timer">
            <h2>Time Tracker</h2>
            <p className="timer-clock">{clock(seconds)}</p>
            <div className="timer-controls">
              <button type="button" className="timer-pause" aria-label={running ? 'Pause timer' : 'Resume timer'} onClick={() => setRunning((value) => !value)}>
                <Icon name={running ? 'pause' : 'play'} />
              </button>
              <button type="button" className="timer-stop" aria-label="Stop timer" onClick={() => { setRunning(false); setSeconds(0) }} />
            </div>
          </section>
        </div>

        <section className="card team">
          <header className="card-head">
            <h2>Team Collaboration</h2>
            <button type="button" className="btn btn-soft" onClick={() => setMemberOpen((open) => !open)}>
              <Icon name="plus" /> Add Member
            </button>
          </header>
          {memberOpen && (
            <form className="dash-form dash-form-tight" onSubmit={addMember}>
              <input value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="Name" aria-label="Member name" required />
              <input value={memberTask} onChange={(event) => setMemberTask(event.target.value)} placeholder="Working on" aria-label="Assignment" />
              <button type="submit" className="btn btn-solid">Add</button>
            </form>
          )}
          {visibleTeam.length === 0 && <p className="empty">No matching people.</p>}
          <ul>
            {visibleTeam.map((person) => (
              <li key={person.id}>
                <span className="avatar" style={{ background: person.hue }} aria-hidden="true">
                  {person.name.slice(0, 1)}
                </span>
                <span className="team-copy">
                  <strong>{person.name}</strong>
                  <small>Working on {person.task}</small>
                </span>
                <span className={`pill pill-${person.status.replace(/\s+/g, '-').toLowerCase()}`}>{person.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card progress">
          <h2>Project Progress</h2>
          <div className="donut-wrap">
            <svg viewBox="0 0 120 120" role="img" aria-label="Project progress 41 percent">
              <circle cx="60" cy="60" r="46" fill="none" stroke="#e8eeea" strokeWidth="14" />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#128a49"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${0.41 * 2 * Math.PI * 46} ${2 * Math.PI * 46}`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="donut-label">
              <strong>41%</strong>
              <span>Project Ended</span>
            </div>
          </div>
          <ul className="legend">
            <li><i className="swatch is-done" /> Completed</li>
            <li><i className="swatch is-progress" /> In Progress</li>
            <li><i className="swatch is-pending" /> Pending</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
