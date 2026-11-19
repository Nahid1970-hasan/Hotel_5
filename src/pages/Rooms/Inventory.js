import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { prettyDate } from "../../hotel/api";
import { useAdmin } from "../../hotel/admin/AdminShell";

function blank() {
    return { startDate: "", endDate: "", quantity: 1, reason: "" };
}

export default function Inventory() {
    const { call } = useAdmin();
    const [inventory, setInventory] = useState(null);
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
            const result = await call("/admin/inventory");
            const options = (result.data?.roomTypes || []).map((type) => ({ id: type.id, name: type.name, label: type.name }));
            setInventory(result.data);
            setTypes(options);
            setTypeOptions(options);
        } catch (error) {
            setInventory(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const block = async (event) => {
        event.preventDefault();
        try {
            await call("/admin/inventory/blocks", {
                method: "POST",
                body: { ...form, roomTypeId: Number(roomType?.id), quantity: Number(form.quantity) },
            });
            setForm(blank());
            setShowForm(false);
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const rows = (inventory?.roomTypes || [])
        .filter((type) => type.name.toLowerCase().includes(search.trim().toLowerCase()))
        .map((type) => ({
            id: type.id,
            name: type.name,
            tonight: type.nights?.[0]?.available ?? "",
            nights: type.nights,
        }));
    const dates = inventory?.dates || [];
    const columns = [
        { field: "name", header: "Room type", sortableBody: (row) => <div>{row.name}</div> },
        { field: "tonight", header: "First night available", sortableBody: (row) => <div>{row.tonight}</div> },
    ];

    return (
        <div className="hotel-admin">
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
                newBtnLabel="New block"
                newBtnFunc={() => setShowForm(true)}
                exportBtn
            />
            <div className="calendar">
                {rows.map((type) => (
                    <div className="calendar-row" key={type.id}>
                        <strong>{type.name}</strong>
                        {(type.nights || []).map((night) => (
                            <div key={night.date} className={night.available === 0 ? "day-cell none" : night.available < 2 ? "day-cell low" : "day-cell"} title={night.date}>
                                {night.available}
                            </div>
                        ))}
                    </div>
                ))}
                {dates.length > 0 && <p>{prettyDate(dates[0])} through {prettyDate(dates[dates.length - 1])}</p>}
            </div>
            <Dialog className="form-modal" header="Block dates" visible={showForm} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setShowForm(false)}>
                <form className="ha-form" onSubmit={block}>
                    <InputField
                        id="blockType"
                        name="blockType"
                        type="select"
                        labelFor="blockType"
                        label="Room type"
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
                    <InputField id="quantity" name="quantity" type="number" labelFor="quantity" label="Quantity" width="full" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
                    <InputField id="startDate" name="startDate" type="text" labelFor="startDate" label="From (YYYY-MM-DD)" required width="full" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
                    <InputField id="endDate" name="endDate" type="text" labelFor="endDate" label="Until (YYYY-MM-DD)" required width="full" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
                    <InputField id="reason" name="reason" type="text" labelFor="reason" label="Reason" required width="full" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
                    <div className="span-2">
                        <CommonButton type="submit" label="Block" icon="pi pi-check" className="p-button-success" />
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
