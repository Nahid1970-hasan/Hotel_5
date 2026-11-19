import { useEffect, useState } from "react";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { useAdmin } from "../../hotel/admin/AdminShell";

const STATUSES = ["OPEN", "CONFIRMED", "DONE", "CANCELLED"];

export default function Services() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/services");
            setRows(result.data?.requests || []);
        } catch (error) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const update = async (row, status) => {
        try {
            await call(`/admin/service-requests/${row.id}`, { method: "PATCH", body: { status } });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const visible = rows.filter((row) => `${row.booking_reference} ${row.guest_name} ${row.service_type}`.toLowerCase().includes(search.trim().toLowerCase()));

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
                    { field: "booking_reference", header: "Booking", sortableBody: (row) => <div>{row.booking_reference}</div> },
                    { field: "guest_name", header: "Guest", sortableBody: (row) => <div>{row.guest_name}</div> },
                    { field: "service_type", header: "Request", sortableBody: (row) => <div>{row.service_type}</div> },
                    { field: "details", header: "Details", sortableBody: (row) => <div>{row.details}</div> },
                    { field: "status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.status}>{row.status}</div> },
                    {
                        field: "setStatus",
                        header: "Set",
                        sortableBody: (row) => (
                            <select aria-label="Request status" value={row.status} onChange={(event) => update(row, event.target.value)}>
                                {STATUSES.map((status) => <option key={status}>{status}</option>)}
                            </select>
                        ),
                    },
                ]}
            />
        </div>
    );
}
