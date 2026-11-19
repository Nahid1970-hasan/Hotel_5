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

export default function Housekeeping() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/housekeeping");
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

    const advance = async (row) => {
        try {
            await call(`/admin/housekeeping/${row.id}/advance`, { method: "POST", body: {} });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const visible = rows.filter((row) => `${row.room_number} ${row.status}`.toLowerCase().includes(search.trim().toLowerCase()));

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
                actionButton={(row) => row.status !== "READY" && <ActionSplit items={[{ label: "Advance", command: () => advance(row) }]} />}
                tableColumns={[
                    { field: "room_number", header: "Room", sortableBody: (row) => <div>{row.room_number}</div> },
                    { field: "status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.status}>{row.status}</div> },
                    { field: "priority", header: "Priority", sortableBody: (row) => <div>{row.priority}</div> },
                    { field: "notes", header: "Notes", sortableBody: (row) => <div>{row.notes}</div> },
                ]}
            />
        </div>
    );
}
