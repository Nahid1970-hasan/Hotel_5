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

export default function Content() {
    const { call } = useAdmin();
    const [pages, setPages] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [pageOpen, setPageOpen] = useState(false);
    const [faqOpen, setFaqOpen] = useState(false);
    const [slug, setSlug] = useState("");
    const [draft, setDraft] = useState({ title: "", body: "" });
    const [faq, setFaq] = useState({ category: "General", question: "", answer: "" });

    const load = async () => {
        try {
            setLoading(true);
            const result = await call("/admin/pages");
            setPages(result.data?.pages || []);
            setFaqs(result.data?.faqs || []);
        } catch (error) {
            setPages([]);
            setFaqs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const savePage = async (event) => {
        event.preventDefault();
        try {
            const result = await call(`/admin/pages/${slug}`, { method: "PATCH", body: draft, notify: "error" });
            toast.success(`${result.data.title} published.`);
            setPageOpen(false);
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const saveFaq = async (event) => {
        event.preventDefault();
        try {
            if (faq.id) await call(`/admin/faqs/${faq.id}`, { method: "PATCH", body: faq });
            else await call("/admin/faqs", { method: "POST", body: faq });
            setFaq({ category: "General", question: "", answer: "" });
            setFaqOpen(false);
            load();
        } catch (error) {
            // The request toast already reported the error.
        }
    };

    const query = search.trim().toLowerCase();

    return (
        <div className="hotel-admin">
            <Table
                emptyMessage="No data found"
                tableHeaderName="Pages"
                data={pages.filter((row) => `${row.slug} ${row.title}`.toLowerCase().includes(query))}
                loading={loading}
                dataKey="slug"
                isSelectable={false}
                newBtn={false}
                exportBtn
                actionButton={(row) => (
                    <ActionSplit items={[{
                        label: "Edit",
                        command: () => {
                            setSlug(row.slug);
                            setDraft({ title: row.title, body: row.body });
                            setPageOpen(true);
                        },
                    }]} />
                )}
                tableColumns={[
                    { field: "slug", header: "Page", sortableBody: (row) => <div>{row.slug}</div> },
                    { field: "title", header: "Title", sortableBody: (row) => <div>{row.title}</div> },
                ]}
            />
            <Table
                emptyMessage="No data found"
                tableHeaderName="FAQs"
                data={faqs.filter((row) => `${row.category} ${row.question}`.toLowerCase().includes(query))}
                loading={loading}
                dataKey="id"
                isSelectable={false}
                newBtn
                newBtnWithoutAddPermission
                newBtnFunc={() => { setFaq({ category: "General", question: "", answer: "" }); setFaqOpen(true); }}
                exportBtn
                actionButton={(row) => (
                    <ActionSplit items={[{
                        label: "Edit",
                        command: () => {
                            setFaq({ id: row.id, category: row.category, question: row.question, answer: row.answer });
                            setFaqOpen(true);
                        },
                    }]} />
                )}
                tableColumns={[
                    { field: "category", header: "Category", sortableBody: (row) => <div>{row.category}</div> },
                    { field: "question", header: "Question", sortableBody: (row) => <div>{row.question}</div> },
                    { field: "answer", header: "Answer", sortableBody: (row) => <div>{row.answer}</div> },
                ]}
            />
            <Dialog className="form-modal" header="Update page" visible={pageOpen} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setPageOpen(false)}>
                <form className="ha-form" onSubmit={savePage}>
                    <InputField id="pageSlug" name="pageSlug" type="text" labelFor="pageSlug" label="Page" width="full" value={slug} disabled />
                    <InputField id="pageTitle" name="pageTitle" type="text" labelFor="pageTitle" label="Title" width="full" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                    <InputField id="pageBody" name="pageBody" type="textarea" labelFor="pageBody" label="Body" width="full" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
                    <div className="span-2">
                        <CommonButton type="submit" label="Publish" icon="pi pi-check" className="p-button-success" />
                    </div>
                </form>
            </Dialog>
            <Dialog className="form-modal" header={faq.id ? "Update FAQ" : "New FAQ"} visible={faqOpen} style={{ width: "min(760px, 96vw)" }} modal onHide={() => setFaqOpen(false)}>
                <form className="ha-form" onSubmit={saveFaq}>
                    <InputField id="faqCategory" name="faqCategory" type="text" labelFor="faqCategory" label="Category" width="full" value={faq.category} onChange={(event) => setFaq({ ...faq, category: event.target.value })} />
                    <InputField id="faqQuestion" name="faqQuestion" type="text" labelFor="faqQuestion" label="Question" required width="full" value={faq.question} onChange={(event) => setFaq({ ...faq, question: event.target.value })} />
                    <InputField id="faqAnswer" name="faqAnswer" type="textarea" labelFor="faqAnswer" label="Answer" required width="full" value={faq.answer} onChange={(event) => setFaq({ ...faq, answer: event.target.value })} />
                    <div className="span-2">
                        <CommonButton type="submit" label={faq.id ? "Save FAQ" : "Add FAQ"} icon="pi pi-check" className="p-button-success" />
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
