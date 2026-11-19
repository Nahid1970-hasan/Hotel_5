import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import ImageUpload from "../../hotel/ImageUpload";
import { money } from "../../hotel/api";
import { useAdmin } from "../../hotel/admin/AdminShell";

function blank() {
    return { name: "", basePrice: "", capacityAdults: 2, capacityChildren: 0, bedConfig: "1 king", sizeSqm: 30, view: "Ocean", category: "Room", summary: "", imageUrl: "" };
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

export default function RoomTypes() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(blank());

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/room-types");
            setRows(result.data || []);
        } catch (error) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const save = async (event) => {
        event.preventDefault();
        try {
            await call("/admin/room-types", { method: "POST", body: { ...form, basePrice: Number(form.basePrice) } });
            setForm(blank());
            setShowForm(false);
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const toggle = async (row) => {
        try {
            await call(`/admin/room-types/${row.id}`, { method: "PATCH", body: { active: !row.active } });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const visible = rows.filter((row) => `${row.name} ${row.category}`.toLowerCase().includes(search.trim().toLowerCase()));
    const columns = [
        { field: "name", header: "Name", sortableBody: (row) => <div>{row.name}</div> },
        { field: "category", header: "Category", sortableBody: (row) => <div>{row.category}</div> },
        { field: "occupancy", header: "Occupancy", sortableBody: (row) => <div>{row.capacityAdults}+{row.capacityChildren}</div> },
        { field: "price", header: "From", sortableBody: (row) => <div>{money(row.basePrice, row.currency)}</div> },
        { field: "active", header: "Shown", sortableBody: (row) => <div>{row.active ? "Yes" : "No"}</div> },
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
                newBtnFunc={() => { setForm(blank()); setShowForm(true); }}
                actionButton={(row) => <ActionSplit items={[{ label: row.active ? "Hide" : "Show", command: () => toggle(row) }]} />}
                exportBtn
            />
            <Dialog className="form-modal" header="New room type" visible={showForm} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setShowForm(false)}>
                <form className="ha-form" onSubmit={save}>
                    <InputField id="name" name="name" type="text" labelFor="name" label="Name" required width="full" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    <InputField id="basePrice" name="basePrice" type="number" labelFor="basePrice" label="Nightly price" required width="full" value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} />
                    <InputField id="capacityAdults" name="capacityAdults" type="number" labelFor="capacityAdults" label="Adults" width="full" value={form.capacityAdults} onChange={(event) => setForm({ ...form, capacityAdults: event.target.value })} />
                    <InputField id="capacityChildren" name="capacityChildren" type="number" labelFor="capacityChildren" label="Children" width="full" value={form.capacityChildren} onChange={(event) => setForm({ ...form, capacityChildren: event.target.value })} />
                    <InputField id="bedConfig" name="bedConfig" type="text" labelFor="bedConfig" label="Beds" width="full" value={form.bedConfig} onChange={(event) => setForm({ ...form, bedConfig: event.target.value })} />
                    <InputField id="sizeSqm" name="sizeSqm" type="number" labelFor="sizeSqm" label="Size m²" width="full" value={form.sizeSqm} onChange={(event) => setForm({ ...form, sizeSqm: event.target.value })} />
                    <InputField id="summary" name="summary" type="textarea" labelFor="summary" label="Summary" width="full" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
                    <ImageUpload value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
                    <div className="span-2">
                        <CommonButton type="submit" label="Save room type" icon="pi pi-check" className="p-button-success" />
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
