import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ImageUpload from '../ImageUpload'
import { useAdmin } from './AdminShell'
import { ActionMenu, Btn, Field, FormModal, Table } from './ui'

const SECTIONS = {
  'rooms-and-suites': {
    label: 'Rooms & Suites',
    fields: [
      { key: 'category', label: 'Category' },
      { key: 'priceLabel', label: 'Price note' },
    ],
  },
  dining: {
    label: 'Dining',
    fields: [
      { key: 'cuisine', label: 'Cuisine' },
      { key: 'hours', label: 'Hours' },
      { key: 'dressCode', label: 'Dress code' },
      { key: 'dietaryNotes', label: 'Dietary notes' },
    ],
  },
  experiences: {
    label: 'Experiences',
    fields: [
      { key: 'duration', label: 'Duration' },
      { key: 'schedule', label: 'Schedule' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'inclusions', label: 'Includes' },
      { key: 'exclusions', label: 'Not included' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'currency', label: 'Currency' },
    ],
  },
  facilities: {
    label: 'Facilities',
    fields: [
      { key: 'hours', label: 'Hours' },
      { key: 'bookingNote', label: 'Booking note' },
    ],
  },
  offers: {
    label: 'Offers',
    fields: [
      { key: 'discountLabel', label: 'Discount label' },
      { key: 'terms', label: 'Terms' },
      { key: 'validFrom', label: 'Valid from' },
      { key: 'validTo', label: 'Valid to' },
    ],
  },
  gallery: {
    label: 'Gallery',
    fields: [
      { key: 'category', label: 'Category' },
      { key: 'altText', label: 'Image description' },
    ],
  },
  destination: {
    label: 'Destination',
    fields: [
      { key: 'category', label: 'Category' },
      { key: 'travelTime', label: 'Travel time' },
    ],
  },
  contact: {
    label: 'Contact',
    fields: [
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'topic', label: 'Topic' },
    ],
  },
}

function blank(config) {
  const details = {}
  config.fields.forEach((field) => {
    details[field.key] = ''
  })
  return { id: null, title: '', summary: '', imageUrl: '', details }
}

