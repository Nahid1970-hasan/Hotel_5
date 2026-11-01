import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import Loader from "components/Loader/Loader";
import { Table } from "components/Table/Table";
import { useFormik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getCompany } from "service/dropdown";
import { userInfo } from "service/login";
import { coreAxios } from "utilities/axios";
import { errorHandler } from "utilities/errorHandler/errorHandler";
import ConfirmModal from "../Modal/ConfirmModal";

const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : false));
    useEffect(() => {
        const mq = window.matchMedia(query);
        const handler = (e) => setMatches(e.matches);
        setMatches(mq.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [query]);
    return matches;
};

const Field = ({ label, children }) => (
    <div className="min-w-0">
        <div className="text-[11px] text-gray-500">{label}</div>
        <div className="text-sm font-medium break-words">{children ?? "-"}</div>
    </div>
);

const MOBILE_PAGE_SIZE = 20;
const WIDE_FIELDS = new Set(["companyName", "vendorName", "vendor", "remarks", "corporateAddress", "materialName"]);

const renderColumnCell = (col, row) => {
    try {
        if (typeof col?.sortableBody === "function") return col.sortableBody(row, { field: col.field, header: col.header });
        if (typeof col?.body === "function") return col.body(row, { field: col.field, header: col.header });
    } catch (error) {
        return row?.[col?.field] ?? "-";
    }
    const value = row?.[col?.field];
    return value === null || value === undefined || value === "" ? "-" : value;
};

const Approval = ({
    columns,
    value,
    id,
    data,
    data2,
    setData2,
    getDataLoading,
    actionBodyTemplate,
    selectedData,
    setSelectedData,
    loading,
    setLoading,
    recallData,
    recallData2,
    header,
    typeID,
    functionalID,
    isCs,
    isRecall,
    isInvoice,
    apiInfo,
    dataKey,
    metaKeySelection,
    isCompanyHide,
    filterData,
    permission,
    isCsApproval,
}) => {
    const [statusType, setStatusType] = useState([]);
    const [buttonType, setButtonType] = useState("");
    const [displayData, setDisplayData] = useState([]);
    const [approveBtnStatus, setApproveBtnStatus] = useState(false);
    const [rejectBtnStatus, setRejectBtnStatus] = useState(false);
    const [recallBtnStatus, setRecallBtnStatus] = useState(true);
    const [deleteModal, setDeleteModal] = useState(false);
    const [autoFilteredValue, setAutoFilteredValue] = useState([]);
    const [remarks, setRemarks] = useState("");
    const [company, setCompany] = useState([]);
    const [isRequired, setIsRequired] = useState(false);
    const [isValidate, setIsValidate] = useState(true);
    const [submitLoader, setSubmitLoader] = useState(false);
    const [submitLoader1, setSubmitLoader1] = useState(false);
    const [submitLoader2, setSubmitLoader2] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [companyID, setCompanyID] = useState();
    const [statusID, setStatusID] = useState(0);
    const [finalArray, setFinalArray] = useState();
    const [searchQuery, setSearchQuery] = useState("");
    const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE_SIZE);
    const isMobile = !useMediaQuery("(min-width: 768px)");

    const { EmpID, comapanyID, userRole, roleID, functionRoleID } = userInfo();

    useEffect(() => {
        fetchAndGetCompany();
        autoFilter();
    }, []);

    useEffect(() => {
        setVisibleCount(MOBILE_PAGE_SIZE);
    }, [searchQuery, data2]);
    const refreshPage = () => {
        recallData();
        setDisplayData(null);
        setSelectedData(null);
        hideModal();

        // window.location.reload();
    };

    //dropdown
    const fetchAndGetCompany = async () => {
        try {
            setCompany(await getCompany());
        } catch (err) {
            // toast.error(err?.response?.message);
            errorHandler(err);
        }
    };
    const searchCompany = (event) => {
        if (company) {
            if (!event.query.trim().length && event?.length === undefined) {
                setAutoFilteredValue([...company]);
            } else {
                setAutoFilteredValue(
                    company?.filter((v) => {
                        return v?.name?.toLowerCase()?.includes(event?.query?.toLowerCase());
                    })
                );
            }
        }
        /*  toast.error("Network Error!"); */
    };
    // filter selected data

    // filter by company

    const autoFilter = async () => {
        const startDate1 = new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const endDate1 = new Date().toISOString().slice(0, 10);

        if (isCompanyHide) {
            try {
                setLoading(true);
                await coreAxios.get(`api/${apiInfo?.api}?FunctionRoleID=${functionRoleID || 0}&RoleID=${apiInfo?.rID}&StatusID=${formik?.values?.statusID?.id || 0}&StartDate=${startDate1}&EndDate=${endDate1}`).then((res) => {
                    setLoading(false);
                    if (res.status === 200) {
                        setLoading(false);
                        setData2(res?.data);
                    } else {
                        setLoading(false);
                        toast.error(res?.data?.message);
                    }
                });
            } catch (err) {
                setLoading(false);
                errorHandler(err);
                // toast.error(err?.response?.data?.message);
            }
        } else {
            // //Console.log("tst com", comapanyID);

            try {
                setLoading(true);
                await coreAxios.get(`api/${apiInfo?.api}?FunctionRoleID=${functionRoleID || 0}&RoleID=${apiInfo?.rID}&StatusID=${statusID || 0}&CompanyID=${formik?.values?.companyID?.id || comapanyID}&StartDate=${startDate1}&EndDate=${endDate1}`).then((res) => {
                    setLoading(false);
                    if (res.status === 200) {
                        setLoading(false);
                        setData2(res?.data);
                    } else {
                        // errorHandler(res);
                        toast.error(res?.data?.message);
                    }
                });
            } catch (err) {
                setLoading(false);
                errorHandler(err);
                toast.error(err?.response?.data?.message);
            }
        }
    };
    // filter by Date
    const getStartDate = ({ target: { value } }) => {
        setStartDate(value);
    };
    const getEndDate = ({ target: { value } }) => {
        setEndDate(value);
    };

    const searchData = (id) => {
        const defaultStartDate = formik.values.startDate;
        const defaultEndDate = formik.values.endDate;
        //Console.log("formik", formik?.values);

        if (apiInfo) {
            try {
                setLoading(true);
                coreAxios
                    .get(
                        `api/${apiInfo?.api}?FunctionRoleID=${functionRoleID || 0}&RoleID=${apiInfo?.rID}&StatusID=${formik?.values?.statusID?.id || 0}&CompanyID=${formik?.values?.companyID?.id || comapanyID}&StartDate=${
                            defaultStartDate.toISOString().slice(0, 10) || startDate.toISOString().slice(0, 10)
                        }&EndDate=${defaultEndDate.toISOString().slice(0, 10) || endDate.toISOString().slice(0, 10)}`
                    )
                    .then((res) => {
                        if (res?.status === 200) {
                            setLoading(false);
                            setData2(res?.data);
                        } else {
                            // errorHandler(res);
                            setLoading(true);
                            toast.error(res?.data?.message);
                        }
                    });
            } catch (err) {
                setLoading(false);
                errorHandler(err);
                toast.error(err.response.data.message);
            }
        }

        /*  const defaultStartDate = formik.values.startDate;
        const defaultEndDate = formik.values.endDate;
        const matchedDetails = data?.filter((data) => new Date(data.dpDate) >= (startDate || defaultStartDate) && new Date(data.dpDate) <= (endDate || defaultEndDate));
        setData2(matchedDetails); */
    };
    const searchDataRecallTime = (id) => {
        const defaultStartDate = formik.values.startDate;
        const defaultEndDate = formik.values.endDate;

        if (apiInfo) {
            try {
                setLoading(true);
                coreAxios
                    .get(
                        `api/${apiInfo?.api}?FunctionRoleID=${functionRoleID || 0}&RoleID=${apiInfo?.rID}&StatusID=${formik?.values?.statusID?.id || 0}&CompanyID=${formik?.values?.companyID?.id || comapanyID}&StartDate=${
                            defaultStartDate.toISOString().slice(0, 10) || startDate.toISOString().slice(0, 10)
                        }&EndDate=${defaultEndDate.toISOString().slice(0, 10) || endDate.toISOString().slice(0, 10)}`
                    )
                    .then((res) => {
                        if (res?.status === 200) {
                            setLoading(false);
                            setData2(res?.data);
                        } else {
                            // errorHandler(res);
                            setLoading(true);
                            toast.error(res?.data?.message);
                        }
                    });
            } catch (err) {
                setLoading(false);
                errorHandler(err);
                toast.error(err.response.data.message);
            }
        }

        /*  const defaultStartDate = formik.values.startDate;
        const defaultEndDate = formik.values.endDate;
        const matchedDetails = data?.filter((data) => new Date(data.dpDate) >= (startDate || defaultStartDate) && new Date(data.dpDate) <= (endDate || defaultEndDate));
        setData2(matchedDetails); */
    };

    // confirm modal
    const openModal = () => {
        // modal => true
        setDeleteModal(true);
    };
    const hideModal = () => {
        setDeleteModal(false);
    };
    // approve /reject /recall start
    const confirmDelete = async () => {
        // );
        if (buttonType === "reject") {
            if (selectedData?.length === data2?.length) {
                rejectedFunction(selectedData);
            } else {
                await Promise.all(
                    filterData?.map((dataArray, idx) => {
                        rejectedFunction(dataArray);
                    })
                );
            }
        } else {
            if (selectedData?.length === data2?.length) {
                recalledFunction(selectedData);
            } else {
                await Promise.all(
                    filterData?.map((dataArray, idx) => {
                        recalledFunction(dataArray);
                    })
                );
            }
        }

        setLoading(false);
    };

    const statusValue = [
        { name: "Pending", value: 0, id: 0, label: "Pending" },
        { name: "Approved", value: 1, id: 1, label: "Approved" },
        { name: "Rejected", value: 2, id: 2, label: "Rejected" },
    ];

    // approvalStatus
    const searchStatusType = (event) => {
        try {
            if (statusValue) {
                if (!event.query.trim().length && event?.length === undefined) {
                    setAutoFilteredValue([...statusValue]);
                } else {
                    setAutoFilteredValue(
                        statusValue?.filter((v) => {
                            return v.name.toLowerCase().includes(event.query.toLowerCase());
                        })
                    );
                }
            }
        } catch (err) {
            toast.error(err);
        }
        /*  toast.error("Network Error!"); */
    };

    const formik = useFormik({
        initialValues: {
            status: "Pending",
            startDate: useMemo(() => new Date(Date.now() - 17 * 24 * 60 * 60 * 1000), []),
            endDate: useMemo(() => new Date(), []),
            companyID: isCsApproval ? 0 : company?.find((value) => value.id === comapanyID)?.name || 0,
        },

        onSubmit: async (values) => {
            setRemarks(values?.approvalRemarks);

            if (buttonType === "approve") {
                if (selectedData?.length === data2?.length) {
                    approveFunction(selectedData, values);
                } else {
                    await Promise.all(
                        filterData?.map((dataArray) => {
                            approveFunction(dataArray, values);
                        })
                    );
                }
            } else if (buttonType === "reject") {
                openModal();
            } else if (buttonType === "recall") {
                openModal();
            }
        },
        enableReinitialize: true,
    });

    const approveFunction = async (array, values) => {
        array?.map(async (data, index) => {
            setSubmitLoader(true);
            const newObj = {};
            data.statusID = data?.statusID;
            data.funcationalTypeID = typeID;
            data.funcationalID = data?.directPurchaseDetailID || data?.requisitionDetailID || data?.supplierPIID || data?.purchaseOrderDetailID || data?.paymentID;
            data.approvalRemarks = values.approvalRemarks || "";
            data.rejectedRemarks = "";
            data.recallRemarks = "";
            data.approvedBy = EmpID;
            data.rejectedBy = 0;
            data.recalledBy = 0;
            data.actionType = "Approve";
            data.roleID = userRole;
            data.functionRoleID = functionRoleID || 0;
            data.reqQTY = data?.requiredQTY;
            if (isCsApproval) {
                data.capexBudgetID = data?.expenseTypeID || 0;
            }
        });
        //Console.log("submitted data", array);

        try {
            setSubmitLoader(true);
            await coreAxios
                .post("/api/ApprovalInformation/Bulk", array)
                .then(function (res) {
                    if (res?.status === 200) {
                        setSubmitLoader(false);
                        toast.success("SuccessFully Approved!");
                        searchData();
                        refreshPage();
                        setSubmitLoader(false);
                        formik.resetForm();
                    } else {
                        setSubmitLoader(false);
                    }
                })
                .catch(function (error) {
                    errorHandler(error);
                });
            setSubmitLoader(false);
        } catch (err) {
            errorHandler(err);
        }
    };
    const rejectedFunction = async (array, values) => {
        array?.map(async (data, index) => {
            const newObj = {};
            data.statusID = data?.statusID;
            data.funcationalTypeID = typeID;
            data.funcationalID = data?.directPurchaseDetailID || data?.requisitionDetailID || data?.supplierPIID || data?.purchaseOrderDetailID || data?.paymentID;
            data.approvalRemarks = "";
            data.rejectedRemarks = remarks || "";
            data.recallRemarks = "";
            data.approvedBy = 0;
            data.rejectedBy = EmpID;
            data.recalledBy = 0;
            data.actionType = "Reject";
            data.roleID = userRole;
            data.functionRoleID = functionRoleID || 0;
        });

        try {
            setSubmitLoader2(true);
            await coreAxios
                .post("/api/ApprovalInformation/Bulk", array)
                .then(function (res) {
                    if (res?.status === 200) {
                        setSubmitLoader2(false);
                        toast.success("SuccessFully Rejected!");
                        searchData();
                        refreshPage();
                        setLoading(false);
                        formik.resetForm();
                    } else {
                        setSubmitLoader2(false);
                    }
                })
                .catch(function (error) {
                    errorHandler(error);
                    refreshPage();
                });
            setSubmitLoader2(false);
        } catch (err) {
            errorHandler(err);
        }
    };
    const recalledFunction = async (array) => {
        const recallDataList = [];

        array?.map(async (data, index) => {
            if (data?.canRecall) {
                const newObj = {};
                newObj.statusID = data?.statusID;
                newObj.funcationalTypeID = typeID;
                newObj.funcationalID = data?.directPurchaseDetailID || data?.requisitionDetailID || data?.supplierPIID || data?.purchaseOrderDetailID || data?.paymentID;
                newObj.approvalRemarks = "";
                newObj.rejectedRemarks = "";
                newObj.recallRemarks = remarks || "";
                newObj.approvedBy = 0;
                newObj.rejectedBy = 0;
                newObj.recalledBy = EmpID;
                newObj.actionType = "Recall";
                newObj.roleID = userRole;
                newObj.functionRoleID = functionRoleID || 0;
                newObj.reqQTY = data?.requiredQTY;
                recallDataList?.push(newObj);
            }
        });

        if (recallDataList?.length > 0) {
            try {
                setSubmitLoader1(true);
                await coreAxios
                    .post("/api/ApprovalInformation/Bulk", recallDataList)
                    .then(function (res) {
                        if (res?.status === 200) {
                            setSubmitLoader1(false);
                            toast.success("SuccessFully Recalled!");
                            //Console.log("statusID", statusID);
                            if (statusID === 1) {
                                searchDataRecallTime(1);
                                setDisplayData(null);
                                setSelectedData(null);
                                hideModal();
                                setLoading(false);
                                formik.setFieldValue("approvalRemarks", "");
                            } else {
                                searchDataRecallTime(2);
                                setDisplayData(null);
                                setSelectedData(null);
                                hideModal();
                                setLoading(false);
                                formik.setFieldValue("approvalRemarks", "");
                            }

                            // refreshPage();
                        } else {
                            setSubmitLoader1(false);
                        }
                    })
                    .catch(function (error) {
                        errorHandler(error);
                        refreshPage();
                    });
                setSubmitLoader1(false);
            } catch (err) {
                errorHandler(err);
            }
        } else {
            setSubmitLoader1(false);
            toast?.error("Can not Recall!");
        }
    };

    const approvalRows = Array.isArray(data2) ? data2 : [];
    const filteredRows = approvalRows.filter((row) =>
        searchQuery
            ? Object.values(row || {})
                  .join("")
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
            : true
    );
    const visibleRows = filteredRows.slice(0, visibleCount);
    const selectedRows = Array.isArray(selectedData) ? selectedData : [];
    const isRowSelected = (row) => selectedRows.some((item) => item?.[dataKey] === row?.[dataKey]);
    const toggleRow = (row) => {
        if (isRowSelected(row)) setSelectedData(selectedRows.filter((item) => item?.[dataKey] !== row?.[dataKey]));
        else setSelectedData([...selectedRows, row]);
    };
    const allVisibleSelected = visibleRows.length > 0 && visibleRows.every(isRowSelected);
    const toggleAllVisible = () => {
        if (allVisibleSelected) {
            const visibleIds = new Set(visibleRows.map((row) => row?.[dataKey]));
            setSelectedData(selectedRows.filter((item) => !visibleIds.has(item?.[dataKey])));
            return;
        }
        const existingIds = new Set(selectedRows.map((item) => item?.[dataKey]));
        setSelectedData([...selectedRows, ...visibleRows.filter((row) => !existingIds.has(row?.[dataKey]))]);
    };
    const columnList = columns || [];
    const titleColumn = columnList.find((col) => /No/i.test(String(col.field))) || columnList[0];
    const subtitleColumn = columnList[0]?.field !== titleColumn?.field ? columnList[0] : null;
    const hiddenFields = [titleColumn?.field, subtitleColumn?.field].filter(Boolean);
    const renderCard = (row, idx) => (
        <div key={`${row?.[dataKey] ?? "row"}-${idx}`} className={`border rounded-lg p-3 shadow-sm ${isRowSelected(row) ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"}`}>
            <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={isRowSelected(row)} onChange={() => toggleRow(row)} aria-label={`Select ${row?.[dataKey] || "row"}`} />
                <div className="min-w-0 flex-1">
                    <div className="font-bold break-words">{titleColumn ? renderColumnCell(titleColumn, row) : "-"}</div>
                    {subtitleColumn && <div className="text-sm text-gray-700 break-words">{renderColumnCell(subtitleColumn, row)}</div>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
                {columnList
                    .filter((col) => !hiddenFields.includes(col.field))
                    .map((col, colIdx) => (
                        <div key={`${col.field}-${colIdx}`} className={WIDE_FIELDS.has(col.field) ? "col-span-2" : ""}>
                            <Field label={col.header}>{renderColumnCell(col, row)}</Field>
                        </div>
                    ))}
            </div>
            {actionBodyTemplate && <div className="mt-3 [&_.p-splitbutton]:w-full [&_.p-splitbutton-defaultbutton]:flex-1">{actionBodyTemplate(row)}</div>}
        </div>
    );

    return (
        <div className="w-full max-w-full min-w-0 overflow-x-hidden">
            {!company || submitLoader || submitLoader1 || submitLoader2 ? (
                <Loader />
            ) : (
                <div>
                    <form className="mt-4  search-btn-parent" onSubmit={formik.handleSubmit}>
                        <div className="">
                            {isInvoice ? (
                                <div className="">
                                    <InputField
                                        id="statusID"
                                        name="statusID"
                                        type="select"
                                        labelFor="statusID"
                                        label="Status"
                                        errors=""
                                        required={false}
                                        width="full"
                                        optionLabel=""
                                        onChange={(...rest) => {
                                            formik.handleChange(...rest);
                                            // status(...rest);
                                        }}
                                        value={formik.values.statusID}
                                        autoFilteredValue={autoFilteredValue}
                                        autoCompleteMethod={searchStatusType}
                                        selectedAutoValue={statusType}
                                        setSelectedAutoValue={setStatusType}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {/* extra field */}
                                    {isCs ? (
                                        isCompanyHide ? null : (
                                            <div>
                                                <div className="">
                                                    <InputField
                                                        id="companyID"
                                                        name="companyID"
                                                        type="select"
                                                        labelFor="companyID"
                                                        label="Select a Company"
                                                        errors=""
                                                        required={false}
                                                        width="full"
                                                        optionLabel=""
                                                        onChange={(...rest) => {
                                                            formik.handleChange(...rest);
                                                            // getCompanyName(...rest);
                                                        }}
                                                        value={formik.values.companyID}
                                                        autoFilteredValue={autoFilteredValue}
                                                        autoCompleteMethod={searchCompany}
                                                        selectedAutoValue={company}
                                                        setSelectedAutoValue={setCompany}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    ) : null}
                                    {/* extra field end */}
                                    <div className="">
                                        <InputField
                                            id="statusID"
                                            name="statusID"
                                            type="select"
                                            labelFor="statusID"
                                            label="Status"
                                            errors=""
                                            required={false}
                                            width="full"
                                            optionLabel=""
                                            onChange={(...rest) => {
                                                formik.handleChange(...rest);
                                                // status(...rest);
                                            }}
                                            value={formik.values.statusID}
                                            autoFilteredValue={autoFilteredValue}
                                            autoCompleteMethod={searchStatusType}
                                            selectedAutoValue={statusType}
                                            setSelectedAutoValue={setStatusType}
                                        />
                                    </div>

                                    {isCs && (
                                        // <di className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-2">
                                        <div className="">
                                            <InputField
                                                id="startDate"
                                                name="startDate"
                                                type="date"
                                                labelFor="startDate"
                                                label="Start Date"
                                                errors=""
                                                required={false}
                                                width="full"
                                                optionLabel=""
                                                onChange={(...rest) => {
                                                    formik.handleChange(...rest);
                                                    getStartDate(...rest);
                                                }}
                                                value={formik.values.startDate}
                                            />
                                        </div>
                                    )}
                                    {isCs && (
                                        <div className="">
                                            <InputField
                                                id="endDate"
                                                name="endDate"
                                                type="date"
                                                labelFor="endDate"
                                                label="End Date"
                                                errors=""
                                                required={false}
                                                width="full"
                                                optionLabel=""
                                                onChange={(...rest) => {
                                                    formik.handleChange(...rest);
                                                    getEndDate(...rest);
                                                }}
                                                value={formik.values.endDate}
                                            />
                                        </div>
                                    )}
                                    {!isInvoice && (
                                        <div className="[&_button]:w-full md:[&_button]:w-auto">
                                            <CommonButton
                                                onClick={() => {
                                                    setButtonType("search");
                                                    searchData();
                                                }}
                                                type="search"
                                                className=" p-mr-2 p-button-raised p-button-primary"
                                                title="search"
                                                disabled={false}
                                                label="Search"
                                                icon="pi pi-search"
                                                color="p-button-raised p-button-danger"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* table start */}
                        <div className="mt-4 min-w-0">
                            {isMobile ? (
                                <div>
                                    <div className="font-bold flex flex-col gap-2">
                                        <h2 className="text-lg py-2 font-bold">{header}</h2>
                                        <input
                                            type="text"
                                            className="block py-2 px-4 text-md text-gray-900 border border-gray-300 rounded-full w-full bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Search"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-sm mb-2 gap-2 mt-3">
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" className="h-5 w-5" checked={allVisibleSelected} onChange={toggleAllVisible} />
                                            Select all shown
                                        </label>
                                        <span className="text-gray-500 text-right">
                                            {selectedRows.length} selected • {filteredRows.length} total
                                        </span>
                                    </div>
                                    {(loading || getDataLoading) && <div className="text-center text-gray-500 py-6">Loading...</div>}
                                    {!(loading || getDataLoading) && filteredRows.length === 0 && <div className="text-center text-gray-500 py-6">No data found</div>}
                                    <div className="flex flex-col gap-3">{visibleRows.map(renderCard)}</div>
                                    {visibleCount < filteredRows.length && (
                                        <div className="mt-3">
                                            <CommonButton type="button" className="w-full" label={`Load more (${filteredRows.length - visibleCount} left)`} onClick={() => setVisibleCount((count) => count + MOBILE_PAGE_SIZE)} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Table
                                    emptyMessage="No data found"
                                    tableHeaderName={header}
                                    tableColumns={columns}
                                    data={data2}
                                    loading={loading || getDataLoading}
                                    dataKey={dataKey}
                                    isTopbarShow={false}
                                    isSelectable={true}
                                    actionButton={actionBodyTemplate}
                                    newBtn={false}
                                    selectedData={selectedData}
                                    // setSelectedData={setSelectedData}
                                    onSelectionChange={(e, a) => {
                                        setSelectedData(e.value);
                                        // //Console.log("e", e, a);
                                    }}
                                    metaKeySelection={false}
                                ></Table>
                            )}
                        </div>
                        {/* table end */}
                        {selectedData?.length > 0 ? (
                            <div className="grid gap-3 grid-cols-1 lg:grid-cols-4 bg-gray-200 mt-4 rounded p-3">
                                <div className="col-span-1 lg:col-span-3 min-w-0">
                                    {buttonType === "approve" || buttonType === "search" ? (
                                        <InputField
                                            id="approvalRemarks"
                                            name="approvalRemarks"
                                            type="textarea"
                                            labelFor="approvalRemarks"
                                            label="Enter your Approval / Rejection Comment...."
                                            errors=""
                                            required={false}
                                            width="full"
                                            optionLabel=""
                                            onChange={formik.handleChange}
                                            value={formik.values.approvalRemarks}
                                        />
                                    ) : (
                                        <InputField
                                            id="approvalRemarks"
                                            name="approvalRemarks"
                                            type="textarea"
                                            labelFor="approvalRemarks"
                                            label="Enter your Approval / Rejection Comment...."
                                            errors=""
                                            required={true}
                                            width="full"
                                            optionLabel=""
                                            onChange={formik.handleChange}
                                            value={formik.values.approvalRemarks}
                                        />
                                    )}
                                </div>
                                <div className="col-span-1 flex flex-col gap-2 justify-center">
                                    <div className="text-xs text-gray-600">{selectedRows.length} selected</div>
                                    <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                                        <CommonButton
                                            onClick={() => {
                                                setButtonType("reject");
                                            }}
                                            className="p-button-raised p-button-danger w-full"
                                            title="Reject"
                                            disabled={rejectBtnStatus}
                                            label="Reject"
                                            icon="pi pi-times"
                                            color="p-button-raised p-button-success"
                                            loading={submitLoader2}
                                        />
                                        <CommonButton
                                            onClick={() => {
                                                setButtonType("approve");
                                            }}
                                            className="p-button-raised p-button-success w-full"
                                            type="submit"
                                            title="Approve"
                                            disabled={approveBtnStatus}
                                            label="Approve"
                                            icon="pi pi-check"
                                            color="p-button-raised p-button-success"
                                            loading={submitLoader}
                                        />
                                    </div>
                                    {isRecall && (
                                        <CommonButton
                                            onClick={() => {
                                                setButtonType("recall");
                                            }}
                                            className="p-button-raised p-button-warning w-full"
                                            title="recall"
                                            disabled={recallBtnStatus}
                                            label="Recall"
                                            icon="pi pi-replay"
                                            color="p-button-raised p-button-danger"
                                            loading={submitLoader1}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-3 grid-cols-1 lg:grid-cols-4 bg-gray-200 mt-4 rounded p-3">
                                <div className="col-span-1 lg:col-span-3 min-w-0">
                                    {buttonType === "approve" || buttonType === "search" ? (
                                        <InputField
                                            id="approvalRemarks"
                                            name="approvalRemarks"
                                            type="textarea"
                                            labelFor="approvalRemarks"
                                            label="Enter your Approval / Rejection Comment...."
                                            errors=""
                                            required={false}
                                            width="full"
                                            optionLabel=""
                                            onChange={formik.handleChange}
                                            value={formik.values.approvalRemarks}
                                        />
                                    ) : (
                                        <InputField
                                            id="approvalRemarks"
                                            name="approvalRemarks"
                                            type="textarea"
                                            labelFor="approvalRemarks"
                                            label="Enter your Approval / Rejection Comment...."
                                            errors=""
                                            required={true}
                                            width="full"
                                            optionLabel=""
                                            onChange={formik.handleChange}
                                            value={formik.values.approvalRemarks}
                                        />
                                    )}
                                    {/*   {
                                        buttonType === "approve"&&{

                                        }
                                    } */}
                                </div>
                                <div className="col-span-1 flex flex-col gap-2 justify-center">
                                    <div className="text-xs text-gray-600">{selectedRows.length} selected</div>
                                    <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                                        {permission?.canReject === 1 ? <CommonButton className="p-button-raised p-button-danger w-full" title="Reject" disabled={rejectBtnStatus} label="Reject" icon="pi pi-times" color="p-button-raised p-button-success" loading={submitLoader2} /> : null}

                                        {permission?.canApprove === 1 ? (
                                            <CommonButton className="p-button-raised p-button-success w-full" type="submit" title="Approve" disabled={approveBtnStatus} label="Approve" icon="pi pi-check" color="p-button-raised p-button-success" loading={submitLoader} />
                                        ) : null}
                                    </div>
                                    {permission?.canRecall === 1 ? (
                                        isRecall && <CommonButton className="p-button-raised p-button-warning w-full" title="recall" disabled={recallBtnStatus} label="Recall" icon="pi pi-replay" color="p-button-raised p-button-danger" loading={submitLoader1} />
                                    ) : (
                                        <div></div>
                                    )}
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            )}
            <ConfirmModal loading={submitLoader2 || submitLoader1} visibleModal={deleteModal} confirmDelete={confirmDelete} onHide={hideModal} item="id" message={`Are you want to recall/reject it?`} />
        </div>
    );
};

export default Approval;
