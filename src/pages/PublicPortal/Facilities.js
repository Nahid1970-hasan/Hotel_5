import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import ImageUpload from "../../hotel/ImageUpload";
import { useAdmin } from "../../hotel/admin/AdminShell";

const SECTION = "facilities";
const FIELDS = [
    { key: "hours", label: "Hours" },
    { key: "bookingNote", label: "Booking note" },
];
const STATUSES = [
    { id: "ALL", name: "All", label: "All" },
    { id: "DRAFT", name: "Draft", label: "Draft" },
    { id: "SUBMITTED", name: "Submitted", label: "Submitted" },
    { id: "APPROVED", name: "Approved", label: "Approved" },
    { id: "REJECTED", name: "Rejected", label: "Rejected" },
];

function blank() {
    return { id: null, title: "", summary: "", imageUrl: "", details: { hours: "", bookingNote: "" } };
}

function ActionSplit({ items }) {
    const menu = useRef(null);
    const model = items.filter(Boolean);
    if (!model.length) return null;
    return (
        <>
            <Menu model={model} popup ref={menu} />
            <Button type="button" label="Action" icon="pi pi-chevron-down" iconPos="right" className="p-button-sm" onClick={(event) => menu.current?.toggle(event)} />
        </>
    );
}

export default function Facilities() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(STATUSES[0]);
    const [statusOptions, setStatusOptions] = useState(STATUSES);
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [details, setDetails] = useState(null);
    const [form, setForm] = useState(blank());

    const load = async () => {
        try {
            setLoading(true);
            const result = await call(`/admin/public-portal/${SECTION}`);
            setRows(result.data.items || []);
        } catch (error) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const visible = rows.filter((row) => {
        const statusOk = !status?.id || status.id === "ALL" || row.status === status.id;
        const created = row.createdAt ? String(row.createdAt).slice(0, 10) : "";
        const start = startDate instanceof Date && !Number.isNaN(startDate.getTime()) ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}` : "";
        const end = endDate instanceof Date && !Number.isNaN(endDate.getTime()) ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}` : "";
        const dateOk = (!start || created >= start) && (!end || created <= end);
        const text = `${row.title} ${row.summary}`.toLowerCase();
        return statusOk && dateOk && text.includes(search.trim().toLowerCase());
    });

    const setDetail = (key, value) => setForm((current) => ({ ...current, details: { ...current.details, [key]: value } }));

    const openCreate = () => {
        setForm(blank());
        setShowForm(true);
    };

    const openEdit = (row) => {
        setForm({
            id: row.id,
            title: row.title,
            summary: row.summary || "",
            imageUrl: row.imageUrl || "",
            details: { ...blank().details, ...(row.details || {}) },
        });
        setShowForm(true);
    };

    const save = async (event) => {
        event.preventDefault();
        const body = { title: form.title, summary: form.summary, imageUrl: form.imageUrl, details: form.details };
        try {
            if (form.id) await call(`/admin/public-portal/${SECTION}/${form.id}`, { method: "PATCH", body });
            else await call(`/admin/public-portal/${SECTION}`, { method: "POST", body });
            setShowForm(false);
            setForm(blank());
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const remove = async (row) => {
        try {
            await call(`/admin/public-portal/${SECTION}/${row.id}`, { method: "DELETE" });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const submit = async (row) => {
        try {
            await call(`/admin/public-portal/${SECTION}/${row.id}/submit`, { method: "POST", body: {} });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const searchStatus = (event) => {
        const query = String(event.query || "").toLowerCase();
        setStatusOptions(STATUSES.filter((item) => item.name.toLowerCase().includes(query)));
    };

    const columns = [
        { field: "title", header: "Title", sortableBody: (row) => <div>{row.title}</div> },
        { field: "summary", header: "Summary", sortableBody: (row) => <div>{row.summary}</div> },
        { field: "hours", header: "Hours", sortableBody: (row) => <div>{row.details?.hours || ""}</div> },
        { field: "bookingNote", header: "Booking note", sortableBody: (row) => <div>{row.details?.bookingNote || ""}</div> },
        { field: "status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.status}>{row.status}</div> },
    ];

    const actionBodyTemplate = (row) => (
        <ActionSplit
            items={[
                { label: "Edit", command: () => openEdit(row) },
                ["DRAFT", "REJECTED"].includes(row.status) && { label: "Submit", command: () => submit(row) },
                { label: "Details", command: () => { setDetails(row); setDetailsOpen(true); } },
                { label: "Delete", command: () => remove(row) },
            ]}
        />
    );

    return (
        <div className="hotel-admin">
            <form className="portal-filters" onSubmit={(event) => event.preventDefault()}>
                <InputField
                    id="statusID"
                    name="statusID"
                    type="select"
                    labelFor="statusID"
                    label="Status"
                    width="full"
                    optionLabel="name"
                    value={status}
                    onChange={(event) => setStatus(event.value || event.target?.value)}
                    autoFilteredValue={statusOptions}
                    autoCompleteMethod={searchStatus}
                    selectedAutoValue={STATUSES}
                    setSelectedAutoValue={setStatusOptions}
                />
                <InputField id="startDate" name="startDate" type="date" labelFor="startDate" label="Select Start Date" width="full" value={startDate} onChange={(event) => setStartDate(event.target?.value || event.value || null)} />
                <InputField id="endDate" name="endDate" type="date" labelFor="endDate" label="Select End Date" width="full" value={endDate} onChange={(event) => setEndDate(event.target?.value || event.value || null)} />
                <div>
                    <CommonButton type="submit" className="p-mr-2 p-button-raised p-button-primary" title="Search" label="Search" icon="pi pi-search" />
                </div>
            </form>

            <Table
                emptyMessage="No data found"
                data={visible}
                tableColumns={columns}
                loading={loading}
                dataKey="id"
                isSelectable={false}
                isTopbarShow
                newBtn
                newBtnWithoutAddPermission
                newBtnLabel="New"
                newBtnFunc={openCreate}
                actionButton={actionBodyTemplate}
                sortable={false}
                exportBtn
            />

            <Dialog className="form-modal" header={form.id ? "Update Facilities" : "New Facilities"} visible={showForm} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setShowForm(false)}>
                <form className="ha-form" onSubmit={save}>
                    <InputField id="title" name="title" type="text" labelFor="title" label="Title" required width="full" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                    <InputField id="summary" name="summary" type="textarea" labelFor="summary" label="Summary" width="full" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
                    <ImageUpload value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
                    {FIELDS.map((field) => (
                        <InputField
                            key={field.key}
                            id={field.key}
                            name={field.key}
                            type={field.type || "text"}
                            labelFor={field.key}
                            label={field.label}
                            width="full"
                            value={form.details[field.key] ?? ""}
                            onChange={(event) => setDetail(field.key, event.target.value)}
                        />
                    ))}
                    <div className="span-2">
                        <CommonButton type="submit" label={form.id ? "Save changes" : "Create draft"} icon="pi pi-check" className="p-button-success" />
                    </div>
                </form>
            </Dialog>

            <Dialog header="Facilities details" visible={detailsOpen} style={{ width: "70vw" }} modal onHide={() => setDetailsOpen(false)}>
                {details && (
                    <DataTable
                        value={[
                            { field: "Title", value: details.title },
                            { field: "Summary", value: details.summary || "-" },
                            { field: "Status", value: details.status },
            { field: "Hours", value: details.details?.hours || "-" },
            { field: "Booking note", value: details.details?.bookingNote || "-" },
                        ]}
                        className="p-datatable-striped p-datatable-gridlines"
                        showGridlines
                    >
                        <Column field="field" header="Field" />
                        <Column field="value" header="Value" body={(row) => row.value || "-"} />
                    </DataTable>
                )}
            </Dialog>
        </div>
    );
}
