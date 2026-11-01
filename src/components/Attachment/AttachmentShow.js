import { Table } from "components/Table/Table";
import React, { useEffect, useState } from "react";
import { coreAxios } from "utilities/axios";
import { toast } from "react-toastify";
import { errorHandler } from "utilities/errorHandler/errorHandler";

const AttachmentShow = ({ updateData, loading }) => {
    const [rows, setRows] = useState(() => {
        if (Array.isArray(updateData)) return updateData;
        if (updateData) return [updateData];
        return [];
    });

    useEffect(() => {
        if (Array.isArray(updateData)) {
            setRows(updateData);
        } else if (updateData) {
            setRows([updateData]);
        } else {
            setRows([]);
        }
    }, [updateData]);

    const handleDelete = async (document) => {
        if (!document?.documentID) return;
        try {
            const res = await coreAxios.delete(`/api/File?ReferenceDocNameID=68&DocumentID=${document.documentID}`);
            if (res?.status === 200 || res?.status === 204) {
                toast.success("Successfully removed attachment!");
                setRows((prev) => prev.filter((d) => d.documentID !== document.documentID));
            }
        } catch (err) {
            errorHandler(err);
        }
    };

    const attachmentTableColumn = [
        {
            field: "documentLocation",
            header: "File Name",
            sortableBody: (document) => (
                <div className="flex items-center justify-between">
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        href={document?.documentPath}
                    >
                        {document?.documentLocation}
                    </a>
                    {document?.documentID && (
                        <button
                            type="button"
                            className="ml-3 text-red-700 hover:text-red-900"
                            aria-label="Remove attachment"
                            onClick={() => handleDelete(document)}
                        >
                            <i className="fa-solid fa-trash-can" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <Table
                emptyMessage="No data found"
                data={rows}
                tableColumns={attachmentTableColumn}
                loading={loading}
                isTopbarShow={false}
                isSelectable={false}
                newBtn={false}
                sortable={false}
                importExportBtn
                searchShow={false}
                showTableHeader={false}
                pageShow={false}
            />
        </div>
    );
};

export default AttachmentShow;
