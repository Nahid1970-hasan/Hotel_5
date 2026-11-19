import { useEffect, useState } from "react";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { useAdmin } from "../../hotel/admin/AdminShell";

export default function AuditLogs() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/audit-logs");
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

    const visible = rows.filter((row) => `${row.actor_name} ${row.action} ${row.entity_type}`.toLowerCase().includes(search.trim().toLowerCase()));

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
                tableColumns={[
                    { field: "created_at", header: "When", sortableBody: (row) => <div>{row.created_at}</div> },
                    { field: "actor_name", header: "Who", sortableBody: (row) => <div>{row.actor_name}</div> },
                    { field: "action", header: "Action", sortableBody: (row) => <div>{row.action}</div> },
                    { field: "entity_type", header: "Record", sortableBody: (row) => <div>{row.entity_type}</div> },
                    { field: "entity_id", header: "Id", sortableBody: (row) => <div>{row.entity_id}</div> },
                ]}
            />
        </div>
    );
}
