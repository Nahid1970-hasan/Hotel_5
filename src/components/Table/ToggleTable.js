import { exportToExcel } from "components/Export/exportToExcel";
import React, { useEffect, useRef, useState } from "react";
import { SplitButton } from "primereact/splitbutton";
import { CommonButton } from "../Buttons/Buttons";
import { DataTable } from "primereact/datatable";
import { useHistory } from "react-router-dom";
import { Column } from "primereact/column";
import { CSVLink } from "react-csv";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from "primereact/multiselect";
import * as XLSX from "xlsx";
import { userInfo } from "service/login";

const { EmpID } = userInfo();

/**
 * Full reusable Table component with Column Freeze and Column Toggle support.
 *
 * Features:
 * - Column Freezing: Dialog-based freeze/unfreeze with localStorage persistence
 * - Column Toggle: MultiSelect dropdown to show/hide columns with localStorage persistence
 * - Selectable rows with custom checkbox styling
 * - Multiple search filters (main, size, description)
 * - Export functionality (CSV/Excel/PDF)
 * - Action buttons (New, Delete, Import, Export, etc.)
 * - Automatic pagination
 * - Column resizing
 * - Sorting support
 *
 * @param {Object} props - Component props
 */

export const ToggleTable = ({
    isSelectable = true,
    allChakboox = false,
    setCustomSearch,
    setSecondCustomSearch,
    rows = 25,
    showRow = 10,
    emptyMessage = "",
    tableHeaderName = "",
    isTopbarShow = true,
    headerGroup,
    footerGroup,
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
    exportType = "excel",
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
    checkboxCellColor,

    // Column freezing props
    enableColumnFreeze = true,

    // Column toggle props (MultiSelect approach)
    enableColumnToggle = false,

    // User/Table identification for localStorage
    userId = EmpID,
    tableId,

    ...rest
}) => {
    // ============================================
    // STATE MANAGEMENT
    // ============================================

    const [search, setSearch] = useState("");
    const [secondSearch, setSecondSearch] = useState("");
    const [descriptionSearch, setDescriptionSearch] = useState("");
    const [tableData, setTableData] = useState([]);
    const [csvExportData, setCSVExportData] = useState([]);

    // Column freezing state
    const [showFreezeDialog, setShowFreezeDialog] = useState(false);
    const [frozenColumns, setFrozenColumns] = useState([]);

    // Column toggle state (MultiSelect approach)
    const [visibleColumns, setVisibleColumns] = useState(Array.isArray(tableColumns) ? tableColumns.filter(Boolean) : []);
    const [userHasSelectedColumns, setUserHasSelectedColumns] = useState(false);

    // ============================================
    // REFS AND HOOKS
    // ============================================

    const dt = useRef(null);
    const history = useHistory();
    const date = new Date(new Date().setHours(new Date().getHours() + 6)).toISOString();
    const route = window.location.href.split("/").pop();

    // Storage keys for localStorage
    const freezeStorageKey = `table_freeze_${tableId}_${userId}`;
    const toggleStorageKey = `table_toggle_${tableId}_${userId}`;

    // ============================================
    // COLUMN FREEZING FUNCTIONALITY
    // ============================================

    /**
     * Load frozen columns from localStorage on component mount
     */
    useEffect(() => {
        if (enableColumnFreeze && userId && tableId) {
            const savedFrozenColumns = localStorage.getItem(freezeStorageKey);
            if (savedFrozenColumns) {
                try {
                    setFrozenColumns(JSON.parse(savedFrozenColumns));
                } catch (error) {
                    console.error("Error loading frozen columns:", error);
                }
            }
        }
    }, [enableColumnFreeze, userId, tableId]);

    /**
     * Save frozen columns to localStorage whenever they change
     */
    useEffect(() => {
        if (enableColumnFreeze && userId && tableId && frozenColumns.length >= 0) {
            localStorage.setItem(freezeStorageKey, JSON.stringify(frozenColumns));
        }
    }, [frozenColumns, enableColumnFreeze, userId, tableId]);

    /**
     * Toggle freeze status for a column
     */
    const toggleColumnFreeze = (field) => {
        setFrozenColumns((prev) => {
            if (prev.includes(field)) {
                return prev.filter((col) => col !== field);
            } else {
                return [...prev, field];
            }
        });
    };

    /**
     * Check if a column is frozen
     */
    const isColumnFrozen = (field) => {
        return frozenColumns.includes(field);
    };

    /**
     * Calculate the left position for frozen columns
     */
    const getFrozenColumnLeft = (field) => {
        const index = frozenColumns.indexOf(field);
        if (index === -1) return 0;

        let leftPosition = 0;

        // Add checkbox column width if selectable
        if (isSelectable) {
            leftPosition += 50;
        }

        // Add left action column width if present
        if (actionButton && actionButtonPosition === "left") {
            leftPosition += actionButtonWidth * 16;
        }

        // Calculate cumulative width of previous frozen columns
        for (let i = 0; i < index; i++) {
            const prevField = frozenColumns[i];
            const prevColumn = tableColumns.find((col) => col?.field === prevField);

            let columnWidth = 150; // Default width

            if (prevColumn?.style?.width) {
                const width = prevColumn.style.width;
                if (typeof width === "string" && width.includes("px")) {
                    columnWidth = parseInt(width);
                } else if (typeof width === "string" && width.includes("rem")) {
                    columnWidth = parseFloat(width) * 16;
                } else if (typeof width === "number") {
                    columnWidth = width;
                }
            } else if (prevColumn?.style?.minWidth) {
                const width = prevColumn.style.minWidth;
                if (typeof width === "string" && width.includes("px")) {
                    columnWidth = parseInt(width);
                } else if (typeof width === "string" && width.includes("rem")) {
                    columnWidth = parseFloat(width) * 16;
                } else if (typeof width === "number") {
                    columnWidth = width;
                }
            }

            leftPosition += columnWidth;
        }

        return leftPosition;
    };

    // ============================================
    // COLUMN TOGGLE FUNCTIONALITY (MultiSelect)
    // ============================================

    /**
     * Load visible columns from localStorage on component mount
     */
    useEffect(() => {
        if (enableColumnToggle && userId && tableId && tableColumns?.length) {
            const savedVisibleColumns = localStorage.getItem(toggleStorageKey);
            if (savedVisibleColumns) {
                try {
                    const savedFields = JSON.parse(savedVisibleColumns);
                    const restoredColumns = tableColumns.filter(Boolean).filter((col) => savedFields.includes(col.field));

                    if (restoredColumns.length > 0) {
                        setVisibleColumns(restoredColumns);
                        setUserHasSelectedColumns(true);
                    } else {
                        setVisibleColumns(tableColumns.filter(Boolean));
                    }
                } catch (error) {
                    console.error("Error loading visible columns:", error);
                    setVisibleColumns(tableColumns.filter(Boolean));
                }
            } else {
                setVisibleColumns(tableColumns.filter(Boolean));
            }
        } else if (!userHasSelectedColumns && tableColumns?.length) {
            setVisibleColumns(tableColumns.filter(Boolean));
        }
    }, [enableColumnToggle, userId, tableId, tableColumns, userHasSelectedColumns]);

    /**
     * Save visible columns to localStorage whenever they change
     */
    useEffect(() => {
        if (enableColumnToggle && userId && tableId && visibleColumns.length > 0 && userHasSelectedColumns) {
            const fieldsToSave = visibleColumns.map((col) => col.field);
            localStorage.setItem(toggleStorageKey, JSON.stringify(fieldsToSave));
        }
    }, [visibleColumns, enableColumnToggle, userId, tableId, userHasSelectedColumns]);

    /**
     * Handle column toggle from MultiSelect
     */
    const onColumnToggle = (event) => {
        const selectedColumns = event.value || [];
        // Preserve original ordering by filtering tableColumns
        const orderedSelectedColumns = (Array.isArray(tableColumns) ? tableColumns : []).filter(Boolean).filter((col) => selectedColumns.some((sCol) => sCol.field === col.field));

        setVisibleColumns(orderedSelectedColumns);
        setUserHasSelectedColumns(true);
    };

    /**
     * Determine which columns to render
     */
    const columnsToRender = enableColumnToggle ? visibleColumns : Array.isArray(tableColumns) ? tableColumns.filter(Boolean) : [];

    // ============================================
    // DIALOGS
    // ============================================

    /**
     * Render column freeze configuration dialog
     */
    const renderFreezeDialog = () => (
        <Dialog header="Freeze Columns" visible={showFreezeDialog} style={{ width: "450px" }} onHide={() => setShowFreezeDialog(false)} modal>
            <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-600 mb-2">Select columns to freeze. Frozen columns will remain visible while scrolling horizontally.</p>

                <div className="max-h-96 overflow-y-auto">
                    {columnsToRender?.map((col, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox inputId={`freeze-${col.field}`} checked={isColumnFrozen(col.field)} onChange={() => toggleColumnFreeze(col.field)} />
                            <label htmlFor={`freeze-${col.field}`} className="cursor-pointer flex-1">
                                {col.header}
                            </label>
                            {isColumnFrozen(col.field) && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Frozen</span>}
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                    <span className="text-sm text-gray-600">{frozenColumns.length} column(s) frozen</span>
                    <div className="flex gap-2">
                        <Button label="Clear All" icon="pi pi-times" className="p-button-text p-button-danger" onClick={() => setFrozenColumns([])} disabled={frozenColumns.length === 0} />
                        <Button label="Done" icon="pi pi-check" onClick={() => setShowFreezeDialog(false)} />
                    </div>
                </div>
            </div>
        </Dialog>
    );

    // ============================================
    // CHECKBOX RENDERING
    // ============================================

    /**
     * Custom checkbox body template with conditional background color
     */
    const checkboxBodyTemplate = (rowData, options) => {
        const backgroundColor = checkboxCellColor ? (typeof checkboxCellColor === "function" ? checkboxCellColor(rowData) : checkboxCellColor[rowData.id] || checkboxCellColor.default) : "transparent";

        return (
            <div
                style={{
                    backgroundColor,
                    padding: "0.25rem",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "3rem", // minimum width
                    width: "3rem", // fixed width
                    maxWidth: "3rem",
                }}
            >
                <input
                    type="checkbox"
                    checked={selectedData?.includes(rowData)}
                    onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                            if (!selectedData?.includes(rowData)) {
                                setSelectedData?.((prev) => [...(prev || []), rowData]);
                            }
                        } else {
                            setSelectedData?.((prev) => prev?.filter((item) => item !== rowData) || []);
                        }
                    }}
                    style={{
                        margin: 0,
                        width: "1rem",
                        height: "1rem",
                    }}
                />
            </div>
        );
    };

    // ============================================
    // SEARCH HANDLERS
    // ============================================

    /**
     * Main search input handler
     */
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        if (setCustomSearch) setCustomSearch(value);
    };

    /**
     * Secondary search input handler (for size)
     */
    const handleSecondSearchChange = (e) => {
        const value = e.target.value;
        setSecondSearch(value);
        if (setSecondCustomSearch) setSecondCustomSearch(value);
    };

    /**
     * Description search input handler
     */
    const handleDescriptionSearchChange = (e) => {
        const value = e.target.value;
        setDescriptionSearch(value);
    };

    // ============================================
    // EXPORT FUNCTIONALITY
    // ============================================

    const exportColumns = tableColumns?.map((col) => ({ title: col.header, dataKey: col.field }));

    /**
     * Export to PDF using visible columns
     */
    const exportPdf = () => {
        import("jspdf").then((jsPDF) => {
            import("jspdf-autotable").then(() => {
                const doc = new jsPDF.default(0, 0);
                const exportCols = columnsToRender.map((c) => ({ title: c.header, dataKey: c.field }));
                const rowsSource = plainData && Array.isArray(data) ? data : tableData;
                doc.autoTable({
                    columns: exportCols,
                    body: rowsSource,
                });
                doc.save(`${exportFileName || route}.pdf`);
            });
        });
    };

    /**
     * Export to Excel with branded template
     */
    const exportToBrandedExcel = () => {
        try {
            const exportTimestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
            const filename = `${exportFileName || route}_${exportTimestamp}`;

            const exportColumns = columnsToRender.filter((col) => col.field !== "slNo");
            const columnHeaders = exportColumns.filter(Boolean).map((col) => col.header);

            const dataRows = tableData.map((row) => {
                return exportColumns.filter(Boolean).map((col) => {
                    const value = row[col.field];
                    if (value === null || value === undefined || value === "") {
                        const isNumberColumn = tableData.some((r) => {
                            const v = r[col.field];
                            return v !== null && v !== undefined && v !== "" && !isNaN(parseFloat(v));
                        });
                        return isNumberColumn ? 0 : "";
                    }
                    return value;
                });
            });

            const wsData = [columnHeaders, ...dataRows];
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const colWidths = exportColumns.map(() => ({ wch: 15 }));
            ws["!cols"] = colWidths;
            XLSX.utils.book_append_sheet(wb, ws, "Export Data");
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } catch (error) {
            console.error("Excel export error:", error);
        }
    };

    /**
     * Renders CSV export button
     */
    const renderCSVExport = (isIADashboard = false) => (
        <CSVLink
            asyncOnClick={true}
            data={csvExportData?.length ? csvExportData : plainData ? data : tableData}
            headers={columnsToRender.map((c) => ({ label: c.header, key: c.field }))}
            filename={`${exportFileName || route}-D${date.split("T")[0].replace(/-/g, "")}T${date.split("T")[1].replace(/:/g, "").split(".")[0]}`}
        >
            <CommonButton label={isIADashboard ? "Export to Excel" : "Export"} icon="pi pi-upload" type="button" className={`p-button-help !bg-orange-400 ${!splitBtn && "p-button-sm"}`} bigButton={splitBtn} />
        </CSVLink>
    );

    /**
     * Renders Excel export button
     */
    const renderExcelExport = (isIADashboard = false) => <CommonButton label={isIADashboard ? "Export to Excel" : "Export"} icon="pi pi-upload" type="button" className={`p-button-help !bg-orange-400 ${!splitBtn && "p-button-sm"}`} bigButton={splitBtn} onClick={exportToBrandedExcel} />;

    // ============================================
    // TABLE HEADER (Simple header with search)
    // ============================================

    const tableHeader = (
        <div className={`${searchShow && "table-header"} ${descriptionSearchShow && "table-header"} ${secondSearchShow && "table-header"} font-bold grid grid-cols-1 md:grid-cols-2 items-center`}>
            <p className={`lg:justify-self-start md:justify-self-start justify-self-center ${!tableHeaderComponent && "text-2xl"}`}>{tableHeaderName}</p>
            {(secondSearchShow || descriptionSearchShow || searchShow || enableColumnToggle) && (
                <div className="flex justify-self-center md:justify-self-end gap-2 items-center flex-wrap">
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

                    {/* MultiSelect for Column Toggle */}
                    {enableColumnToggle && Array.isArray(tableColumns) && tableColumns.length > 0 && <MultiSelect value={visibleColumns} options={tableColumns.filter(Boolean)} optionLabel="header" onChange={onColumnToggle} display="chip" placeholder="Toggle Columns" className="w-full sm:w-64" />}
                </div>
            )}
        </div>
    );

    // ============================================
    // LEFT TOOLBAR (Action Buttons)
    // ============================================

    const leftToolbar = (
        <React.Fragment>
            <div className="table-header font-bold grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-2 items-center">
                <div className="flex gap-x-3 items-center justify-self-center md:justify-self-start flex-wrap">
                    {/* NEW BUTTON */}
                    {newBtn && permission?.canAdd && (
                        <CommonButton
                            label="New"
                            icon="pi pi-plus"
                            className="p-button-success"
                            type="button"
                            onClick={() => {
                                if (newBtnRoute) return history.push(newBtnRoute);
                                if (newBtnFunc) return newBtnFunc();
                                setShowCreateModal && setShowCreateModal(true);
                            }}
                        />
                    )}

                    {/* DELETE BUTTON */}
                    {deleteBtn && permission?.canDelete && <CommonButton label="Delete" icon="pi pi-trash" className="p-button-danger !p-button-sm" onClick={() => setShowCreateModal(true)} disabled={!selectedData || !selectedData.length} />}

                    {/* NEW ACTION BUTTON (Split Button) */}
                    {newActionButton && permission?.canAdd && (
                        <SplitButton
                            className="p-button-success p-button-sm"
                            label="New"
                            icon=""
                            onClick={() => {
                                if (newMlcRoute) history.push(newMlcRoute);
                            }}
                            model={items}
                        />
                    )}

                    {/* CUSTOM SPLIT BUTTON */}
                    {splitBtn && permission?.canAdd && <SplitButton className="p-button-rounded !p-button-sm p-button-success no-wrap" label={splitBtnLabel} icon={splitBtnIcon} onClick={splitBtnOnClick} model={splitBtnItems} />}

                    {/* IMPORT BUTTON */}
                    {importBtn && <CommonButton label="Import" icon="pi pi-download" className="p-button-seccess p-button-sm" onClick={() => setShowCreateModal(true)} />}

                    {/* COLUMN FREEZE BUTTON */}
                    {enableColumnFreeze && userId && tableId && <CommonButton label="Freeze Columns" icon="pi pi-lock" className="p-button-info p-button-sm" onClick={() => setShowFreezeDialog(true)} tooltip="Configure frozen columns" />}

                    {/* EXPORT BUTTONS */}
                    {exportBtn && (
                        <>
                            {exportType.toLowerCase() === "csv" && renderCSVExport()}
                            {exportType.toLowerCase() === "excel" && renderExcelExport()}
                        </>
                    )}

                    {/* EXPORT BUTTON FOR IA DASHBOARD */}
                    {exportBtnForIADashboard && (
                        <>
                            {exportType.toLowerCase() === "csv" && renderCSVExport(true)}
                            {exportType.toLowerCase() === "excel" && renderExcelExport(true)}
                        </>
                    )}

                    {/* PDF EXPORT BUTTON */}
                    {pdfBtn && <CommonButton type="button" icon="pi pi-file-pdf" severity="warning" rounded onClick={exportPdf} data-pr-tooltip="PDF" />}

                    {/* CUSTOM BUTTONS */}
                    {customBtn &&
                        customBtn?.map(({ label, icon, className, onClick, loading, disabled, element }, index) =>
                            element ? (
                                <React.Fragment key={index}>{element}</React.Fragment>
                            ) : (
                                <CommonButton key={index} label={label} icon={icon} className={className} onClick={onClick} loading={loading} disabled={loading || disabled} />
                            )
                        )}

                    {/* BACK BUTTON */}
                    {backBtn && <CommonButton onClick={() => history.goBack()} className="p-mr-2 p-button-raised bg-gray-200 shadow-none text-gray-600 p-button-sm" title="Back" type="reset" disabled={false} label="Back" icon="pi pi-arrow-left" color="p-button-raised p-button-success" />}
                </div>

                {/* SEARCH INPUTS AND COLUMN TOGGLE */}
                {(secondSearchShow || descriptionSearchShow || searchShow || enableColumnToggle) && (
                    <div className="flex justify-self-center md:justify-self-end gap-2 items-center flex-wrap">
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

                        {/* MultiSelect for Column Toggle */}
                        {enableColumnToggle && Array.isArray(tableColumns) && tableColumns.length > 0 && (
                            <MultiSelect value={visibleColumns} options={tableColumns.filter(Boolean)} optionLabel="header" onChange={onColumnToggle} display="chip" placeholder="Toggle Columns" className="w-full sm:w-64" />
                        )}
                    </div>
                )}
            </div>
        </React.Fragment>
    );

    // ============================================
    // EFFECTS
    // ============================================

    /**
     * Filter data based on search criteria
     */
    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) {
            setTableData([]);
            return;
        }

        let filtered = [...data];

        // Apply main search filter
        if (search) {
            const q = search.toString().toLowerCase();
            filtered = filtered.filter((item) =>
                Object.values(item).some((val) =>
                    String(val ?? "")
                        .toLowerCase()
                        .includes(q)
                )
            );
        }

        // Apply size search filter
        if (secondSearch) {
            const q = secondSearch.toString().toLowerCase();
            filtered = filtered.filter((item) =>
                String(item?.size ?? "")
                    .toLowerCase()
                    .includes(q)
            );
        }

        // Apply description search filter
        if (descriptionSearch) {
            const q = descriptionSearch.toString().toLowerCase();
            filtered = filtered.filter((item) =>
                String(item?.materialDescription ?? "")
                    .toLowerCase()
                    .includes(q)
            );
        }

        setTableData(filtered);
    }, [search, secondSearch, descriptionSearch, data]);

    /**
     * Prepare CSV export data according to columnsToRender
     */
    useEffect(() => {
        const rowsSource = Array.isArray(exportData) && exportData.length ? exportData : plainData && Array.isArray(data) ? data : tableData;

        const cols = columnsToRender;

        const prepared = Array.isArray(rowsSource)
            ? rowsSource.map((row) => {
                  const item = {};
                  cols.forEach((col) => {
                      item[col.field] = row?.[col.field];
                  });
                  return item;
              })
            : [];

        setCSVExportData(prepared);
    }, [tableData, data, exportData, plainData, columnsToRender]);

    /**
     * Add frozen column styles
     */
    useEffect(() => {
        const styleId = "frozen-column-styles";

        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.innerHTML = `
                /* Frozen Column Styles */
                .p-datatable .p-datatable-thead > tr > th.p-frozen-column,
                .p-datatable .p-datatable-tbody > tr > td.p-frozen-column {
                    background: white !important;
                    opacity: 1 !important;
                    z-index: 2 !important;
                    position: sticky !important;
                }

                .p-datatable .p-datatable-thead > tr > th.p-frozen-column {
                    z-index: 11 !important;
                    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
                }

                .p-datatable-striped .p-datatable-tbody > tr:nth-child(even) > td.p-frozen-column {
                    background: #f8f9fa !important;
                }

                .p-datatable-striped .p-datatable-tbody > tr:nth-child(odd) > td.p-frozen-column {
                    background: white !important;
                }

                .p-datatable .p-frozen-column {
                    border-right: 2px solid #dee2e6 !important;
                }

                .p-datatable-hoverable-rows .p-datatable-tbody > tr:hover > td.p-frozen-column {
                    background: #e9ecef !important;
                }
            `;
            document.head.appendChild(style);
        }

        return () => {
            const existingStyle = document.getElementById(styleId);
            if (existingStyle && !document.querySelector(".p-datatable")) {
                existingStyle.remove();
            }
        };
    }, []);

    // ============================================
    // SELECTION HANDLER
    // ============================================

    /**
     * Custom selection change handler
     */
    const handleSelectionChange = (e) => {
        if (onSelectionChange) {
            return onSelectionChange(e);
        }

        if (e.type === "all") {
            if (e.value.length === 0) {
                return setSelectedData([]);
            }
            return setSelectedData?.(plainData && Array.isArray(data) ? data : tableData);
        }

        setSelectedData?.(e.value);
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className={`overflow-x-auto ${sticky && "sticky"} ${!topSelection && "hideCheckBox"}`}>
            <div className="card">
                <DataTable
                    className="p-datatable-gridlines p-datatable-striped p-datatable-sm p-datatable-customers"
                    value={plainData && Array.isArray(data) ? data : Array.isArray(data) ? tableData : []}
                    headerColumnGroup={headerGroup}
                    footerColumnGroup={footerGroup}
                    paginator={pageShow === false ? false : true}
                    rows={showRow || 10}
                    dataKey={dataKey}
                    rowHover
                    selection={selectedData}
                    onSelectionChange={handleSelectionChange}
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
                    {...rest}
                >
                    {/* CHECKBOX COLUMN */}
                    {isSelectable && (
                        <Column
                            selectionMode={checkboxCellColor ? null : "multiple"}
                            body={checkboxCellColor ? checkboxBodyTemplate : null}
                            selectionAutoFocus={false}
                            headerStyle={{
                                minWidth: "3rem",
                                width: "3rem",
                                maxWidth: "3rem",
                                padding: "0.5rem",
                                textAlign: "center",
                            }}
                            style={{
                                minWidth: "3rem",
                                width: "3rem",
                                maxWidth: "3rem",
                                padding: "0.5rem",
                                textAlign: "center",
                            }}
                            frozen={isSelectable && frozenColumns.length > 0}
                        />
                    )}

                    {/* LEFT ACTION COLUMN */}
                    {actionButton && actionButtonPosition === "left" && <Column body={actionButton} header={actionHeader || "Action"} headerStyle={{ textAlign: "center", width: `${actionButtonWidth}rem` }} frozen={isColumnFrozen("action_left")} />}

                    {/* DATA COLUMNS WITH FREEZE SUPPORT */}
                    {Array.isArray(columnsToRender) &&
                        columnsToRender?.filter(Boolean)?.map((col, i) => {
                            const isFrozen = isColumnFrozen(col?.field);
                            const frozenLeft = isFrozen ? getFrozenColumnLeft(col?.field) : undefined;

                            return (
                                <Column
                                    key={col?.field || i}
                                    field={col?.field}
                                    header={col?.header}
                                    sortable={sortable}
                                    body={col?.sortableBody}
                                    footer={col?.footer}
                                    footerClassName={col?.footerClassName}
                                    style={{
                                        ...col?.style,
                                        ...(isFrozen && {
                                            position: "sticky",
                                            left: `${frozenLeft}px`,
                                            zIndex: 2,
                                            background: "white",
                                        }),
                                    }}
                                    editor={col?.editor}
                                    onCellEditComplete={col?.onCellEditComplete}
                                    frozen={isFrozen}
                                    alignFrozen="left"
                                />
                            );
                        })}

                    {/* RIGHT ACTION COLUMN */}
                    {actionButton && actionButtonPosition === "right" && <Column body={actionButton} header={actionHeader || "Action"} headerStyle={{ textAlign: "center", width: `${actionButtonWidth}rem` }} />}

                    {/* EXTRA ACTION COLUMNS */}
                    {extraTableAction?.map((col, i) => (
                        <Column key={i} body={col.body} header={col.header} headerStyle={{ textAlign: "center" }} />
                    ))}

                    {/* ROW EDITOR COLUMN */}
                    {editMode === "row" && <Column rowEditor bodyStyle={{ textAlign: "center" }} />}
                </DataTable>

                {/* COLUMN FREEZE CONFIGURATION DIALOG */}
                {enableColumnFreeze && renderFreezeDialog()}
            </div>
        </div>
    );
};

export default ToggleTable;
