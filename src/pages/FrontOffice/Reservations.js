import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { money, prettyDate } from "../../hotel/api";
import { useAdmin } from "../../hotel/admin/AdminShell";

const STATUSES = [
    { id: "ALL", name: "All", label: "All" },
    { id: "PENDING", name: "Pending", label: "Pending" },
    { id: "CONFIRMED", name: "Confirmed", label: "Confirmed" },
    { id: "CHECKED_IN", name: "Checked in", label: "Checked in" },
    { id: "CHECKED_OUT", name: "Checked out", label: "Checked out" },
    { id: "CANCELLED", name: "Cancelled", label: "Cancelled" },
];

const SOURCES = [
    { id: "walk-in", name: "Walk-in", label: "Walk-in" },
    { id: "phone", name: "Phone", label: "Phone" },
];

function blankForm() {
    return { guestName: "", guestEmail: "", guestPhone: "", checkIn: "", checkOut: "", adults: 2, children: 0, rooms: 1 };
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

export default function Reservations() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState(STATUSES[0]);
    const [statusOptions, setStatusOptions] = useState(STATUSES);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(blankForm());
    const [roomTypes, setRoomTypes] = useState([]);
    const [roomTypeOptions, setRoomTypeOptions] = useState([]);
    const [roomType, setRoomType] = useState(null);
    const [plans, setPlans] = useState([]);
    const [planOptions, setPlanOptions] = useState([]);
    const [plan, setPlan] = useState(null);
    const [source, setSource] = useState(SOURCES[0]);
    const [sourceOptions, setSourceOptions] = useState(SOURCES);

    const load = async () => {
        try {
            setLoading(true);
            const statusId = status?.id && status.id !== "ALL" ? status.id : "";
            const result = await call(`/admin/bookings?q=${encodeURIComponent(search)}&status=${encodeURIComponent(statusId)}`);
            setRows(result.data || []);
        } catch (error) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        call("/admin/room-types").then((result) => {
            const options = (result.data || []).map((room) => ({ id: room.id, name: room.name, label: room.name }));
            setRoomTypes(options);
            setRoomTypeOptions(options);
        }).catch(() => {});
        call("/admin/rates").then((result) => {
            const options = (result.data?.plans || []).map((item) => ({ id: item.id, name: item.name, label: item.name }));
            setPlans(options);
            setPlanOptions(options);
        }).catch(() => {});
    }, []);

    const act = async (path) => {
        try {
            await call(path, { method: "POST", body: {} });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const create = async (event) => {
        event.preventDefault();
        try {
            const result = await call("/admin/bookings", {
                method: "POST",
                notify: "error",
                body: {
                    roomTypeId: Number(roomType?.id),
                    ratePlanId: Number(plan?.id),
                    checkIn: form.checkIn,
                    checkOut: form.checkOut,
                    adults: Number(form.adults),
                    children: Number(form.children),
                    rooms: Number(form.rooms),
                    source: source?.id || "walk-in",
                    method: "pay_at_hotel",
                    guest: { name: form.guestName, email: form.guestEmail, phone: form.guestPhone },
                },
            });
            toast.success(`${result.data.reference} created.`);
            setForm(blankForm());
            setShowForm(false);
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const filterList = (list, setter) => (event) => {
        const query = String(event.query || "").toLowerCase();
        setter(list.filter((item) => item.name.toLowerCase().includes(query)));
    };

    const columns = [
        { field: "reference", header: "Reference", sortableBody: (row) => <div>{row.reference}</div> },
        { field: "guest", header: "Guest", sortableBody: (row) => <div>{row.guest?.name}</div> },
        { field: "stay", header: "Stay", sortableBody: (row) => <div>{prettyDate(row.checkIn)} – {prettyDate(row.checkOut)}</div> },
        { field: "room", header: "Room", sortableBody: (row) => <div>{row.lines?.[0]?.roomType || ""} {row.lines?.map((line) => line.roomNumber).filter(Boolean).join(", ")}</div> },
        { field: "total", header: "Total", sortableBody: (row) => <div>{money(row.total, row.currency)}</div> },
        { field: "status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.status}>{row.status}</div> },
    ];

    const actionBodyTemplate = (row) => (
        <ActionSplit
            items={[
                row.status === "CONFIRMED" && { label: "Check in", command: () => act(`/admin/bookings/${row.id}/check-in`) },
                row.status === "CHECKED_IN" && { label: "Check out", command: () => act(`/admin/bookings/${row.id}/check-out`) },
                ["CONFIRMED", "PENDING"].includes(row.status) && { label: "Cancel", command: () => act(`/admin/bookings/${row.id}/cancel`) },
            ]}
        />
    );

    return (
        <div className="hotel-admin">
            <form className="portal-filters" onSubmit={(event) => { event.preventDefault(); load(); }}>
                <InputField
                    id="reservationStatus"
                    name="reservationStatus"
                    type="select"
                    labelFor="reservationStatus"
                    label="Status"
                    width="full"
                    optionLabel="name"
                    value={status}
                    onChange={(event) => setStatus(event.value || event.target?.value)}
                    autoFilteredValue={statusOptions}
                    autoCompleteMethod={filterList(STATUSES, setStatusOptions)}
                    selectedAutoValue={STATUSES}
                    setSelectedAutoValue={setStatusOptions}
                />
                <div>
                    <CommonButton type="submit" label="Search" icon="pi pi-search" className="p-button-raised p-button-primary" />
                </div>
            </form>

            <Table
                emptyMessage="No data found"
                data={rows}
                tableColumns={columns}
                loading={loading}
                dataKey="id"
                isSelectable={false}
                isTopbarShow
                newBtn
                newBtnWithoutAddPermission
                newBtnLabel="New"
                newBtnFunc={() => { setForm(blankForm()); setShowForm(true); }}
                actionButton={actionBodyTemplate}
                exportBtn
            />

            <Dialog className="form-modal" header="New reservation" visible={showForm} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setShowForm(false)}>
                <form className="ha-form" onSubmit={create}>
                    <InputField id="guestName" name="guestName" type="text" labelFor="guestName" label="Guest" required width="full" value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} />
                    <InputField id="guestEmail" name="guestEmail" type="text" labelFor="guestEmail" label="Email" required width="full" value={form.guestEmail} onChange={(event) => setForm({ ...form, guestEmail: event.target.value })} />
                    <InputField id="guestPhone" name="guestPhone" type="text" labelFor="guestPhone" label="Phone" width="full" value={form.guestPhone} onChange={(event) => setForm({ ...form, guestPhone: event.target.value })} />
                    <InputField id="source" name="source" type="select" labelFor="source" label="Source" width="full" optionLabel="name" value={source} onChange={(event) => setSource(event.value || event.target?.value)} autoFilteredValue={sourceOptions} autoCompleteMethod={filterList(SOURCES, setSourceOptions)} selectedAutoValue={SOURCES} setSelectedAutoValue={setSourceOptions} />
                    <InputField id="roomTypeId" name="roomTypeId" type="select" labelFor="roomTypeId" label="Room type" required width="full" optionLabel="name" value={roomType} onChange={(event) => setRoomType(event.value || event.target?.value)} autoFilteredValue={roomTypeOptions} autoCompleteMethod={filterList(roomTypes, setRoomTypeOptions)} selectedAutoValue={roomTypes} setSelectedAutoValue={setRoomTypeOptions} />
                    <InputField id="ratePlanId" name="ratePlanId" type="select" labelFor="ratePlanId" label="Rate" required width="full" optionLabel="name" value={plan} onChange={(event) => setPlan(event.value || event.target?.value)} autoFilteredValue={planOptions} autoCompleteMethod={filterList(plans, setPlanOptions)} selectedAutoValue={plans} setSelectedAutoValue={setPlanOptions} />
                    <InputField id="checkIn" name="checkIn" type="text" labelFor="checkIn" label="Check in (YYYY-MM-DD)" required width="full" value={form.checkIn} onChange={(event) => setForm({ ...form, checkIn: event.target.value })} />
                    <InputField id="checkOut" name="checkOut" type="text" labelFor="checkOut" label="Check out (YYYY-MM-DD)" required width="full" value={form.checkOut} onChange={(event) => setForm({ ...form, checkOut: event.target.value })} />
                    <InputField id="adults" name="adults" type="number" labelFor="adults" label="Adults" width="full" value={form.adults} onChange={(event) => setForm({ ...form, adults: event.target.value })} />
                    <InputField id="rooms" name="rooms" type="number" labelFor="rooms" label="Rooms" width="full" value={form.rooms} onChange={(event) => setForm({ ...form, rooms: event.target.value })} />
                    <div className="span-2">
                        <CommonButton type="submit" label="Create reservation" icon="pi pi-check" className="p-button-success" />
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
