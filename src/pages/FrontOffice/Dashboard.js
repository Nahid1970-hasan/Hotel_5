import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import Card from "../../components/Card";
import { Flex } from "../../components/Flex";
import InfoCard from "../../components/InfoCard";
import { money, prettyDate } from "../../hotel/api";
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

export default function Dashboard() {
    const { call } = useAdmin();
    const [board, setBoard] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const [dash, bookings] = await Promise.all([call("/admin/dashboard"), call("/admin/bookings")]);
            setBoard(dash.data);
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

    const today = board?.today;
    const match = (row) => `${row.reference} ${row.guest?.name || ""}`.toLowerCase().includes(search.trim().toLowerCase());
    const arrivals = rows.filter((row) => row.checkIn === today && ["CONFIRMED", "CHECKED_IN"].includes(row.status) && match(row));
    const departures = rows.filter((row) => row.checkOut === today && row.status === "CHECKED_IN" && match(row));
    const kpis = board
        ? [
            ["Arrivals", board.arrivals, "Expected today"],
            ["Departures", board.departures, "Leaving today"],
            ["In house", board.inHouse, "Checked in"],
            ["Occupancy", `${board.occupancy}%`, "In-house rooms"],
            ["Ready", board.rooms.ready, "Can be assigned"],
            ["Out of service", board.rooms.outOfService, "Blocked rooms"],
            ["Pending holds", board.pending, "Awaiting payment"],
            ["Month revenue", board.monthRevenue == null ? "—" : money(board.monthRevenue, board.currency), "Collected less refunds"],
        ]
        : [];

    const columns = [
        { field: "reference", header: "Reference", sortableBody: (row) => <div>{row.reference}</div> },
        { field: "guest", header: "Guest", sortableBody: (row) => <div>{row.guest?.name}</div> },
        { field: "stay", header: "Stay", sortableBody: (row) => <div>{prettyDate(row.checkIn)} – {prettyDate(row.checkOut)}</div> },
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
            <Flex row>
                {kpis.map(([label, value, note]) => (
                    <Flex key={label} md={3} xs={12}>
                        <InfoCard title label={label} bodyClassName="kpi-body">
                            <strong>{value}</strong>
                            <span>{note}</span>
                        </InfoCard>
                    </Flex>
                ))}
            </Flex>
            <div className="admin-grid">
                <Card title="Arrivals" subTitle={today ? prettyDate(today) : "Today"}>
                    <Table emptyMessage="No data found" data={arrivals} tableColumns={columns} loading={loading} dataKey="id" isSelectable={false} newBtn={false} actionButton={actionBodyTemplate} exportBtn={false} />
                </Card>
                <Card title="Departures" subTitle="Guests due to leave">
                    <Table emptyMessage="No data found" data={departures} tableColumns={columns} loading={loading} dataKey="id" isSelectable={false} newBtn={false} actionButton={actionBodyTemplate} exportBtn={false} />
                </Card>
            </div>
            {board && (
                <p>Alerts: {board.alerts.unpaidInHouse} unpaid in-house · {board.alerts.openMaintenance} open faults · {board.alerts.pendingReviews} reviews waiting · {board.alerts.newMessages} new messages.</p>
            )}
        </div>
    );
}
