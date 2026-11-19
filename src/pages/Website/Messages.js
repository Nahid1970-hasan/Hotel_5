import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { useAdmin } from "../../hotel/admin/AdminShell";

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

export default function Messages() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/messages");
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

    const mark = async (row) => {
        try {
            await call(`/admin/messages/${row.id}`, { method: "PATCH", body: { status: "READ" } });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const visible = rows.filter((row) => `${row.name} ${row.email} ${row.topic}`.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <div className="hotel-admin">
            <Table
                emptyMessage="No data found"
                data={visible}
                loading={loading}
                dataKey="id"
                isSelectable={false}
                isTopbarShow
                newBtn={false}
                exportBtn
                actionButton={(row) => row.status === "NEW" && <ActionSplit items={[{ label: "Mark read", command: () => mark(row) }]} />}
                tableColumns={[
                    { field: "name", header: "Name", sortableBody: (row) => <div>{row.name}</div> },
                    { field: "email", header: "Email", sortableBody: (row) => <div>{row.email}</div> },
                    { field: "topic", header: "Topic", sortableBody: (row) => <div>{row.topic}</div> },
                    { field: "message", header: "Message", sortableBody: (row) => <div>{row.message}</div> },
                    { field: "status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.status}>{row.status}</div> },
                ]}
            />
        </div>
    );
}
