import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { CommonButton } from "components/Buttons/Buttons";
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

export default function Settings() {
    const { call } = useAdmin();
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/settings");
            setDraft(result.data);
        } catch (error) {
            setDraft(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const set = (key) => (event) => setDraft({ ...draft, [key]: event.target.value });

    const save = async (event) => {
        event.preventDefault();
        try {
            const result = await call("/admin/settings", {
                method: "PATCH",
                notify: "error",
                body: { ...draft, taxPercent: Number(draft.taxPercent), serviceFeePercent: Number(draft.serviceFeePercent) },
            });
            toast.success("Settings saved. New quotes use these tax and service rates.");
            setDraft(result.data);
            setOpen(false);
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    return (
        <div className="hotel-admin">
            <Table
                emptyMessage="No data found"
                data={draft ? [{ id: "property", ...draft }] : []}
                loading={loading}
                dataKey="id"
                isSelectable={false}
                isTopbarShow
                newBtn={false}
                exportBtn
                actionButton={() => <ActionSplit items={[{ label: "Update", command: () => setOpen(true) }]} />}
                tableColumns={[
                    { field: "phone", header: "Phone", sortableBody: (row) => <div>{row.phone}</div> },
                    { field: "email", header: "Email", sortableBody: (row) => <div>{row.email}</div> },
                    { field: "checkInTime", header: "Check-in", sortableBody: (row) => <div>{row.checkInTime}</div> },
                    { field: "checkOutTime", header: "Check-out", sortableBody: (row) => <div>{row.checkOutTime}</div> },
                    { field: "taxPercent", header: "Tax %", sortableBody: (row) => <div>{row.taxPercent}</div> },
                    { field: "serviceFeePercent", header: "Service %", sortableBody: (row) => <div>{row.serviceFeePercent}</div> },
                ]}
            />
            <Dialog className="form-modal" header="Update property" visible={open} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setOpen(false)}>
                {draft && (
                    <form className="ha-form" onSubmit={save}>
                        <InputField id="settingsPhone" name="settingsPhone" type="text" labelFor="settingsPhone" label="Phone" width="full" value={draft.phone || ""} onChange={set("phone")} />
                        <InputField id="settingsEmail" name="settingsEmail" type="text" labelFor="settingsEmail" label="Email" width="full" value={draft.email || ""} onChange={set("email")} />
                        <InputField id="checkInTime" name="checkInTime" type="text" labelFor="checkInTime" label="Check-in" width="full" value={draft.checkInTime || ""} onChange={set("checkInTime")} />
                        <InputField id="checkOutTime" name="checkOutTime" type="text" labelFor="checkOutTime" label="Check-out" width="full" value={draft.checkOutTime || ""} onChange={set("checkOutTime")} />
                        <InputField id="taxPercent" name="taxPercent" type="number" labelFor="taxPercent" label="Tax %" width="full" value={draft.taxPercent} onChange={set("taxPercent")} />
                        <InputField id="serviceFeePercent" name="serviceFeePercent" type="number" labelFor="serviceFeePercent" label="Service %" width="full" value={draft.serviceFeePercent} onChange={set("serviceFeePercent")} />
                        <InputField id="tagline" name="tagline" type="text" labelFor="tagline" label="Tagline" width="full" value={draft.tagline || ""} onChange={set("tagline")} />
                        <InputField id="description" name="description" type="textarea" labelFor="description" label="Description" width="full" value={draft.description || ""} onChange={set("description")} />
                        <div className="span-2">
                            <CommonButton type="submit" label="Save settings" icon="pi pi-check" className="p-button-success" />
                        </div>
                    </form>
                )}
            </Dialog>
        </div>
    );
}
