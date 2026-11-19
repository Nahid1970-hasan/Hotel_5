import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { useAdmin } from "../../hotel/admin/AdminShell";

const SEVERITIES = ["LOW", "MEDIUM", "HIGH"].map((id) => ({ id, name: id, label: id }));

function blank() {
    return { issue: "", blockRoom: true };
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

export default function Maintenance() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(blank());
    const [rooms, setRooms] = useState([]);
    const [roomOptions, setRoomOptions] = useState([]);
    const [room, setRoom] = useState(null);
    const [severity, setSeverity] = useState(SEVERITIES[1]);
    const [severityOptions, setSeverityOptions] = useState(SEVERITIES);

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/maintenance");
            setRows(result.data || []);
        } catch (error) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        call("/admin/rooms").then((result) => {
            const options = (result.data || []).map((item) => ({ id: item.id, name: item.room_number, label: item.room_number }));
            setRooms(options);
            setRoomOptions(options);
        }).catch(() => {});
    }, []);

    const save = async (event) => {
        event.preventDefault();
        try {
            await call("/admin/maintenance", {
                method: "POST",
                body: { issue: form.issue, severity: severity?.id || "MEDIUM", roomId: Number(room?.id), blockRoom: Boolean(form.blockRoom) },
            });
            setForm(blank());
            setShowForm(false);
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const resolve = async (row) => {
        try {
            await call(`/admin/maintenance/${row.id}/resolve`, { method: "POST", body: {} });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const visible = rows.filter((row) => `${row.room_number} ${row.issue}`.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <div className="hotel-admin">
            <Table
                emptyMessage="No data found"
                data={visible}
                loading={loading}
                dataKey="id"
                isSelectable={false}
                isTopbarShow
                newBtn
                newBtnWithoutAddPermission
                newBtnFunc={() => setShowForm(true)}
                exportBtn
                actionButton={(row) => row.status !== "RESOLVED" && <ActionSplit items={[{ label: "Resolve", command: () => resolve(row) }]} />}
                tableColumns={[
                    { field: "room_number", header: "Room", sortableBody: (row) => <div>{row.room_number}</div> },
                    { field: "issue", header: "Issue", sortableBody: (row) => <div>{row.issue}</div> },
                    { field: "severity", header: "Severity", sortableBody: (row) => <div>{row.severity}</div> },
                    { field: "status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.status}>{row.status}</div> },
                ]}
            />
            <Dialog className="form-modal" header="New ticket" visible={showForm} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setShowForm(false)}>
                <form className="ha-form" onSubmit={save}>
                    <InputField
                        id="ticketRoom"
                        name="ticketRoom"
                        type="select"
                        labelFor="ticketRoom"
                        label="Room"
                        required
                        width="full"
                        optionLabel="name"
                        value={room}
                        onChange={(event) => setRoom(event.value || event.target?.value)}
                        autoFilteredValue={roomOptions}
                        autoCompleteMethod={(event) => {
                            const query = String(event.query || "").toLowerCase();
                            setRoomOptions(rooms.filter((item) => String(item.name).toLowerCase().includes(query)));
                        }}
                        selectedAutoValue={rooms}
                        setSelectedAutoValue={setRoomOptions}
                    />
                    <InputField
                        id="severity"
                        name="severity"
                        type="select"
                        labelFor="severity"
                        label="Severity"
                        width="full"
                        optionLabel="name"
                        value={severity}
                        onChange={(event) => setSeverity(event.value || event.target?.value)}
                        autoFilteredValue={severityOptions}
                        autoCompleteMethod={(event) => {
                            const query = String(event.query || "").toLowerCase();
                            setSeverityOptions(SEVERITIES.filter((item) => item.name.toLowerCase().includes(query)));
                        }}
                        selectedAutoValue={SEVERITIES}
                        setSelectedAutoValue={setSeverityOptions}
                    />
                    <InputField id="issue" name="issue" type="text" labelFor="issue" label="Issue" required width="full" value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} />
                    <InputField id="blockRoom" name="blockRoom" type="checkbox" labelFor="blockRoom" label="Take the room out of service" checked={form.blockRoom} onChange={(event) => setForm({ ...form, blockRoom: event.checked })} />
                    <div className="span-2">
                        <CommonButton type="submit" label="Open ticket" icon="pi pi-check" className="p-button-success" />
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
