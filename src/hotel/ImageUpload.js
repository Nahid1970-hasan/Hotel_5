import { useState } from 'react'
import { uploadFile } from './api'

export default function ImageUpload({ value, onChange, label = 'Image' }) {
  const [busy, setBusy] = useState(false)

  const onPick = async (event) => {
    const file = event.target.files && event.target.files[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadFile(file)
      onChange(url)
    } catch (error) {
      // The upload toast already reported the error.
    } finally {
      setBusy(false)
    }
  }

  return (
    <label className="span-2">
      {label}
      {value && <img className="upload-preview" src={value} alt="" />}
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPick} disabled={busy} />
      {busy && <span>Uploading…</span>}
    </label>
  )
}
