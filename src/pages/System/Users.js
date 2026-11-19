import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { useAdmin } from "../../hotel/admin/AdminShell";

function blank() {
    return { name: "", username: "", phone: "", email: "", password: "" };
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

export default function Users() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(blank());
    const [roles, setRoles] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [role, setRole] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/users");
            setRows(result.data || []);
        } catch (error) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        call("/admin/roles").then((result) => {
            const options = (result.data || []).map((item) => ({ id: item.id, name: item.name, label: item.name }));
            setRoles(options);
            setRoleOptions(options);
            setRole(options.find((item) => item.name === "Front Desk") || options[0] || null);
        }).catch(() => {});
    }, []);

    const save = async (event) => {
        event.preventDefault();
        try {
            await call("/admin/users", { method: "POST", body: { ...form, role: role?.name || "Front Desk" } });
            setForm(blank());
            setShowForm(false);
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const toggle = async (row) => {
        try {
            await call(`/admin/users/${row.id}`, { method: "PATCH", body: { status: row.status === "ACTIVE" ? "DISABLED" : "ACTIVE" } });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const visible = rows.filter((row) => `${row.name} ${row.username} ${row.email}`.toLowerCase().includes(search.trim().toLowerCase()));

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
                actionButton={(row) => <ActionSplit items={[{ label: row.status === "ACTIVE" ? "Disable" : "Enable", command: () => toggle(row) }]} />}
                tableColumns={[
                    { field: "name", header: "Full name", sortableBody: (row) => <div>{row.name}</div> },
                    { field: "username", header: "Username", sortableBody: (row) => <div>{row.username}</div> },
                    { field: "phone", header: "Phone", sortableBody: (row) => <div>{row.phone}</div> },
                    { field: "email", header: "Email", sortableBody: (row) => <div>{row.email}</div> },
                    { field: "roles", header: "Role", sortableBody: (row) => <div>{(row.roles || []).join(", ")}</div> },
                    { field: "status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.status}>{row.status}</div> },
                ]}
            />
            <Dialog className="form-modal" header="New staff account" visible={showForm} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setShowForm(false)}>
                <form className="ha-form" onSubmit={save}>
                    <InputField id="fullName" name="fullName" type="text" labelFor="fullName" label="Full name" required width="full" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    <InputField id="username" name="username" type="text" labelFor="username" label="Username" required minLength={3} width="full" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
                    <InputField id="phone" name="phone" type="text" labelFor="phone" label="Phone" width="full" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                    <InputField id="email" name="email" type="text" labelFor="email" label="Email" required width="full" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                    <InputField id="password" name="password" type="password" labelFor="password" label="Password" required minLength={8} width="full" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                    <InputField
                        id="role"
                        name="role"
                        type="select"
                        labelFor="role"
                        label="Role"
                        width="full"
                        optionLabel="name"
                        value={role}
                        onChange={(event) => setRole(event.value || event.target?.value)}
                        autoFilteredValue={roleOptions}
                        autoCompleteMethod={(event) => {
                            const query = String(event.query || "").toLowerCase();
                            setRoleOptions(roles.filter((item) => item.name.toLowerCase().includes(query)));
                        }}
                        selectedAutoValue={roles}
                        setSelectedAutoValue={setRoleOptions}
                    />
                    <div className="span-2">
                        <CommonButton type="submit" label="Create account" icon="pi pi-check" className="p-button-success" />
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
