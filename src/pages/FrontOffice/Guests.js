import { useEffect, useState } from "react";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { useAdmin } from "../../hotel/admin/AdminShell";

export default function Guests() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const result = await call(`/admin/guests?q=${encodeURIComponent(search)}`);
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

    const columns = [
        { field: "name", header: "Name", sortableBody: (row) => <div>{row.name}</div> },
        { field: "email", header: "Email", sortableBody: (row) => <div>{row.email}</div> },
        { field: "phone", header: "Phone", sortableBody: (row) => <div>{row.phone}</div> },
        { field: "nationality", header: "Nationality", sortableBody: (row) => <div>{row.nationality}</div> },
        { field: "stays", header: "Stays", sortableBody: (row) => <div>{row.stays}</div> },
    ];

    return (
        <div className="hotel-admin">
            <Table emptyMessage="No data found" data={rows} tableColumns={columns} loading={loading} dataKey="id" isSelectable={false} isTopbarShow newBtn={false} exportBtn />
        </div>
    );
}
