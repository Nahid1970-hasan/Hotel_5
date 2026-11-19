import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { useAdmin } from "../../hotel/admin/AdminShell";

const SECTIONS = [
    { id: "ALL", name: "All sections", label: "All sections" },
    { id: "rooms-and-suites", name: "Rooms & Suites", label: "Rooms & Suites" },
    { id: "dining", name: "Dining", label: "Dining" },
    { id: "experiences", name: "Experiences", label: "Experiences" },
    { id: "facilities", name: "Facilities", label: "Facilities" },
    { id: "offers", name: "Offers", label: "Offers" },
    { id: "gallery", name: "Gallery", label: "Gallery" },
    { id: "destination", name: "Destination", label: "Destination" },
    { id: "contact", name: "Contact", label: "Contact" },
];

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

export default function Approval() {
    const { call } = useAdmin();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [section, setSection] = useState(SECTIONS[0]);
    const [sectionOptions, setSectionOptions] = useState(SECTIONS);
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [details, setDetails] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            const groups = await Promise.all(
                SECTIONS.filter((item) => item.id !== "ALL").map(async (item) => {
                    const result = await call(`/admin/public-portal/${item.id}`);
                    return (result.data.items || [])
                        .filter((row) => row.status === "SUBMITTED")
                        .map((row) => ({ ...row, section: item.id, sectionLabel: item.name, rowKey: `${item.id}-${row.id}` }));
                })
            );
            setRows(groups.flat());
        } catch (error) {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const decide = async (row, status) => {
        try {
            await call(`/admin/public-portal/${row.section}/${row.id}/approval`, {
                method: "POST",
                body: { status, note: status === "REJECTED" ? "Needs a revision" : "" },
            });
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const searchSection = (event) => {
        const query = String(event.query || "").toLowerCase();
        setSectionOptions(SECTIONS.filter((item) => item.name.toLowerCase().includes(query)));
    };

    const visible = rows.filter((row) => {
        const sectionOk = !section?.id || section.id === "ALL" || row.section === section.id;
        const created = row.createdAt ? String(row.createdAt).slice(0, 10) : "";
        const start = startDate instanceof Date && !Number.isNaN(startDate.getTime()) ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}` : "";
        const end = endDate instanceof Date && !Number.isNaN(endDate.getTime()) ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}` : "";
        const dateOk = (!start || created >= start) && (!end || created <= end);
        const text = `${row.title} ${row.summary}`.toLowerCase();
        return sectionOk && dateOk && text.includes(search.trim().toLowerCase());
    });

    const columns = [
        { field: "sectionLabel", header: "Section", sortableBody: (row) => <div>{row.sectionLabel}</div> },
        { field: "title", header: "Title", sortableBody: (row) => <div>{row.title}</div> },
        { field: "summary", header: "Summary", sortableBody: (row) => <div>{row.summary}</div> },
        { field: "status", header: "Status", sortableBody: (row) => <div className="badge" data-status={row.status}>{row.status}</div> },
    ];

    const actionBodyTemplate = (row) => (
        <ActionSplit
            items={[
                { label: "Approve", command: () => decide(row, "APPROVED") },
                { label: "Reject", command: () => decide(row, "REJECTED") },
                { label: "Details", command: () => { setDetails(row); setDetailsOpen(true); } },
            ]}
        />
    );

    return (
        <div className="hotel-admin">
            <form className="portal-filters" onSubmit={(event) => event.preventDefault()}>
                <InputField
                    id="sectionID"
                    name="sectionID"
                    type="select"
                    labelFor="sectionID"
                    label="Section"
                    width="full"
                    optionLabel="name"
                    value={section}
                    onChange={(event) => setSection(event.value || event.target?.value)}
                    autoFilteredValue={sectionOptions}
                    autoCompleteMethod={searchSection}
                    selectedAutoValue={SECTIONS}
                    setSelectedAutoValue={setSectionOptions}
                />
                <InputField id="startDate" name="startDate" type="date" labelFor="startDate" label="Select Start Date" width="full" value={startDate} onChange={(event) => setStartDate(event.target?.value || event.value || null)} />
                <InputField id="endDate" name="endDate" type="date" labelFor="endDate" label="Select End Date" width="full" value={endDate} onChange={(event) => setEndDate(event.target?.value || event.value || null)} />
                <div>
                    <CommonButton type="submit" className="p-mr-2 p-button-raised p-button-primary" title="Search" label="Search" icon="pi pi-search" />
                </div>
            </form>

            <Table
                emptyMessage="No data found"
                data={visible}
                tableColumns={columns}
                loading={loading}
                dataKey="rowKey"
                isSelectable={false}
                isTopbarShow
                newBtn={false}
                actionButton={actionBodyTemplate}
                sortable={false}
                exportBtn
            />

            <Dialog className="form-modal" header="Submission details" visible={detailsOpen} style={{ width: "70vw" }} modal onHide={() => setDetailsOpen(false)}>
                {details && (
                    <DataTable
                        value={[
                            { field: "Section", value: details.sectionLabel },
                            { field: "Title", value: details.title },
                            { field: "Summary", value: details.summary || "-" },
                            { field: "Status", value: details.status },
                        ]}
                        className="p-datatable-striped p-datatable-gridlines"
                        showGridlines
                    >
                        <Column field="field" header="Field" />
                        <Column field="value" header="Value" body={(row) => row.value || "-"} />
                    </DataTable>
                )}
            </Dialog>
        </div>
    );
}
