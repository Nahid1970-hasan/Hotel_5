import { CommonButton } from "components/Buttons/Buttons";
import Loader from "components/Loader/Loader";
import { Table } from "components/Table/Table";
import { dateBodyTemp } from "components/Templates/tableBodyTemplate";
import { Dialog } from "primereact/dialog";
import { useEffect, useState } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { encodeFunction } from "utilities/CustomFunction/encodeDecode/encodeDecode";
import { coreAxios } from "utilities/axios";
import { errorHandler } from "utilities/errorHandler/errorHandler";
import { responsiveModalStyle } from "utilities/modalWidth";
import Attachment from "./Attachment";
export default function AttachmentDB({ showForm, hideModal, reference = 100, type = "journalVoucherID" }) {
    // //Console.log(showForm);
    const [loading, setLoading] = useState(false);
    const [attachmentForm, setAttachmentForm] = useState(false);
    const [data, setData] = useState([]);
    //---- End  Action button for the table ----
    const linkFunction = (link, value) => {
        return (
            <div className="flex gap-x-2 items-center justify-around">
                <Link to={`${link}`} target="_blank" rel="noreferrer">
                    <p className="text-blue-500 font-bold cursor-pointer">{value}</p>
                </Link>
                <AiOutlineCopy
                    className="text-xl cursor-pointer"
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(value);
                            toast.success("Successfully copied to clipboard");
                        } catch (err) {
                            console.error("Failed to copy text: ", err);
                        }
                    }}
                />
            </div>
        );
    };

    function formatString(inputString) {
        // return //Console.log(inputString);
        const parts = inputString?.split(",");
        if (parts?.length === 2) {
            const [path, queryString] = parts[0].split("?");
            const dynamicValue = encodeFunction(parts[1]);
            const formattedPath = path.replace(/:\w+/g, "").replace(/\/+$/, ""); // Remove :string and trailing slashes
            let formattedString = `${formattedPath}`;

            if (queryString) {
                formattedString += `?${queryString}`;
            }

            if (queryString && queryString.endsWith("=")) {
                formattedString += dynamicValue;
            } else {
                formattedString += `/${dynamicValue}`;
            }

            return formattedString;
        }
        return inputString; // Return the original string if it doesn't have two parts.
    }

    const tableColumn = [
        {
            field: "masterReferenceName",
            header: "Main Reference",
            sortableBody: (v, e) => {
                return v.masterLinkURL ? linkFunction(formatString(v.masterLinkURL), v.masterReferenceName) : <>{v.masterReferenceName}</>;
            },
        },
        {
            field: "referenceName",
            header: "Reference",
            sortableBody: (v, e) => {
                return v.linkURL ? linkFunction(formatString(v.linkURL), v.referenceName) : <>{v.referenceName}</>;
            },
        },
        { field: "referenceDate", header: "Reference Date", sortableBody: dateBodyTemp },
        {
            field: "doc",
            header: "Attachment",
            sortableBody: (v, e) => {
                return (
                    <div>
                        <CommonButton
                            type="button"
                            label="Attachment"
                            title="Attachment"
                            onClick={(e) => {
                                setAttachmentForm(v);
                            }}
                        />
                    </div>
                );
            },
        },
    ];
    useEffect(() => {
        const getData = async () => {
            try {
                setLoading(true);
                const { data } =
                    reference === 100
                        ? await coreAxios.get(`/api/Journal/ANF_JournalWiseALLAttachment?JournalVoucherID=${showForm?.[type]}`)
                        : reference === 13
                        ? await coreAxios.get(`/api/Journal/ANF_PettyCashRequisitionWiseALLAttachment?PaymentRequisitionID=${showForm?.paymentRequisitionID}`)
                        : await coreAxios.post(`/api/Journal/ANF_ReferenceWiseALLAttachment`, [
                              {
                                  referenceDocID: showForm?.[type],
                                  referenceDocNameID: reference,
                                  masterReferenceName: "",
                                  journalVoucherID: 0,
                              },
                          ]);
                setData(data);
                setLoading(false);
            } catch (e) {
                setLoading(false);
                errorHandler(e);
            }
        };
        showForm && getData();
    }, [showForm?.journalVoucherID, showForm?.paymentRequisitionID, reference, showForm, type]);

    const hideAttachment = () => {
        setAttachmentForm(false);
    };
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
                    tableColumns={tableColumn}
                    data={data}
                    loading={false}
                    dataKey="referenceDocID"
                    actionButtonWidth={10}
                    newBtn={false}
                    showTableHeader={false}
                    className="p-datatable-customers"
                />
                <Attachment showForm={attachmentForm} hideModal={hideAttachment} />
            </Dialog>
        </div>
    );
}
