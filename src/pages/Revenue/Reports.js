import { useEffect, useState } from "react";
import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { Flex } from "../../components/Flex";
import InfoCard from "../../components/InfoCard";
import { money } from "../../hotel/api";
import { useAdmin } from "../../hotel/admin/AdminShell";

export default function Reports() {
    const { call } = useAdmin();
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const result = await call(`/admin/reports/revenue?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
            setData(result.data);
        } catch (error) {
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const cards = data
        ? [
            ["Occupancy", `${data.occupancy}%`],
            ["Rooms sold", data.roomsSold],
            ["Available nights", data.availableRoomNights],
            ["Room revenue", money(data.roomRevenue, data.currency)],
            ["ADR", money(data.adr, data.currency)],
            ["RevPAR", money(data.revpar, data.currency)],
            ["Collected", money(data.netCollected, data.currency)],
            ["Cancellations", data.cancellations],
        ]
        : [];

    return (
        <div className="hotel-admin">
            <form className="portal-filters" onSubmit={(event) => { event.preventDefault(); load(); }}>
                <InputField id="reportFrom" name="reportFrom" type="text" labelFor="reportFrom" label="From (YYYY-MM-DD)" width="full" value={from} onChange={(event) => setFrom(event.target.value)} />
                <InputField id="reportTo" name="reportTo" type="text" labelFor="reportTo" label="To (YYYY-MM-DD)" width="full" value={to} onChange={(event) => setTo(event.target.value)} />
                <div>
                    <CommonButton type="submit" label="Search" icon="pi pi-search" className="p-button-raised p-button-primary" />
                </div>
            </form>
            <Flex row>
                {cards.map(([label, value]) => (
                    <Flex key={label} md={3} xs={12}>
                        <InfoCard title label={label} bodyClassName="kpi-body"><strong>{value}</strong></InfoCard>
                    </Flex>
                ))}
            </Flex>
            <Table
                emptyMessage="No data found"
                tableHeaderName="Sources"
                data={(data?.sources || []).map((item) => ({ id: item.source, ...item }))}
                loading={loading}
                dataKey="id"
                isSelectable={false}
                newBtn={false}
                exportBtn
                tableColumns={[
                    { field: "source", header: "Source", sortableBody: (row) => <div>{row.source}</div> },
                    { field: "count", header: "Bookings", sortableBody: (row) => <div>{row.count}</div> },
                ]}
            />
        </div>
    );
}
