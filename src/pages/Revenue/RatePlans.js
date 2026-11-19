import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import { useAdmin } from "../../hotel/admin/AdminShell";

const TYPES = [
    { id: "percent", name: "Percent", label: "Percent" },
    { id: "fixed", name: "Fixed amount", label: "Fixed amount" },
    { id: "free_night", name: "Free night after N nights", label: "Free night after N nights" },
];

function blank() {
    return { code: "", name: "", discountValue: 10, terms: "" };
}

export default function RatePlans() {
    const { call } = useAdmin();
    const [plans, setPlans] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(blank());
    const [discountType, setDiscountType] = useState(TYPES[0]);
    const [typeOptions, setTypeOptions] = useState(TYPES);

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/rates");
            setPlans(result.data?.plans || []);
            setPromotions(result.data?.promotions || []);
        } catch (error) {
            setPlans([]);
            setPromotions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const save = async (event) => {
        event.preventDefault();
        try {
            await call("/admin/promotions", {
                method: "POST",
                body: { ...form, discountType: discountType?.id || "percent", discountValue: Number(form.discountValue) },
            });
            setForm(blank());
            setShowForm(false);
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const query = search.trim().toLowerCase();
    const planRows = plans.filter((row) => `${row.name} ${row.meal_plan}`.toLowerCase().includes(query));
    const promoRows = promotions.filter((row) => `${row.code} ${row.name}`.toLowerCase().includes(query));

    return (
        <div className="hotel-admin">
            <Table
                emptyMessage="No data found"
                tableHeaderName="Plans"
                data={planRows}
                loading={loading}
                dataKey="id"
                isSelectable={false}
                newBtn={false}
                exportBtn
                tableColumns={[
                    { field: "name", header: "Plan", sortableBody: (row) => <div>{row.name}</div> },
                    { field: "meal_plan", header: "Meals", sortableBody: (row) => <div>{row.meal_plan}</div> },
                    { field: "price_adjust_percent", header: "Adjust", sortableBody: (row) => <div>{row.price_adjust_percent}%</div> },
                    { field: "summary", header: "Cancellation", sortableBody: (row) => <div>{row.summary}</div> },
                ]}
            />
            <Table
                emptyMessage="No data found"
                tableHeaderName="Promotion codes"
                data={promoRows}
                loading={loading}
                dataKey="id"
                isSelectable={false}
                newBtn
                newBtnWithoutAddPermission
                newBtnFunc={() => setShowForm(true)}
                exportBtn
                tableColumns={[
                    { field: "code", header: "Code", sortableBody: (row) => <div>{row.code}</div> },
                    { field: "name", header: "Name", sortableBody: (row) => <div>{row.name}</div> },
                    { field: "discount_type", header: "Type", sortableBody: (row) => <div>{row.discount_type}</div> },
                    { field: "discount_value", header: "Value", sortableBody: (row) => <div>{row.discount_value}</div> },
                    { field: "active", header: "Active", sortableBody: (row) => <div>{row.active ? "Yes" : "No"}</div> },
                ]}
            />
            <Dialog className="form-modal" header="New promotion" visible={showForm} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setShowForm(false)}>
                <form className="ha-form" onSubmit={save}>
                    <InputField id="code" name="code" type="text" labelFor="code" label="Code" required width="full" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
                    <InputField id="promoName" name="promoName" type="text" labelFor="promoName" label="Name" required width="full" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    <InputField
                        id="discountType"
                        name="discountType"
                        type="select"
                        labelFor="discountType"
                        label="Type"
                        width="full"
                        optionLabel="name"
                        value={discountType}
                        onChange={(event) => setDiscountType(event.value || event.target?.value)}
                        autoFilteredValue={typeOptions}
                        autoCompleteMethod={(event) => {
                            const text = String(event.query || "").toLowerCase();
                            setTypeOptions(TYPES.filter((item) => item.name.toLowerCase().includes(text)));
                        }}
                        selectedAutoValue={TYPES}
                        setSelectedAutoValue={setTypeOptions}
                    />
                    <InputField id="discountValue" name="discountValue" type="number" labelFor="discountValue" label="Value" width="full" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: event.target.value })} />
                    <InputField id="terms" name="terms" type="textarea" labelFor="terms" label="Terms" width="full" value={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.value })} />
                    <div className="span-2">
                        <CommonButton type="submit" label="Add code" icon="pi pi-check" className="p-button-success" />
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
