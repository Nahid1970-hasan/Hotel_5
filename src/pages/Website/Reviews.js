import { useEffect, useState } from "react";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { useAdmin } from "../../hotel/admin/AdminShell";

export default function Reviews() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/reviews");
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

    const visible = rows.filter((row) => `${row.guest_name} ${row.title} ${row.comment}`.toLowerCase().includes(search.trim().toLowerCase()));

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
                    { field: "guest_name", header: "Guest", sortableBody: (row) => <div>{row.guest_name}</div> },
                    { field: "rating", header: "Rating", sortableBody: (row) => <div>{row.rating}</div> },
                    { field: "title", header: "Title", sortableBody: (row) => <div>{row.title}</div> },
                    { field: "comment", header: "Comment", sortableBody: (row) => <div>{row.comment}</div> },
                    { field: "moderation_status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.moderation_status}>{row.moderation_status}</div> },
                ]}
            />
        </div>
    );
}
