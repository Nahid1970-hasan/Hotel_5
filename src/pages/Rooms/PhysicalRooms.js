import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { useAdmin } from "../../hotel/admin/AdminShell";

const STATUSES = ["READY", "DIRTY", "CLEANING", "INSPECTING", "OUT_OF_SERVICE"].map((id) => ({ id, name: id, label: id }));

function blank() {
    return { roomNumber: "", floor: "", wing: "Main" };
}

export default function PhysicalRooms() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(blank());
    const [types, setTypes] = useState([]);
    const [typeOptions, setTypeOptions] = useState([]);
    const [roomType, setRoomType] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/rooms");
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
            const options = (result.data || []).map((type) => ({ id: type.id, name: type.name, label: type.name }));
            setTypes(options);
            setTypeOptions(options);
        }).catch(() => {});
    }, []);

    const save = async (event) => {
        event.preventDefault();
        try {
            await call("/admin/rooms", { method: "POST", body: { ...form, roomTypeId: Number(roomType?.id) } });
            setForm(blank());
            setRoomType(null);
            setShowForm(false);
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const updateStatus = async (row, operationalStatus) => {
        try {
            await call(`/admin/rooms/${row.id}`, { method: "PATCH", body: { operationalStatus } });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const visible = rows.filter((row) => `${row.room_number} ${row.room_type_name}`.toLowerCase().includes(search.trim().toLowerCase()));
    const columns = [
        { field: "room_number", header: "Room", sortableBody: (row) => <div>{row.room_number}</div> },
        { field: "room_type_name", header: "Type", sortableBody: (row) => <div>{row.room_type_name}</div> },
        { field: "floor", header: "Floor", sortableBody: (row) => <div>{row.floor}</div> },
        { field: "operational_status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.operational_status}>{row.operational_status}</div> },
        {
            field: "setStatus",
            header: "Set",
            sortableBody: (row) => (
                <select aria-label={`Status for ${row.room_number}`} value={row.operational_status} onChange={(event) => updateStatus(row, event.target.value)}>
                    {STATUSES.map((status) => <option key={status.id}>{status.id}</option>)}
                </select>
            ),
        },
    ];

    return (
        <div className="hotel-admin">
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
                newBtnFunc={() => setShowForm(true)}
                exportBtn
            />
            <Dialog className="form-modal" header="New room" visible={showForm} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setShowForm(false)}>
                <form className="ha-form" onSubmit={save}>
                    <InputField id="roomNumber" name="roomNumber" type="text" labelFor="roomNumber" label="Number" required width="full" value={form.roomNumber} onChange={(event) => setForm({ ...form, roomNumber: event.target.value })} />
                    <InputField
                        id="roomType"
                        name="roomType"
                        type="select"
                        labelFor="roomType"
                        label="Type"
                        required
                        width="full"
                        optionLabel="name"
                        value={roomType}
                        onChange={(event) => setRoomType(event.value || event.target?.value)}
                        autoFilteredValue={typeOptions}
                        autoCompleteMethod={(event) => {
                            const query = String(event.query || "").toLowerCase();
                            setTypeOptions(types.filter((item) => item.name.toLowerCase().includes(query)));
                        }}
                        selectedAutoValue={types}
                        setSelectedAutoValue={setTypeOptions}
                    />
                    <InputField id="floor" name="floor" type="text" labelFor="floor" label="Floor" width="full" value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} />
                    <InputField id="wing" name="wing" type="text" labelFor="wing" label="Wing" width="full" value={form.wing} onChange={(event) => setForm({ ...form, wing: event.target.value })} />
                    <div className="span-2">
                        <CommonButton type="submit" label="Add room" icon="pi pi-check" className="p-button-success" />
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
