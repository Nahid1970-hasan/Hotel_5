import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { money } from "../../hotel/api";
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

export default function Payments() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/payments");
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
            await call(`/admin/payments/${row.id}/mark-paid`, { method: "POST", body: {} });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const refund = async (row) => {
        const amount = window.prompt("Refund amount", String(row.amount));
        if (!amount) return;
        try {
            await call(`/admin/payments/${row.id}/refunds`, { method: "POST", body: { amount: Number(amount), reason: "Desk refund" } });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const visible = rows.filter((row) => `${row.booking_reference} ${row.guest_name}`.toLowerCase().includes(search.trim().toLowerCase()));
    const columns = [
        { field: "booking_reference", header: "Booking", sortableBody: (row) => <div>{row.booking_reference}</div> },
        { field: "guest_name", header: "Guest", sortableBody: (row) => <div>{row.guest_name}</div> },
        { field: "method", header: "Method", sortableBody: (row) => <div>{row.method}</div> },
        { field: "amount", header: "Amount", sortableBody: (row) => <div>{money(row.amount, row.currency)}</div> },
        { field: "status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.status}>{row.status}</div> },
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
                newBtn={false}
                exportBtn
                actionButton={(row) => (
                    <ActionSplit
                        items={[
                            row.status === "UNPAID" && { label: "Mark paid", command: () => mark(row) },
                            ["PAID", "PARTIALLY_REFUNDED"].includes(row.status) && { label: "Refund", command: () => refund(row) },
                        ]}
                    />
                )}
            />
        </div>
    );
}
