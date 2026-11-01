import { CommonButton } from "components/Buttons/Buttons";
import Loader from "components/Loader/Loader";
import { Table } from "components/Table/Table";
import { Dialog } from "primereact/dialog";
import { useEffect, useState } from "react";
import { coreAxios } from "utilities/axios";
import { errorHandler } from "utilities/errorHandler/errorHandler";
import { responsiveModalStyle } from "utilities/modalWidth";

export default function Attachment({ showForm, hideModal }) {
    // //Console.log(showForm);
    const [loading, setLoading] = useState(false);
    const [attachment, setAttachment] = useState(false);
    //---- End  Action button for the table ----
    const fileTableColumn = [
        { field: "documentLocation", header: "Document Name" },
        {
            field: "documentPath",
            header: "Document View",
            sortableBody: (value) => (
                <a href={value.documentPath} target="_blank" rel="noopener noreferrer">
                    <CommonButton type="button" icon="pi pi-download" />
                </a>
            ),
        },
    ];
    useEffect(() => {
        const getFile = async () => {
            try {
                setLoading(true);
                const { data } = await coreAxios.get(`/api/File?ReferenceDocNameID=${showForm?.attachmentReferenceDocNameID}&ReferenceDocID=${showForm?.referenceDocID}`);
                setAttachment(data);
                setLoading(false);
            } catch (e) {
                setLoading(false);
                errorHandler(e);
            }
        };
        showForm && getFile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showForm?.attachmentReferenceDocNameID]);
    return (
        <div>
            <Dialog visible={showForm ? true : false} style={responsiveModalStyle} header={`Files`} modal className="p-fluid" onHide={hideModal} closeOnEscape blockScroll icons focusOnShow resizable maximizable>
                {loading && <Loader />}
                {/* <form onSubmit={formik.handleSubmit}> */}
                <Table
                    isSelectable={false}
                    pageShow={false}
                    rows={15}
                    emptyMessage="No data found"
                    searchShow={false}
                    importExportBtn={false}
                    exportBtn={false}
                    tableColumns={fileTableColumn}
                    data={attachment}
                    loading={false}
                    dataKey="styleDetailID"
                    actionButtonWidth={10}
                    newBtn={false}
                    showTableHeader={false}
                    className="p-datatable-customers"
                />
                {/* </form> */}
            </Dialog>
        </div>
    );
}
