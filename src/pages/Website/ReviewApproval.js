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

export default function ReviewApproval() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/reviews");
            setRows((result.data || []).filter((row) => !["APPROVED", "REJECTED"].includes(row.moderation_status)));
        } catch (error) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const moderate = async (row, moderationStatus) => {
        try {
            await call(`/admin/reviews/${row.id}`, { method: "PATCH", body: { moderationStatus } });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const visible = rows.filter((row) => `${row.guest_name} ${row.comment}`.toLowerCase().includes(search.trim().toLowerCase()));

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
                actionButton={(row) => (
                    <ActionSplit
                        items={[
                            { label: "Approve", command: () => moderate(row, "APPROVED") },
                            { label: "Reject", command: () => moderate(row, "REJECTED") },
                        ]}
                    />
                )}
                tableColumns={[
                    { field: "guest_name", header: "Guest", sortableBody: (row) => <div>{row.guest_name}</div> },
                    { field: "rating", header: "Rating", sortableBody: (row) => <div>{row.rating}</div> },
                    { field: "comment", header: "Comment", sortableBody: (row) => <div>{row.comment}</div> },
                    { field: "moderation_status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.moderation_status}>{row.moderation_status}</div> },
                ]}
            />
        </div>
    );
}