export default function PublicPortalPage({ section: sectionProp }) {
  const { section: sectionParam } = useParams()
  const section = sectionProp || sectionParam
  const config = SECTIONS[section]
  const { call } = useAdmin()
  const [rows, setRows] = useState(null)
  const [counts, setCounts] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [form, setForm] = useState(() => (config ? blank(config) : null))
  const [open, setOpen] = useState(false)

  const load = () => {
    if (!config) return
    call(`/admin/public-portal/${section}`)
      .then((result) => {
        setRows(result.data.items)
        setCounts(result.data.counts)
      })
      .catch(() => {
        setRows([])
        setCounts(null)
      })
  }

  useEffect(() => {
    setForm(config ? blank(config) : null)
    setFilter('ALL')
    load()
  }, [section])

  if (!config || !form) {
    return (
      <div className="hotel-admin">
        <h1>Public Portal</h1>
        <p>That section is not on the public site.</p>
      </div>
    )
  }

  const visible = (rows || []).filter((row) => filter === 'ALL' || row.status === filter)
  const setDetail = (key, value) => setForm((current) => ({ ...current, details: { ...current.details, [key]: value } }))

  const save = async (event) => {
    event.preventDefault()
    const body = { title: form.title, summary: form.summary, imageUrl: form.imageUrl, details: form.details }
    try {
      if (form.id) await call(`/admin/public-portal/${section}/${form.id}`, { method: 'PATCH', body })
      else await call(`/admin/public-portal/${section}`, { method: 'POST', body })
      setForm(blank(config))
      setOpen(false)
      load()
    } catch {
      // The request toast already reported the error.
    }
  }

  const act = async (row, action, body) => {
    try {
      await call(`/admin/public-portal/${section}/${row.id}${action}`, { method: action ? 'POST' : 'DELETE', body })
      if (form.id === row.id) setForm(blank(config))
      load()
    } catch {
      // The request toast already reported the error.
    }
  }

  return (
    <div className="hotel-admin">
      <div className="admin-head">
        <div>
          <h1>{config.label}</h1>
          <p>Drafts stay off the public site until they are submitted and approved.</p>
        </div>
      </div>
      {counts && (
        <p>Draft {counts.DRAFT || 0} · Submitted {counts.SUBMITTED || 0} · Approved {counts.APPROVED || 0} · Rejected {counts.REJECTED || 0}</p>
      )}
      <FormModal open={open} title={form.id ? 'Update item' : 'New item'} onClose={() => setOpen(false)}>
        <form className="ha-form" onSubmit={save}>
          <Field label="Title" name="title" required minLength={2} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <Field className="wide" label="Summary" type="textarea" name="summary" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
          <ImageUpload value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
          {config.fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              name={field.key}
              type={field.type || 'text'}
              value={form.details[field.key] ?? ''}
              onChange={(event) => setDetail(field.key, event.target.value)}
            />
          ))}
          <div className="span-2">
            <Btn type="submit" label={form.id ? 'Save changes' : 'Create draft'} />
          </div>
        </form>
      </FormModal>
        <div className="filters" style={{ margin: '16px 0' }}>
        {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((status) => (
          <Btn key={status} line={filter !== status} label={status === 'ALL' ? 'All' : status} onClick={() => setFilter(status)} />
        ))}
      </div>
      {!rows && <p>Loading the approval list…</p>}
      {rows && (
        <Table
          rows={visible}
          onNew={() => { setForm(blank(config)); setOpen(true) }}
          columns={[
            {
              key: 'title',
              label: 'Title',
              render: (row) => (
                <>
                  {row.imageUrl && <img className="upload-preview" src={row.imageUrl} alt="" />}
                  <strong>{row.title}</strong>
                  {row.summary && <div>{row.summary}</div>}
                  {row.rejectionNote && <div>Note: {row.rejectionNote}</div>}
                </>
              ),
            },
            { key: 'status', label: 'Status', render: (row) => <span className="badge" data-status={row.status}>{row.status}</span> },
            {
              key: 'actions',
              label: '',
              render: (row) => (
                <ActionMenu items={[
                  { label: 'Edit', onClick: () => { setForm({ id: row.id, title: row.title, summary: row.summary, imageUrl: row.imageUrl, details: { ...blank(config).details, ...row.details } }); setOpen(true) } },
                  ['DRAFT', 'REJECTED'].includes(row.status) && { label: 'Submit', onClick: () => act(row, '/submit') },
                  { label: 'Delete', onClick: () => act(row, '') },
                ]} />
              ),
            },
          ]}
        />
      )}
    </div>
  )
}

const SECTION_LIST = Object.entries(SECTIONS)

export function PublicPortalApprovalPage() {
  const { call } = useAdmin()
  const [rows, setRows] = useState(null)

  const load = () => {
    Promise.all(SECTION_LIST.map(async ([section, config]) => {
      const result = await call(`/admin/public-portal/${section}`)
      return result.data.items
        .filter((row) => row.status === 'SUBMITTED')
        .map((row) => ({ ...row, section, sectionLabel: config.label }))
    }))
      .then((groups) => setRows(groups.flat()))
      .catch(() => setRows([]))
  }

  useEffect(() => {
    load()
  }, [])

  const decide = async (row, status) => {
    try {
      await call(`/admin/public-portal/${row.section}/${row.id}/approval`, {
        method: 'POST',
        body: { status, note: status === 'REJECTED' ? 'Needs a revision' : '' },
      })
      load()
    } catch {
      // The request toast already reported the error.
    }
  }

  return (
    <div className="hotel-admin">
      <div className="admin-head">
        <div>
          <h1>Approval</h1>
          <p>Submitted public-portal items wait here. Only an approved item is shown on the public site.</p>
        </div>
      </div>
      {!rows && <p>Loading submissions…</p>}
      {rows && (
        <Table
          rows={rows}
          columns={[
            { key: 'sectionLabel', label: 'Section' },
            { key: 'title', label: 'Title' },
            { key: 'summary', label: 'Summary' },
            { key: 'status', label: 'Status', render: (row) => <span className="badge" data-status={row.status}>{row.status}</span> },
            {
              key: 'actions',
              label: 'Action',
              render: (row) => (
                <ActionMenu items={[
                  { label: 'Approve', onClick: () => decide(row, 'APPROVED') },
                  { label: 'Reject', onClick: () => decide(row, 'REJECTED') },
                ]} />
              ),
            },
          ]}
        />
      )}
    </div>
  )
}
