import { useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Menu } from 'primereact/menu'
import { CommonButton, DeleteButton, EditButton, RejectButton } from '../../components/Buttons/Buttons'
import { InputField } from '../../components/InputField/Input'
import { Table as SharedTable } from '../../components/Table/Table'

export { DeleteButton, EditButton, RejectButton }

export function Table({ columns, rows, onNew, newLabel = 'New' }) {
  const [selectedData, setSelectedData] = useState([])
  const data = (rows || []).map((row, index) => ({
    ...row,
    __rowKey: row?.id ?? row?.reference ?? `row-${index}`,
  }))
  const tableColumns = (columns || []).map((column) => ({
    field: column.key,
    header: column.label || 'Action',
    sortableBody: (row) => (column.render ? column.render(row) : row[column.key] ?? ''),
  }))
  return (
    <div className="admin-table-wrap">
      <SharedTable
        tableColumns={tableColumns}
        data={data}
        dataKey="__rowKey"
        loading={false}
        isSelectable
        newBtn={Boolean(onNew)}
        newBtnWithoutAddPermission
        newBtnLabel={newLabel}
        newBtnFunc={onNew}
        exportBtn
        searchShow
        showTableHeader
        pageShow
        showRow={10}
        rowsPerPageOptions={[10, 25, 50]}
        emptyMessage="No data found"
        selectedData={selectedData}
        setSelectedData={setSelectedData}
      />
    </div>
  )
}

export function ActionMenu({ items }) {
  const menu = useRef(null)
  const model = (items || []).filter((item) => item && item.label).map((item) => ({
    label: item.label,
    command: item.onClick,
  }))
  if (!model.length) return null
  return (
    <>
      <Menu model={model} popup ref={menu} />
      <Button type="button" label="Action" icon="pi pi-chevron-down" iconPos="right" className="p-button-sm" onClick={(event) => menu.current?.toggle(event)} />
    </>
  )
}

export function FormModal({ open, title, onClose, children }) {
  return (
    <Dialog className="form-modal" header={title} visible={open} onHide={onClose} style={{ width: 'min(760px, 96vw)' }} modal dismissableMask draggable={false}>
      {children}
    </Dialog>
  )
}

export function Btn({ label, line, type = 'button', onClick, disabled, className }) {
  return <CommonButton type={type} label={label} className={className || (line ? 'ha-btn-line' : 'ha-btn')} onClick={onClick} disabled={disabled} />
}

export function Field({ label, className, type = 'text', ...props }) {
  if (type === 'date' || type === 'checkbox') {
    return (
      <label className={className}>
        {type === 'checkbox' ? null : label}
        <input type={type} {...props} />
        {type === 'checkbox' ? ` ${label}` : null}
      </label>
    )
  }
  const inputType = type === 'textarea' ? 'textarea' : type === 'password' ? 'password' : type === 'number' ? 'number' : 'text'
  const value = props.value == null ? '' : String(props.value)
  return (
    <label className={className}>
      {label}
      <InputField
        id={props.id || props.name || label}
        name={props.name || props.id || label}
        label=""
        labelFor={props.id || props.name || label}
        width="full"
        type={inputType}
        value={value}
        onChange={props.onChange}
        required={props.required}
        disabled={props.disabled}
        placeholder={props.placeholder}
        minLength={props.minLength}
        autoComplete={props.autoComplete}
      />
    </label>
  )
}
