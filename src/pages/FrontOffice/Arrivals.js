import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { Table } from "components/Table/Table";
import { prettyDate, money } from "../../hotel/api";
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

export default function Arrivals() {
    const { call } = useAdmin();
    const [today, setToday] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const [dash, bookings] = await Promise.all([call("/admin/dashboard"), call("/admin/bookings")]);
            setToday(dash.data?.today || "");
            setRows(bookings.data || []);
        } catch (error) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const act = async (path) => {
        try {
            await call(path, { method: "POST", body: {} });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const visible = rows.filter((row) => {
        const todayRow = row.checkIn === today || row.checkOut === today;
        const text = `${row.reference} ${row.guest?.name || ""}`.toLowerCase();
        return todayRow && text.includes(search.trim().toLowerCase());
    });

    const columns = [
        { field: "reference", header: "Reference", sortableBody: (row) => <div>{row.reference}</div> },
        { field: "guest", header: "Guest", sortableBody: (row) => <div>{row.guest?.name}</div> },
        { field: "stay", header: "Stay", sortableBody: (row) => <div>{prettyDate(row.checkIn)} – {prettyDate(row.checkOut)}</div> },
        { field: "room", header: "Room", sortableBody: (row) => <div>{row.lines?.[0]?.roomType || ""} {row.lines?.map((line) => line.roomNumber).filter(Boolean).join(", ")}</div> },
        { field: "total", header: "Total", sortableBody: (row) => <div>{money(row.total, row.currency)}</div> },
        { field: "status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.status}>{row.status}</div> },
    ];

    const actionBodyTemplate = (row) => (
        <ActionSplit
            items={[
                row.status === "CONFIRMED" && { label: "Check in", command: () => act(`/admin/bookings/${row.id}/check-in`) },
                row.status === "CHECKED_IN" && { label: "Check out", command: () => act(`/admin/bookings/${row.id}/check-out`) },
                ["CONFIRMED", "PENDING"].includes(row.status) && { label: "Cancel", command: () => act(`/admin/bookings/${row.id}/cancel`) },
            ]}
        />
    );

    return (
        <div className="hotel-admin">
            <Table emptyMessage="No data found" data={visible} tableColumns={columns} loading={loading} dataKey="id" isSelectable={false} isTopbarShow newBtn={false} actionButton={actionBodyTemplate} exportBtn />
        </div>
    );
}
