import { exportToExcel } from "components/Export/exportToExcel";
import React, { useEffect, useRef, useState } from "react";
import { SplitButton } from "primereact/splitbutton";
import { CommonButton } from "../Buttons/Buttons";
import { DataTable } from "primereact/datatable";
import { useHistory } from "react-router-dom";
import { Column } from "primereact/column";
import { CSVLink } from "react-csv";

export const FrozenTable = ({
    isSelectable = true,
    allChakboox = false,
    setCustomSearch,
    scrollable = false,
    scrollHeight = "400px",
    frozenValue = null,
    setSecondCustomSearch,
    rows = 25,
    showRow = 10,
    emptyMessage = "",
    tableHeaderName = "",
    isTopbarShow = true,
    tableColumns,
    extraTableAction,
    data,
    setData,
    selectedData,
    setSelectedData,
    loading = true,
    deleteSelected,
    showCreateModal = false,
    setShowCreateModal,
    dataKey,
    plainData,
    actionButton,
    importExportBtn,
    dialog,
    multiItem = true,
    deleteBtn = false,
    showDeleteModal = false,
    setShowDeleteModal,
    newBtn = true,
    newBtnRoute,
    newMlcRoute,
    newScRoute,
    newSMScRoute,
    exportBtn,
    exportBtnForIADashboard,
    exportFunc,
    ref,
    searchShow = true,
    secondSearchShow = false,
    descriptionSearchShow = false,
    pageShow,
    sortable,
    isColor,
    actionButtonWidth = 8,
    body,
    autoLayout = true,
    exportFileName,
    showTableHeader = true,
    actionHeader,
    lcBtn,
    newActionButton,
    importBtn,
    pdfBtn,
    isRowSelectable,
    sticky,
    backBtn,
    permission,
    onSelectionChange,
    inputFiled,
    extraFieldType,
    customSearch,
    splitBtn,
    splitBtnLabel,
    splitBtnOnClick,
    splitBtnItems,
    splitBtnIcon,
    exportData,
    exportType = "csv",
    rowClassName,
    customBtn,
    editMode,
    rowsPerPageOptions,
    topSelection = true,
    firstButtonLabel,
    firstButtonRoute,
    secondButtonLabel,
    secondButtonRoute,
    thirdButtonLabel,
    thirdButtonRoute,
    newBtnFunc,
    items,
    actionButtonPosition = "right",
    tableHeaderComponent,
    ...rest
}) => {
    /**@isSelectable => select box on the left=> ex: true / false */
    /**@rows => total rows you want=> ex: 10 */
    /**@showRow => total rows you want=> ex: 10 */
    /**@emptyMessage => if no data found message */
    /**@tableHeaderName => Table Header Name/ table name */
    /**@isTopbarShow => topbar buttons => new /delete/ export/ import => true / false*/
    /**@tableColumns => tableColumns you want*/
    /**@data / @setData => state for table data*/
    /**@loading / @setLoading => loading state=> true / false*/
    /** @selectedData / @setSelectedData => state for selected data */
    /** @deleteSelected => delete method */
    /** @showModal / @setShowModal => state for modal */
    /** @deleteSelected => delete method */
    /** @dataKey => unique id of the field */
    /** @actionButton => Action button of the field */
    /** @dialog => method for dialog box*/
    /** @deleteBtn => delete button in topbar => true / false*/
    /** @showCreateModal / @setShowCreateModal => Modal open close state => true / false*/
    /** @newBtn => if you want newBtn => true / false => if @newBtn false send @tableHeaderName */
    /** @newBtnRoute => if you don't want newBtn with route pass your route*/
    /** @exportBtn => If you want export button show up*/
    /** @exportBtnForIADashboard => If you want export button show up*/
    /** @searchShow => If you want to show search button*/
    /** @secondSearchShow => If you want to show search button*/
    /** @descriptionSearchShow => If you want to show search button*/
    /** @sortable => If you want to show shorting*/

    const [search, setSearch] = useState("");
    const [secondSearch, setSecondSearch] = useState("");
    const [descriptionSearch, setDescriptionSearch] = useState("");
    const [tableData, setTableData] = useState([]);
    const [csvExportData, setCSVExportData] = useState([]);

    const dt = useRef(null);
    const history = useHistory();
    const date = new Date(new Date().setHours(new Date().getHours() + 6)).toISOString();
    const route = window.location.href.split("/").pop();

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        if (setCustomSearch) {
            setCustomSearch(value);
        }
    };

    const handleSecondSearchChange = (e) => {
        const value = e.target.value;
        setSecondSearch(value);
        if (setSecondCustomSearch) {
            setSecondCustomSearch(value);
        }
    };

    const handleDescriptionSearchChange = (e) => {
        const value = e.target.value;
        setDescriptionSearch(value);
        if (setDescriptionSearch) {
            setDescriptionSearch(value);
        }
    };

    const tableHeader = (
        <div className={`${searchShow && "table-header"} ${descriptionSearchShow && "table-header"} ${secondSearchShow && "table-header"} font-bold grid grid-cols-1 md:grid-cols-2 items-center`}>
            <p className={`lg:justify-self-start md:justify-self-start justify-self-center ${!tableHeaderComponent && "text-2xl"}`}>{tableHeaderName}</p>
            {(secondSearchShow || descriptionSearchShow || searchShow) && (
                <div className="flex justify-self-center md:justify-self-end gap-2 items-center">
                    {searchShow && (
                        <span className="p-input-icon-right bg-white">
                            <i className="pi pi-search bg-white" />
                            <input value={search} onChange={handleSearchChange} placeholder="Search" className="px-4 py-2 shadow bg-white rounded-full text-lg" />
                        </span>
                    )}
                    {secondSearchShow && (
                        <span className="p-input-icon-right bg-white">
                            <i className="pi pi-search bg-white" />
                            <input value={secondSearch} onChange={handleSecondSearchChange} placeholder="Size Search" className="px-4 py-2 shadow bg-white rounded-full text-lg" />
                        </span>
                    )}
                    {descriptionSearchShow && (
                        <span className="p-input-icon-right bg-white">
                            <i className="pi pi-search bg-white" />
                            <input value={descriptionSearch} onChange={handleDescriptionSearchChange} placeholder="Description Search" className="px-4 py-2 shadow bg-white rounded-full text-lg" />
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    const save = () => {
        // history.push(newMlcRoute);
    };
    const exportColumns = tableColumns?.map((col) => ({ title: col.header, dataKey: col.field }));
    const exportPdf = () => {
        import("jspdf").then((jsPDF) => {
            import("jspdf-autotable").then(() => {
                const doc = new jsPDF.default(0, 0);
                doc.autoTable(exportColumns, tableData);
                doc.save("products.pdf");
            });
        });
    };

    const leftToolbar = (
        <React.Fragment>
            <div className="table-header font-bold grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2  gap-2 items-center ">
                <div className="flex gap-x-3 items-center justify-self-center md:justify-self-start">
                    {newBtn && permission?.canAdd ? (
                        <div>
                            <CommonButton
                                label="New"
                                icon="pi pi-plus"
                                className="p-button-success "
                                type="button"
                                onClick={() => {
                                    if (newBtnRoute) return history.push(newBtnRoute);
                                    if (newBtnFunc) return newBtnFunc();
                                    setShowCreateModal && setShowCreateModal(true);
                                }}
                            />
                        </div>
                    ) : (
                        <></>
                    )}

                    {deleteBtn && permission?.canDelete && (
                        <div>
                            <CommonButton label="Delete" icon="pi pi-trash" className="p-button-danger !p-button-sm" onClick={() => setShowCreateModal(true)} disabled={!selectedData || !selectedData.length} />
                        </div>
                    )}

                    {newActionButton && permission?.canAdd && (
                        <div className="flex gap-2">
                            <SplitButton className="p-button-success p-button-sm" label="New" icon="" onClick={save} model={items}></SplitButton>
                        </div>
                    )}
                    {splitBtn && permission?.canAdd && (
                        <div className="flex gap-2 items-center justify-center">
                            <SplitButton className={` p-button-rounded !p-button-sm p-button-success no-wrap `} label={splitBtnLabel} icon={splitBtnIcon} onClick={splitBtnOnClick} model={splitBtnItems}></SplitButton>
                        </div>
                    )}
                    {importBtn && (
                        <div className="flex gap-2">
                            <CommonButton
                                label="Import"
                                icon="pi pi-download
                            "
                                className="p-button-seccess p-button-sm"
                                onClick={() => {
                                    setShowCreateModal(true);
                                }}
                            />
                        </div>
                    )}
                    {exportBtn && (
                        <>
                            {exportType.toLowerCase() === "csv" && (
                                <CSVLink asyncOnClick={true} data={csvExportData?.length ? csvExportData : tableData} filename={`${exportFileName || route}-D${date.split("T")[0].replace(/-/g, "")}T${date.split("T")[1].replace(/:/g, "").split(".")[0]}`}>
                                    <CommonButton
                                        label="Export"
                                        icon="pi pi-upload
"
                                        type="button"
                                        className={`p-button-help !bg-orange-400  ${!splitBtn && "p-button-sm"}`}
                                        bigButton={splitBtn}
                                    />
                                </CSVLink>
                            )}

                            {exportType.toLowerCase() === "excel" && (
                                <CommonButton
                                    label="Export"
                                    icon="pi pi-upload
"
                                    type="button"
                                    className={`p-button-help !bg-orange-400  ${!splitBtn && "p-button-sm"}`}
                                    bigButton={splitBtn}
                                    onClick={(e) => {
                                        const apiData = exportData?.length ? exportData : tableData;
                                        const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
                                        const fileExtension = ".xlsx";
                                        const filename = `${exportFileName || route}-D${new Date().toISOString().split("T")[0].replace(/-/g, "")}T${new Date().toISOString().split("T")[1].replace(/:/g, "").split(".")[0]}`;
                                        exportToExcel(filename, apiData, fileType, fileExtension);
                                    }}
                                />
                            )}
                        </>
                    )}
                    {exportBtnForIADashboard && (
                        <>
                            {exportType.toLowerCase() === "csv" && (
                                <CSVLink asyncOnClick={true} data={csvExportData?.length ? csvExportData : tableData} filename={`${exportFileName || route}-D${date.split("T")[0].replace(/-/g, "")}T${date.split("T")[1].replace(/:/g, "").split(".")[0]}`}>
                                    <CommonButton
                                        label="Export to Excel"
                                        icon="pi pi-upload
"
                                        type="button"
                                        className={`p-button-help !bg-orange-400  ${!splitBtn && "p-button-sm"}`}
                                        bigButton={splitBtn}
                                    />
                                </CSVLink>
                            )}

                            {exportType.toLowerCase() === "excel" && (
                                <CommonButton
                                    label="Export to Excel"
                                    icon="pi pi-upload
"
                                    type="button"
                                    className={`p-button-help !bg-orange-400  ${!splitBtn && "p-button-sm"}`}
                                    bigButton={splitBtn}
                                    onClick={(e) => {
                                        const apiData = exportData?.length ? exportData : tableData;
                                        const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
                                        const fileExtension = ".xlsx";
                                        const filename = `${exportFileName || route}-D${new Date().toISOString().split("T")[0].replace(/-/g, "")}T${new Date().toISOString().split("T")[1].replace(/:/g, "").split(".")[0]}`;
                                        exportToExcel(filename, apiData, fileType, fileExtension);
                                    }}
                                />
                            )}
                        </>
                    )}
                    {pdfBtn && (
                        <>
                            <CommonButton type="button" icon="pi pi-file-pdf" severity="warning" rounded onClick={exportPdf} data-pr-tooltip="PDF" />
                        </>
                    )}
                    {customBtn &&
                        customBtn?.map(({ label, icon, className, onClick, loading, disabled }) => {
                            return <CommonButton label={label} icon={icon} className={className} onClick={onClick} loading={loading} disabled={loading || disabled} />;
                        })}

                    {backBtn && (
                        <div className="flex p-justify-end">
                            <CommonButton
                                onClick={() => {
                                    history.goBack();
                                }}
                                className="p-mr-2 p-button-raised bg-gray-200 shadow-none text-gray-600 p-button-sm"
                                title="Back"
                                type="reset"
                                disabled={false}
                                label="Back"
                                icon="pi pi-arrow-left"
                                color="p-button-raised p-button-success"
                            ></CommonButton>
                        </div>
                    )}
                </div>

                {(secondSearchShow || descriptionSearchShow || searchShow) && (
                    <div className="flex justify-self-center md:justify-self-end gap-2 items-center">
                        {searchShow && (
                            <span className="p-input-icon-right bg-white">
                                <i className="pi pi-search bg-white" />
                                <input value={search} onChange={handleSearchChange} placeholder="Search" className="px-4 py-2 shadow bg-white rounded-full text-lg" />
                            </span>
                        )}
                        {secondSearchShow && (
                            <span className="p-input-icon-right bg-white">
                                <i className="pi pi-search bg-white" />
                                <input value={secondSearch} onChange={handleSecondSearchChange} placeholder="Size Search" className="px-4 py-2 shadow bg-white rounded-full text-lg" />
                            </span>
                        )}
                        {descriptionSearchShow && (
                            <span className="p-input-icon-right bg-white">
                                <i className="pi pi-search bg-white" />
                                <input value={descriptionSearch} onChange={handleDescriptionSearchChange} placeholder="Description Search" className="px-4 py-2 shadow bg-white rounded-full text-lg" />
                            </span>
                        )}
                    </div>
                )}
            </div>
        </React.Fragment>
    );

    useEffect(() => {
        // If there's no data, set the table data to an empty array
        if (!data || !data.length) {
            //Console.log("No data available, setting table data to empty.");
            return setTableData([]);
        }

        // Initialize filteredData with the original data
        let filteredData = [...data];

        // Apply first search across all fields
        if (search) {
            filteredData = filteredData.filter((item) => {
                const matchesSearch = Object.values(item).some((value) => String(value).toLowerCase().includes(search.toLowerCase()));
                //Console.log(`Item: ${JSON.stringify(item)}, Matches Search: ${matchesSearch}`);
                return matchesSearch;
            });
            //Console.log(`Filtered Data after first search ("${search}"):`, filteredData);
        }

        // Apply second search only for the "size" column
        if (secondSearch) {
            filteredData = filteredData.filter((item) => {
                const sizeVal = item.size?.toString().toLowerCase(); // Ensure size is lower case for matching
                const matchesSecondSearch = sizeVal?.includes(secondSearch.toLowerCase());
                //Console.log(`Item: ${JSON.stringify(item)}, Matches Second Search: ${matchesSecondSearch}`);
                return matchesSecondSearch; // Only return items where size matches secondSearch
            });
            //Console.log(`Filtered Data after second search ("${secondSearch}"):`, filteredData);
        }
        if (descriptionSearch) {
            filteredData = filteredData.filter((item) => {
                const descriptionVal = item.materialDescription?.toString().toLowerCase();
                const matchesDescriptionSearch = descriptionVal?.includes(descriptionSearch.toLowerCase());
                //Console.log(`Item: ${JSON.stringify(item)}, Matches Description Search: ${matchesDescriptionSearch}`);
                return matchesDescriptionSearch;
            });
        }

        // Update table data based on the filtered result
        setTableData(filteredData);
    }, [search, secondSearch, descriptionSearch, data]);

    useEffect(() => {
        const updatedArray = tableData?.length
            ? tableData?.map((obj) => {
                  const { createdBy, createdDate, ...rest } = obj;
                  for (const key in rest) {
                      if (key.includes("ID")) {
                          delete rest[key];
                      }
                  }
                  return rest;
              })
            : [];
        setCSVExportData(updatedArray);
    }, [tableData]);

    return (
        <div className={`overflow-x-auto ${sticky && "sticky"} ${!topSelection && "hideCheckBox"}`}>
            {/* <div className="p-col-12"> */}
            <div className="card">
                <DataTable
                    className="p-datatable-gridlines p-datatable-striped p-datatable-sm p-datatable-customers"
                    value={
                        plainData && Array.isArray(data)
                            ? data
                            : Array.isArray(data)
                            ? data.filter((obj) => {
                                  if (!Array.isArray(tableColumns)) return [];

                                  // Check if the item matches the first search across all columns
                                  const matchesFirstSearch = search
                                      ? tableColumns.some((searchKey) => {
                                            const key = searchKey.field;
                                            const val = obj[key]?.toString()?.toLowerCase();
                                            return val?.includes(search.toLowerCase());
                                        })
                                      : true; // If no search term, include all items

                                  // Check if the item matches the second search only for the "size" column
                                  const matchesSecondSearch = secondSearch
                                      ? tableColumns.some((searchKey) => {
                                            // Ensure we're only checking the "size" column for the second search
                                            return searchKey.field === "size" && obj[searchKey.field]?.toString()?.toLowerCase().includes(secondSearch.toLowerCase());
                                        })
                                      : true; // If no second search term, include all items

                                  // Check if the item matches the second search only for the "materialDescription" column
                                  const matchesMaterialDescription = descriptionSearch
                                      ? tableColumns.some((searchKey) => {
                                            // Ensure we're only checking the "size" column for the second search
                                            return searchKey.field === "materialDescription" && obj[searchKey.field]?.toString()?.toLowerCase().includes(descriptionSearch.toLowerCase());
                                        })
                                      : true; // If no second search term, include all items

                                  // Return true only if both searches match or are not provided
                                  return matchesFirstSearch && matchesSecondSearch && matchesMaterialDescription;
                              })
                            : []
                    }
                    paginator={pageShow === false ? false : true}
                    rows={showRow || 10}
                    dataKey={dataKey}
                    rowHover
                    selection={selectedData}
                    onSelectionChange={(e, a) => {
                        if (onSelectionChange) return onSelectionChange(e, a);
                        if (e.type === "all") {
                            if (e.value.length === 0) {
                                return setSelectedData([]);
                            }
                            return setSelectedData?.(data);
                        }
                        setSelectedData?.(e.value);
                    }}
                    emptyMessage={emptyMessage}
                    loading={loading}
                    header={showTableHeader ? (newBtn || !tableHeaderName ? leftToolbar : tableHeader) : null}
                    rowsPerPageOptions={rowsPerPageOptions ? rowsPerPageOptions : [15, 25, 50, 75]}
                    paginatorTemplate={pageShow && "CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"}
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
                    resizableColumns
                    columnResizeMode="expand"
                    showGridlines
                    stripedRows
                    autoLayout={autoLayout}
                    responsiveLayout="scroll"
                    selectionMode="checkbox"
                    isDataSelectable={isRowSelectable}
                    rowClassName={rowClassName}
                    selectionAutoFocus={false}
                    editMode={editMode || "cell"}
                    scrollable={scrollable}
                    scrollHeight={scrollHeight}
                    frozenValue={frozenValue}
                    {...rest}
                >
                    {/* {isSelectable && (
                        <Column
                            selectionMode="multiple"
                            selectionAutoFocus={false}
                            headerStyle={
                                isSelectable && allChakboox
                                    ? {
                                          minWidth: "2rem",
                                          fontWeight: "bold",
                                          pointerEvents: "none",
                                          //   backgroundColor: "#0000FF",
                                      }
                                    : { minWidth: "20rem !important" }
                            }
                            ref={dt}
                        ></Column>
                    )} */}

                    {isSelectable && (
                        <Column
                            selectionMode="multiple"
                            selectionAutoFocus={false}
                            headerStyle={
                                isSelectable && allChakboox
                                    ? {
                                          minWidth: "2rem",
                                          fontWeight: "bold",
                                          pointerEvents: "none",
                                      }
                                    : { minWidth: "20rem !important" }
                            }
                            ref={dt}
                        ></Column>
                    )}

                    {/* Render action button on left if specified */}
                    {actionButton && actionButtonPosition === "left" && <Column body={actionButton} header={actionHeader || "Action"} headerStyle={{ textAlign: "center", width: `${actionButtonWidth}rem` }}></Column>}

                    {Array.isArray(tableColumns) &&
                        tableColumns
                            ?.filter(Boolean)
                            ?.map((col, i) => (
                                <Column
                                    key={i}
                                    frozen={col.frozen}
                                    field={col?.field}
                                    header={col?.header}
                                    sortable={sortable}
                                    body={col?.sortableBody}
                                    footer={col?.footer}
                                    footerClassName={col?.footerClassName}
                                    style={col?.style}
                                    editor={col?.editor}
                                    onCellEditComplete={col?.onCellEditComplete}
                                ></Column>
                            ))}
                    {/* {actionButton && <Column body={actionButton} header={actionHeader || "Action"} headerStyle={{ textAlign: "center", width: `${actionButtonWidth}rem` }}></Column>} */}

                    {/* Render action button on right if specified (default) */}
                    {actionButton && actionButtonPosition === "right" && <Column body={actionButton} header={actionHeader || "Action"} headerStyle={{ textAlign: "center", width: `${actionButtonWidth}rem` }}></Column>}

                    {extraTableAction?.map((col, i) => (
                        <Column key={i} body={col.body} header={col.header} headerStyle={{ textAlign: "center" }}></Column>
                    ))}
                    {editMode === "row" && <Column rowEditor bodyStyle={{ textAlign: "center" }}></Column>}
                </DataTable>
            </div>
        </div>
    );
};
