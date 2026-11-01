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
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { userInfo } from "service/login";

/**
 * Reusable Table Component with advanced features
 *
 * Features:
 * - Selectable rows with custom checkbox styling
 * - Multiple search filters (main, size, description)
 * - Export functionality (CSV/Excel/PDF) with branded templates
 * - Action buttons (New, Delete, Import, Export, etc.)
 * - Automatic pagination/scrollable mode based on data count
 * - Column freezing with user-specific preferences
 * - Sorting for all columns with visual indicators
 * - Sticky header and footer for better UX
 *
 * @param {Object} props - Component props
 */

const { EmpID } = userInfo();

export const DynamicTable = ({
    // Selection props
    isSelectable = true,
    allChakboox = false,
    selectedData,
    setSelectedData,
    onSelectionChange,
    isRowSelectable,
    topSelection = true,
    checkboxCellColor,

    // Search props
    setCustomSearch,
    setSecondCustomSearch,
    searchShow = true,
    secondSearchShow = false,
    descriptionSearchShow = false,
    customSearch,

    // Data props
    data,
    setData,
    dataKey,
    plainData,
    loading = true,
    emptyMessage = "",

    // Table configuration
    rows = 25,
    showRow = 10,
    rowsPerPageOptions,
    pageShow,
    sortable = true, // Enable sorting by default
    autoLayout = true,
    editMode,
    rowClassName,
    sticky,

    // Pagination threshold
    paginationThreshold = 200, // Auto-enable pagination above 200 rows

    // Sticky header and footer props
    stickyHeader = true,
    stickyFooter = false,
    scrollHeight = "370px",

    // Column freezing props
    enableColumnFreeze = true,
    userId = EmpID, // User ID for storing freeze preferences
    tableId, // Unique table identifier

    // Export branding props

    companyLogo = "/path/to/logo.png",
    companyName = "Dekko Isho Group",
    companyAddress = "The Forum, West Tower, Level: 16-19, 187, 188/B, Bir Uttam Shawkat Sarak, Tejgaon, Bangladesh",
    companyContact = "Tel: 09606-101010",

    // Header/Footer
    tableHeaderName = "",
    isTopbarShow = true,
    showTableHeader = true,
    headerGroup,
    footerGroup,
    tableHeaderComponent,

    combinedHeader = false,

    // Columns
    tableColumns,
    extraTableAction,

    // Action buttons
    actionButton,
    actionHeader,
    actionButtonWidth = 8,
    actionButtonPosition = "right",

    // Button visibility and routing
    newBtn = false,
    newBtnRoute,
    newBtnFunc,
    deleteBtn = false,
    importBtn,
    exportBtn,
    exportBtnForIADashboard,
    pdfBtn,
    backBtn,
    customBtn,

    // Split button
    splitBtn,
    splitBtnLabel,
    splitBtnOnClick,
    splitBtnItems,
    splitBtnIcon,

    // Modal controls
    showCreateModal = false,
    setShowCreateModal,
    showDeleteModal = false,
    setShowDeleteModal,

    // Export configuration
    exportFileName,
    exportData,
    exportType = "excel",
    exportFunc,

    // Permissions
    permission,

    // Notifies the parent whenever the currently visible/filtered rows change
    // (e.g. after the user types in the search box). Parents that render their
    // own footer totals should use this data instead of the raw `data` prop so
    // totals stay in sync with what the user is actually searching/looking at.
    onFilteredDataChange,

    // Legacy/Unused props
    newMlcRoute,
    newScRoute,
    newSMScRoute,
    lcBtn,
    newActionButton,
    items,
    firstButtonLabel,
    firstButtonRoute,
    secondButtonLabel,
    secondButtonRoute,
    thirdButtonLabel,
    thirdButtonRoute,
    deleteSelected,
    importExportBtn,
    dialog,
    multiItem = true,
    isColor,
    body,
    inputFiled,
    extraFieldType,

    // Rest props for DataTable
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
    const [showFreezeDialog, setShowFreezeDialog] = useState(false);
    const [frozenColumns, setFrozenColumns] = useState([]);
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);

    // ============================================
    // REFS AND HOOKS
    // ============================================

    const dt = useRef(null);
    const history = useHistory();

    // Generate timestamp for export filenames
    const date = new Date(new Date().setHours(new Date().getHours() + 6)).toISOString();
    const route = window.location.href.split("/").pop();

    // Storage key for frozen columns
    const freezeStorageKey = `table_freeze_${tableId}_${userId}`;

    // ============================================
    // DETERMINE PAGINATION VS SCROLLABLE MODE
    // ============================================

    /**
     * Determine if pagination should be enabled based on data count
     */
    const shouldUsePagination = () => {
        if (pageShow === false) return false;
        return tableData.length > paginationThreshold;
    };

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
                setFrozenColumns(JSON.parse(savedFrozenColumns));
            }
        }
    }, [enableColumnFreeze, userId, tableId, freezeStorageKey]);

    /**
     * Save frozen columns to localStorage whenever they change
     */
    useEffect(() => {
        if (enableColumnFreeze && userId && tableId && frozenColumns.length >= 0) {
            localStorage.setItem(freezeStorageKey, JSON.stringify(frozenColumns));
        }
    }, [frozenColumns, enableColumnFreeze, userId, tableId, freezeStorageKey]);

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
    /**
     * Calculate the left position for frozen columns
     * Now considers both column definition frozen AND user preference frozen
     */
    const getFrozenColumnLeft = (field) => {
        let leftPosition = 0;

        // Add checkbox column width if selectable
        if (isSelectable) {
            leftPosition += 50;
        }

        // Add left action column width if present
        if (actionButton && actionButtonPosition === "left") {
            leftPosition += actionButtonWidth * 16;
        }

        // Get all frozen columns (from definition OR user preference)
        const allFrozenColumns = tableColumns.filter((col) => col?.frozen === true || frozenColumns.includes(col?.field)).map((col) => col?.field);

        const index = allFrozenColumns.indexOf(field);
        if (index === -1) return 0;

        // Calculate cumulative width of previous frozen columns
        for (let i = 0; i < index; i++) {
            const prevField = allFrozenColumns[i];
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
    // SORTING FUNCTIONALITY
    // ============================================

    /**
     * Handle custom sorting
     */
    const onSort = (e) => {
        const { sortField: field, sortOrder: order } = e;

        setSortField(field);
        setSortOrder(order);

        // If no sort field or order, reset to original filtered data
        if (!field || !order) {
            // Re-apply filters without sorting
            let filteredData = [...data];

            // Apply main search filter (deep/JSON search so nested fields match too)
            if (search) {
                const term = search.toLowerCase();
                filteredData = filteredData.filter((item) => JSON.stringify(item).toLowerCase().includes(term));
            }

            if (secondSearch) {
                filteredData = filteredData.filter((item) => {
                    const sizeVal = item.size?.toString().toLowerCase();
                    return sizeVal?.includes(secondSearch.toLowerCase());
                });
            }

            if (descriptionSearch) {
                filteredData = filteredData.filter((item) => {
                    const descriptionVal = item.materialDescription?.toString().toLowerCase();
                    return descriptionVal?.includes(descriptionSearch.toLowerCase());
                });
            }

            setTableData(filteredData);
            onFilteredDataChange?.(filteredData);
            return;
        }

        // Apply sorting to current tableData
        const sortedData = [...tableData].sort((a, b) => {
            const aValue = a[field];
            const bValue = b[field];

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Convert to string for comparison if needed
            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();

            // Try numeric comparison first
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);

            if (!isNaN(aNum) && !isNaN(bNum)) {
                // Numeric comparison
                return order * (aNum - bNum);
            } else {
                // String comparison
                if (aStr < bStr) return -1 * order;
                if (aStr > bStr) return 1 * order;
                return 0;
            }
        });

        setTableData(sortedData);
        onFilteredDataChange?.(sortedData);
    };

    // ============================================
    // CHECKBOX RENDERING
    // ============================================

    /**
     * Custom checkbox template with conditional background color
     * Used when checkboxCellColor prop is provided
     */
    const checkboxBodyTemplate = (rowData, options) => {
        const backgroundColor = checkboxCellColor ? (typeof checkboxCellColor === "function" ? checkboxCellColor(rowData) : checkboxCellColor[rowData.id] || checkboxCellColor.default) : "transparent";

        return (
            <div
                style={{
                    backgroundColor,
                    padding: "0.5rem",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                    style={{ margin: 0 }}
                />
            </div>
        );
    };

    /**
     * Returns dynamic styles for checkbox header column
     */
    const getCheckboxHeaderStyle = () => {
        return isSelectable && allChakboox
            ? {
                  minWidth: "2rem",
                  fontWeight: "bold",
                  pointerEvents: "none",
              }
            : { minWidth: "20rem !important" };
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
        if (setCustomSearch) {
            setCustomSearch(value);
        }
    };

    /**
     * Secondary search input handler (for size)
     */
    const handleSecondSearchChange = (e) => {
        const value = e.target.value;
        setSecondSearch(value);
        if (setSecondCustomSearch) {
            setSecondCustomSearch(value);
        }
    };

    /**
     * Description search input handler
     */
    const handleDescriptionSearchChange = (e) => {
        const value = e.target.value;
        setDescriptionSearch(value);
    };

    // ============================================
    // BRANDED EXPORT FUNCTIONALITY
    // ============================================

    /**
     * Export visible data to branded Excel with company header
     */
    const exportToBrandedExcel = () => {
        try {
            const exportTimestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
            const filename = `${exportFileName || route}_${exportTimestamp}`;

            // Prepare header rows
            const headerRows = [
                [companyName],
                [companyAddress],
                [companyContact],
                [], // Empty row for spacing
                ["Export Date:", new Date().toLocaleDateString()],
                ["Total Records:", tableData.length],
                [], // Empty row before data
            ];

            // Prepare column headers
            // const columnHeaders = tableColumns.filter(Boolean).map((col) => col.header);
            const exportColumns = tableColumns.filter((col) => col.field !== "slNo");
            const columnHeaders = exportColumns.filter(Boolean).map((col) => col.header);

            const toExportDate = (value) => {
                const date = value instanceof Date ? value : new Date(value);
                if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1900) return null;
                return new Date(date.getFullYear(), date.getMonth(), date.getDate());
            };

            const dateCells = new Set();

            // Prepare data rows with proper value handling
            const dataRows = tableData.map((row, rowIndex) => {
                return exportColumns.filter(Boolean).map((col, colIndex) => {
                    const value = row[col.field];
                    if (col.dateExport) {
                        const dateOnly = toExportDate(value);
                        if (!dateOnly) return "";
                        dateCells.add(`${rowIndex}:${colIndex}`);
                        return dateOnly;
                    }
                    if (value === null || value === undefined || value === "") {
                        const isNumberColumn = tableData.some((r) => {
                            const v = r[col.field];
                            return v !== null && v !== undefined && v !== "" && !isNaN(parseFloat(v)) && !(v instanceof Date);
                        });
                        return isNumberColumn ? 0 : "";
                    }
                    return value;
                });
            });

            // Combine all rows
            const wsData = [...headerRows, columnHeaders, ...dataRows];

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Set column widths
            const colWidths = tableColumns.map(() => ({ wch: 15 }));
            ws["!cols"] = colWidths;

            const dataStartRow = headerRows.length + 1;
            dateCells.forEach((key) => {
                const [rowIndex, colIndex] = key.split(":").map(Number);
                const cellRef = XLSX.utils.encode_cell({ r: dataStartRow + rowIndex, c: colIndex });
                if (ws[cellRef]) ws[cellRef].z = "dd/mm/yyyy";
            });

            // Merge cells for company info
            ws["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: columnHeaders.length - 1 } }, // Company name
                { s: { r: 1, c: 0 }, e: { r: 1, c: columnHeaders.length - 1 } }, // Address
                { s: { r: 2, c: 0 }, e: { r: 2, c: columnHeaders.length - 1 } }, // Contact
            ];

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, "Export Data");

            // Save file
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } catch (error) {
            console.error("Excel export error:", error);
        }
    };

    /**
     * Export visible data to branded PDF with company header
     */
    const exportToBrandedPdf = () => {
        try {
            const doc = new jsPDF("l", "mm", "a4"); // Landscape orientation
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Add company logo if provided
            if (companyLogo) {
                try {
                    doc.addImage(companyLogo, "PNG", 14, 10, 25, 25);
                } catch (err) {
                    console.warn("Logo could not be added:", err);
                }
            }

            // Add company name (center top)
            doc.setFontSize(20);
            doc.setFont(undefined, "bold");
            doc.text(companyName, pageWidth / 2, 20, { align: "center" });

            // Add address
            doc.setFontSize(10);
            doc.setFont(undefined, "normal");
            doc.text(companyAddress, pageWidth / 2, 27, { align: "center" });

            // Add contact
            doc.setFontSize(9);
            doc.text(companyContact, pageWidth / 2, 33, { align: "center" });

            // Add a line separator
            doc.setLineWidth(0.5);
            doc.line(14, 38, pageWidth - 14, 38);

            // Add export info
            doc.setFontSize(9);
            doc.setFont(undefined, "normal");
            doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 44);
            doc.text(`Total Records: ${tableData.length}`, pageWidth - 14, 44, { align: "right" });

            // Prepare table data with proper value handling
            // const headers = tableColumns.filter(Boolean).map((col) => col.header);
            const exportColumns = tableColumns.filter((col) => col.field !== "slNo");
            const headers = exportColumns.filter(Boolean).map((col) => col.header);

            const rows = tableData.map((row) => {
                return exportColumns.filter(Boolean).map((col) => {
                    const value = row[col.field];
                    if (value === null || value === undefined || value === "") {
                        const isNumberColumn = tableData.some((r) => {
                            const v = r[col.field];
                            return v !== null && v !== undefined && v !== "" && !isNaN(parseFloat(v));
                        });
                        return isNumberColumn ? "0" : "";
                    }
                    return String(value);
                });
            });

            // Calculate optimal font size based on number of columns
            const numColumns = headers.length;
            let fontSize = 8;
            let headerFontSize = 9;

            if (numColumns > 15) {
                fontSize = 6;
                headerFontSize = 7;
            } else if (numColumns > 10) {
                fontSize = 7;
                headerFontSize = 8;
            }

            // Add table with improved styling
            doc.autoTable({
                head: [headers],
                body: rows,
                startY: 50,
                theme: "striped",
                styles: {
                    fontSize: fontSize,
                    cellPadding: 2,
                    overflow: "linebreak",
                    halign: "center",
                    valign: "middle",
                },
                headStyles: {
                    fillColor: [41, 128, 185], // Professional blue
                    textColor: [255, 255, 255], // White text
                    fontStyle: "bold",
                    fontSize: headerFontSize,
                    halign: "center",
                    valign: "middle",
                    lineWidth: 0.1,
                    lineColor: [255, 255, 255],
                },
                bodyStyles: {
                    textColor: [50, 50, 50],
                    lineWidth: 0.1,
                    lineColor: [200, 200, 200],
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250], // Light blue-gray
                },
                columnStyles: {
                    // Auto-detect number columns and align right
                    ...tableColumns.reduce((acc, col, index) => {
                        const isNumberColumn = tableData.some((r) => {
                            const v = r[col.field];
                            return v !== null && v !== undefined && v !== "" && !isNaN(parseFloat(v));
                        });
                        if (isNumberColumn) {
                            acc[index] = { halign: "right" };
                        }
                        return acc;
                    }, {}),
                },
                margin: { top: 50, left: 14, right: 14 },
                tableWidth: "auto",
                didDrawPage: function (data) {
                    // Footer with page numbers
                    doc.setFontSize(8);
                    doc.setTextColor(128);
                    const pageCount = doc.internal.getNumberOfPages();
                    const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
                    doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });

                    // Footer text
                    doc.text(`This is system generated report`, 14, pageHeight - 10);
                },
            });

            // Save PDF
            const exportTimestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
            doc.save(`${exportFileName || route}_${exportTimestamp}.pdf`);
        } catch (error) {
            console.error("PDF export error:", error);
        }
    };

    /**
     * Legacy PDF export (kept for backward compatibility)
     */
    const exportPdf = () => {
        exportToBrandedPdf();
    };

    /**
     * Legacy save function (appears unused)
     */
    const save = () => {
        // history.push(newMlcRoute);
    };

    // ============================================
    // RENDER SEARCH INPUTS
    // ============================================

    /**
     * Renders search input fields
     */
    const renderSearchInputs = () => (
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
    );

    // ============================================
    // TABLE HEADER (Simple header with search)
    // ============================================

    const tableHeader = (
        <div className={`${(searchShow || descriptionSearchShow || secondSearchShow) && "table-header"} font-bold grid grid-cols-1 md:grid-cols-2 items-center`}>
            <p className={`lg:justify-self-start md:justify-self-start justify-self-center ${!tableHeaderComponent && "text-2xl"}`}>{tableHeaderName}</p>
            {(secondSearchShow || descriptionSearchShow || searchShow) && renderSearchInputs()}
        </div>
    );

    // ============================================
    // EXPORT BUTTON RENDERING
    // ============================================

    /**
     * Renders CSV export button (uses visible data)
     */
    const renderCSVExport = (isIADashboard = false) => (
        <CSVLink asyncOnClick={true} data={csvExportData?.length ? csvExportData : tableData} filename={`${exportFileName || route}-D${date.split("T")[0].replace(/-/g, "")}T${date.split("T")[1].replace(/:/g, "").split(".")[0]}`}>
            <CommonButton label={isIADashboard ? "Export to Excel" : "Export"} icon="pi pi-upload" type="button" className={`p-button-help !bg-orange-400 ${!splitBtn && "p-button-sm"}`} bigButton={splitBtn} />
        </CSVLink>
    );

    /**
     * Renders Excel export button with branded template
     */
    const renderExcelExport = (isIADashboard = false) => <CommonButton label={isIADashboard ? "Export to Excel" : "Export"} icon="pi pi-upload" type="button" className={`p-button-help !bg-orange-400 ${!splitBtn && "p-button-sm"}`} bigButton={splitBtn} onClick={exportToBrandedExcel} />;

    // ============================================
    // COLUMN FREEZE DIALOG
    // ============================================

    /**
     * Render column freeze configuration dialog
     */
    const renderFreezeDialog = () => (
        <Dialog header="Freeze Columns" visible={showFreezeDialog} style={{ width: "450px" }} onHide={() => setShowFreezeDialog(false)} modal>
            <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-600 mb-2">Select columns to freeze. Frozen columns will remain visible while scrolling horizontally.</p>

                <div className="max-h-96 overflow-y-auto">
                    {tableColumns?.filter(Boolean).map((col, index) => {
                        const isPreFrozen = col?.frozen === true;
                        const isUserFrozen = isColumnFrozen(col.field);

                        return (
                            <div key={index} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                <Checkbox inputId={`freeze-${col.field}`} checked={isPreFrozen || isUserFrozen} onChange={() => !isPreFrozen && toggleColumnFreeze(col.field)} disabled={isPreFrozen} />
                                <label htmlFor={`freeze-${col.field}`} className="cursor-pointer flex-1">
                                    {col.header}
                                </label>
                                {isPreFrozen && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Always Frozen</span>}
                                {!isPreFrozen && isUserFrozen && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Frozen</span>}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                    <span className="text-sm text-gray-600">{frozenColumns.length} column(s) selected</span>
                    <div className="flex gap-2">
                        <Button label="Clear All" icon="pi pi-times" className="p-button-text p-button-danger" onClick={() => setFrozenColumns([])} disabled={frozenColumns.length === 0} />
                        <Button label="Done" icon="pi pi-check" onClick={() => setShowFreezeDialog(false)} />
                    </div>
                </div>
            </div>
        </Dialog>
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
                    {newActionButton && permission?.canAdd && <SplitButton className="p-button-success p-button-sm" label="New" icon="" onClick={save} model={items} />}

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
                    {pdfBtn && <CommonButton type="button" icon="pi pi-file-pdf" label="Export PDF" severity="warning" className="p-button-sm" onClick={exportToBrandedPdf} tooltip="Export to PDF with company branding" />}

                    {/* CUSTOM BUTTONS */}
                    {customBtn?.map(({ label, icon, className, onClick, loading, disabled }, index) => (
                        <CommonButton key={index} label={label} icon={icon} className={className} onClick={onClick} loading={loading} disabled={loading || disabled} />
                    ))}

                    {/* BACK BUTTON */}
                    {backBtn && <CommonButton onClick={() => history.goBack()} className="p-mr-2 p-button-raised bg-gray-200 shadow-none text-gray-600 p-button-sm" title="Back" type="reset" disabled={false} label="Back" icon="pi pi-arrow-left" color="p-button-raised p-button-success" />}
                </div>

                {/* SEARCH INPUTS */}
                {(secondSearchShow || descriptionSearchShow || searchShow) && renderSearchInputs()}
            </div>
        </React.Fragment>
    );

    // ============================================
    // EFFECTS
    // ============================================

    /**
     * Filter data based on search criteria
     * Runs whenever search terms or data changes
     */
    useEffect(() => {
        if (!data || !data.length) {
            setTableData([]);
            onFilteredDataChange?.([]);
            return;
        }

        let filteredData = [...data];

        // Apply main search filter (deep/JSON search so nested fields, like
        // { sizeId, sizeName } objects, are matched too — not just top-level values)
        if (search) {
            const term = search.toLowerCase();
            filteredData = filteredData.filter((item) => JSON.stringify(item).toLowerCase().includes(term));
        }

        // Apply size search filter
        if (secondSearch) {
            filteredData = filteredData.filter((item) => {
                const sizeVal = item.size?.toString().toLowerCase();
                return sizeVal?.includes(secondSearch.toLowerCase());
            });
        }

        // Apply description search filter
        if (descriptionSearch) {
            filteredData = filteredData.filter((item) => {
                const descriptionVal = item.materialDescription?.toString().toLowerCase();
                return descriptionVal?.includes(descriptionSearch.toLowerCase());
            });
        }

        setTableData(filteredData);
        onFilteredDataChange?.(filteredData);

        // Reset sorting when data changes
        setSortField(null);
        setSortOrder(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, secondSearch, descriptionSearch, data]);

    /**
     * Prepare CSV export data by removing metadata fields
     * Removes: createdBy, createdDate, and any fields containing "ID"
     */
    useEffect(() => {
        const updatedArray = tableData?.length
            ? tableData.map((obj) => {
                  const { createdBy, createdDate, ...rest } = obj;
                  // Remove fields containing "ID"
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

    /**
     * Apply custom styles for sticky header and footer
     * This effect adds the necessary CSS for sticky behavior
     */
    useEffect(() => {
        // Add global styles for sticky header and footer
        const styleId = "sticky-table-styles";

        // Check if style already exists
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.innerHTML = `
    /* ==================== STICKY HEADER STYLES ==================== */
    .p-datatable-sticky-header .p-datatable-thead {
        position: sticky !important;
        top: 0 !important;
        z-index: 10 !important;
        background: white !important;
    }
    
    .p-datatable-sticky-header .p-datatable-thead > tr > th {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    /* ==================== STICKY FOOTER STYLES ==================== */
    .p-datatable-sticky-footer .p-datatable-tfoot {
        position: sticky !important;
        bottom: 0 !important;
        z-index: 10 !important;
        background: white !important;
        box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
    }
    
    /* ==================== SCROLLING BEHAVIOR ==================== */
    .p-datatable-scrollable .p-datatable-wrapper {
        overflow-y: auto !important;
    }
    
    /* ==================== SORTING INDICATOR STYLES ==================== */
    .p-sortable-column .p-sortable-column-icon {
        margin-left: 0.5rem;
    }
    
    .p-sortable-column:hover {
        background-color: #f8f9fa;
        cursor: pointer;
    }
    
    .p-highlight .p-sortable-column-icon {
        color: #2196F3;
    }
    
    /* ==================== FROZEN COLUMN - HEADER & BODY ==================== */
    .p-datatable .p-datatable-thead > tr > th.p-frozen-column,
    .p-datatable .p-datatable-tbody > tr > td.p-frozen-column {
        background: white !important;
        background-color: white !important;
        opacity: 1 !important;
        z-index: 2 !important;
        position: sticky !important;
    }
    
    .p-datatable-scrollable .p-datatable-thead > tr > th.p-frozen-column {
        position: sticky !important;
        z-index: 11 !important;
        background: white !important;
    }
    
    .p-datatable .p-datatable-thead > tr > th.p-frozen-column {
        position: sticky !important;
        z-index: 11 !important;
        box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
    }
    
    /* ==================== FROZEN COLUMN - FOOTER (FIXED Z-INDEX!) ==================== */
    /* Basic frozen column styles for footer - HIGHER Z-INDEX */
    .p-datatable .p-datatable-tfoot > tr > td.p-frozen-column {
        background: white !important;
        background-color: white !important;
        opacity: 1 !important;
        z-index: 12 !important;
        position: sticky !important;
        border-right: 2px solid #dee2e6 !important;
        box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1) !important;
    }
    
    /* Force frozen footer cells to stick in scrollable table */
    .p-datatable-scrollable .p-datatable-tfoot > tr > td.p-frozen-column {
        position: sticky !important;
        z-index: 13 !important;
        background: white !important;
    }
    
    /* Ensure sticky footer + frozen column combination works */
    .p-datatable-sticky-footer .p-datatable-tfoot > tr > td.p-frozen-column {
        z-index: 25 !important;
        background: white !important;
        position: sticky !important;
    }
    
    /* Footer frozen column in scrollable footer table */
    .p-datatable-scrollable-footer-table .p-frozen-column {
        position: sticky !important;
        z-index: 13 !important;
    }
    
    /* Make sure non-frozen footer cells have lower z-index */
    .p-datatable .p-datatable-tfoot > tr > td:not(.p-frozen-column) {
        z-index: 1 !important;
        position: relative;
    }
    
    /* ==================== STRIPED ROWS BACKGROUND ==================== */
    .p-datatable-striped .p-datatable-tbody > tr:nth-child(even) > td.p-frozen-column {
        background: #f8f9fa !important;
        background-color: #f8f9fa !important;
    }
    
    .p-datatable-striped .p-datatable-tbody > tr:nth-child(odd) > td.p-frozen-column {
        background: white !important;
        background-color: white !important;
    }
    
    /* ==================== FROZEN COLUMN BORDERS ==================== */
    .p-datatable .p-frozen-column {
        border-right: 2px solid #dee2e6 !important;
    }
    
    /* ==================== HOVER EFFECTS ==================== */
    .p-datatable-hoverable-rows .p-datatable-tbody > tr:hover > td.p-frozen-column {
        background: #e9ecef !important;
    }
    
    /* ==================== STICKY HEADER + FROZEN COLUMN ==================== */
    .p-datatable-sticky-header .p-datatable-thead > tr > th.p-frozen-column {
        z-index: 50 !important;
        background: white !important;
        position: sticky !important;
    }
    
    /* ==================== SCROLLABLE TABLE FROZEN COLUMNS ==================== */
    .p-datatable-scrollable-body-table .p-frozen-column {
        position: sticky !important;
    }
    
    .p-datatable-scrollable-header-table .p-frozen-column {
        position: sticky !important;
    }
`;
            document.head.appendChild(style);
        }

        // Cleanup function to remove styles when component unmounts
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
     * Ensures "select all" only selects filtered/visible data
     */
    const handleSelectionChange = (e) => {
        // Use custom handler if provided
        if (onSelectionChange) {
            return onSelectionChange(e);
        }

        // Handle "select all" event
        if (e.type === "all") {
            if (e.value.length === 0) {
                // Deselect all
                return setSelectedData([]);
            }
            // Select only the currently filtered/visible data
            return setSelectedData?.(tableData);
        }

        // Handle individual row selection
        setSelectedData?.(e.value);
    };

    // ============================================
    // DYNAMIC CLASS NAMES FOR STICKY FEATURES
    // ============================================

    /**
     * Generate dynamic class names based on sticky header/footer configuration
     */
    const getStickyClassNames = () => {
        let classNames = "p-datatable-gridlines p-datatable-striped p-datatable-sm p-datatable-customers";

        if (stickyHeader) {
            classNames += " p-datatable-sticky-header";
        }

        if (stickyFooter && footerGroup) {
            classNames += " p-datatable-sticky-footer";
        }

        return classNames;
    };

    // ============================================
    // RENDER
    // ============================================

    const isPaginationEnabled = shouldUsePagination();

    // ============================================
    // HEADER LOGIC - Updated with combinedHeader option
    // ============================================
    // ============================================
    // COMBINED HEADER (Title + Search + Buttons)
    // ============================================

    const combinedHeaderComponent = (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Left side - Table title */}
            {/* TITLE & Action buttons */}
            <div className="flex gap-2 flex-wrap">
                {tableHeaderName && <h2 className="text-2xl font-bold text-gray-800">{tableHeaderName}</h2>}

                <div className="flex gap-2 flex-wrap pl-4">
                    {/* NEW BUTTON */}
                    {newBtn && permission?.canAdd && (
                        <CommonButton
                            label="New"
                            icon="pi pi-plus"
                            className="p-button-success p-button-sm"
                            type="button"
                            onClick={() => {
                                if (newBtnRoute) return history.push(newBtnRoute);
                                if (newBtnFunc) return newBtnFunc();
                                setShowCreateModal && setShowCreateModal(true);
                            }}
                        />
                    )}

                    {/* DELETE BUTTON */}
                    {deleteBtn && permission?.canDelete && <CommonButton label="Delete" icon="pi pi-trash" className="p-button-danger p-button-sm" onClick={() => setShowDeleteModal && setShowDeleteModal(true)} disabled={!selectedData || !selectedData.length} />}

                    {/* COLUMN FREEZE BUTTON */}
                    {enableColumnFreeze && userId && tableId && <CommonButton label="Freeze Columns" icon="pi pi-lock" className="p-button-info p-button-sm" onClick={() => setShowFreezeDialog(true)} tooltip="Configure frozen columns" />}

                    {/* EXPORT BUTTONS */}
                    {exportBtn && (
                        <>
                            {exportType.toLowerCase() === "csv" && renderCSVExport(false)}
                            {exportType.toLowerCase() === "excel" && renderExcelExport(false)}
                        </>
                    )}

                    {/* PDF EXPORT BUTTON */}
                    {pdfBtn && <CommonButton type="button" icon="pi pi-file-pdf" label="Export PDF" severity="warning" className="p-button-sm" onClick={exportToBrandedPdf} tooltip="Export to PDF with company branding" />}

                    {/* CUSTOM BUTTONS */}
                    {customBtn?.map(({ label, icon, className, onClick, loading, disabled }, index) => (
                        <CommonButton key={index} label={label} icon={icon} className={className} onClick={onClick} loading={loading} disabled={loading || disabled} />
                    ))}

                    {/* BACK BUTTON */}
                    {backBtn && <CommonButton onClick={() => history.goBack()} className="p-button-raised bg-gray-200 shadow-none text-gray-600 p-button-sm" title="Back" type="reset" disabled={false} label="Back" icon="pi pi-arrow-left" />}
                </div>
            </div>

            {/* Right side - Search inputs and buttons */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                {/* Search inputs */}
                {(secondSearchShow || descriptionSearchShow || searchShow) && <div className="flex gap-2 flex-wrap">{renderSearchInputs()}</div>}
            </div>
        </div>
    );

    const getHeaderContent = () => {
        if (!showTableHeader) return null;

        if (tableHeaderComponent) {
            return tableHeaderComponent;
        }

        if (combinedHeader) {
            return combinedHeaderComponent;
        }

        if (newBtn || !tableHeaderName) {
            return leftToolbar;
        } else {
            return tableHeader;
        }
    };

    const hasFrozenColumns = (Array.isArray(tableColumns) && tableColumns.some((col) => col?.frozen === true)) || frozenColumns.length > 0;

    return (
        <div className={`overflow-x-auto ${sticky && "sticky"} ${!topSelection && "hideCheckBox"}`}>
            <div className="card">
                <DataTable
                    ref={dt}
                    className={getStickyClassNames()}
                    value={tableData}
                    headerColumnGroup={headerGroup}
                    footerColumnGroup={footerGroup}
                    // Pagination configuration based on data count
                    paginator={isPaginationEnabled}
                    rows={showRow || 10}
                    dataKey={dataKey}
                    rowHover
                    selection={selectedData}
                    onSelectionChange={handleSelectionChange}
                    emptyMessage={emptyMessage}
                    loading={loading}
                    // header={showTableHeader ? (newBtn || !tableHeaderName ? leftToolbar : tableHeader) : null}
                    header={getHeaderContent()}
                    rowsPerPageOptions={rowsPerPageOptions || [15, 25, 50, 75, 100]}
                    paginatorTemplate={isPaginationEnabled && "CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"}
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
                    // Column resizing
                    resizableColumns
                    columnResizeMode="expand"
                    // Visual enhancements
                    showGridlines
                    stripedRows
                    autoLayout={autoLayout}
                    responsiveLayout="scroll"
                    // Selection configuration
                    selectionMode="checkbox"
                    isDataSelectable={isRowSelectable}
                    rowClassName={rowClassName}
                    selectionAutoFocus={false}
                    // Edit mode
                    editMode={editMode || "cell"}
                    // Scrollable mode when pagination is disabled
                    scrollable={!isPaginationEnabled || stickyHeader || stickyFooter}
                    scrollHeight={!isPaginationEnabled || stickyHeader || stickyFooter ? scrollHeight : undefined}
                    // Sorting configuration - Controlled sorting
                    sortMode="single"
                    removableSort
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={onSort}
                    {...rest}
                >
                    {/* CHECKBOX COLUMN */}
                    {isSelectable && (
                        <Column
                            selectionMode={checkboxCellColor ? null : "multiple"}
                            body={checkboxCellColor ? checkboxBodyTemplate : null}
                            selectionAutoFocus={false}
                            headerStyle={getCheckboxHeaderStyle()}
                            frozen={isSelectable && hasFrozenColumns}
                            alignFrozen="left"
                            className={isSelectable && hasFrozenColumns ? "frozen-column-custom" : ""}
                        />
                    )}

                    {/* LEFT ACTION COLUMN */}
                    {actionButton && actionButtonPosition === "left" && <Column body={actionButton} header={actionHeader || "Action"} headerStyle={{ textAlign: "center", width: `${actionButtonWidth}rem` }} frozen={isColumnFrozen("action_left")} />}

                    {/* DATA COLUMNS */}
                    {Array.isArray(tableColumns) &&
                        tableColumns.filter(Boolean).map((col, i) => {
                            // Check if column is frozen from column definition OR from user preference
                            const isFrozen = col?.frozen === true || isColumnFrozen(col?.field);
                            const frozenLeft = isFrozen ? getFrozenColumnLeft(col?.field) : undefined;

                            const isColumnSortable = col?.sortable !== false && sortable;

                            return (
                                <Column
                                    key={i}
                                    field={col?.field}
                                    header={col?.header}
                                    sortable={isColumnSortable}
                                    body={col?.sortableBody}
                                    footer={col?.footer}
                                    footerClassName={col?.footerClassName}
                                    headerStyle={{
                                        ...col?.headerStyle,
                                        ...col?.style,
                                    }}
                                    bodyStyle={{
                                        ...col?.style,
                                    }}
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
                                    className={isFrozen ? "frozen-column-custom" : ""}
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

                {/* Column Freeze Configuration Dialog */}
                {enableColumnFreeze && renderFreezeDialog()}
            </div>
        </div>
    );
};
