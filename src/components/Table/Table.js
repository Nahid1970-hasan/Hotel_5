import { exportToExcel } from "components/Export/exportToExcel";
import "jspdf-autotable";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { SplitButton } from "primereact/splitbutton";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CSVLink } from "react-csv";
import { useHistory } from "react-router-dom";
import * as XLSX from "xlsx";
import { CommonButton } from "../Buttons/Buttons";
import { OverlayPanel } from "primereact/overlaypanel";

/** Parse comma / semicolon / newline / tab / space lists. Dedupes so 1000+ pasted values stay fast. */
const parseSecondSearchTerms = (raw, splitOnWhitespace = false) => {
    if (raw == null) return [];
    const text = String(raw)
        .replace(/\u00a0/g, " ")
        .replace(/^\uFEFF/, "");
    if (!text.trim()) return [];

    const hasListSep = /[,;\n\r\t|]/.test(text);
    if (!hasListSep && !splitOnWhitespace) {
        const term = text
            .trim()
            .replace(/^["']+|["']+$/g, "")
            .toLowerCase();
        return term ? [term] : [];
    }

    const terms = [];
    const seen = new Set();
    for (const part of text.split(/[,;\n\r\t|]+|\s+/)) {
        const term = part.replace(/^["'\s]+|["'\s]+$/g, "").toLowerCase();
        if (!term || seen.has(term)) continue;
        seen.add(term);
        terms.push(term);
    }
    return terms;
};

const normalizeSecondSearchField = (value) =>
    String(value ?? "")
        .replace(/\u00a0/g, " ")
        .toLowerCase()
        .trim();

export const Table = ({
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
    tableId,
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
    secondSearchPlaceholder = "Size Search",
    secondSearchField = "size",
    secondSearchMulti = false,
    descriptionSearchShow = false,
    pageShow,
    sortable,
    isColor,
    actionButtonWidth = 8,
    actionButtonFrozen = false,
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
    stripedRows = true,
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
    newBtnLabel = "New",
    /** When true, shows the green "New" topbar button even if `permission.canAdd` is false (e.g. demo dashboards). */
    newBtnWithoutAddPermission = false,
    items,
    actionButtonPosition = "right",
    tableHeaderComponent,
    checkboxCellColor,
    className,
    onFilteredDataChange,
    ...rest
}) => {
    const [search, setSearch] = useState("");
    const [secondSearch, setSecondSearch] = useState("");
    const [descriptionSearch, setDescriptionSearch] = useState("");
    const [tableData, setTableData] = useState([]);
    const [csvExportData, setCSVExportData] = useState([]);

    //Start_start_Start_Show_Dynamic_Table_Columns
    const columnPanelRef = useRef(null);
    const [visibleFields, setVisibleFields] = useState(null); // null = not loaded yet

    const colPrefKey = tableId ? `tableColPref:${tableId}` : null;

    const [columnSearch, setColumnSearch] = useState("");

    const selectAllColumns = () => {
        const allFields = tableColumns?.filter((c) => c?.field).map((c) => c.field) || [];
        setVisibleFields(allFields);
        if (colPrefKey) {
            try {
                window.localStorage.setItem(colPrefKey, JSON.stringify(allFields));
            } catch (e) {}
        }
    };

    const clearAllColumns = () => {
        // Keep at least 1 column visible — kono table field-shunno thakte pare na
        const allFields = tableColumns?.filter((c) => c?.field).map((c) => c.field) || [];
        const minimal = allFields.length ? [allFields[0]] : [];
        setVisibleFields(minimal);
        if (colPrefKey) {
            try {
                window.localStorage.setItem(colPrefKey, JSON.stringify(minimal));
            } catch (e) {}
        }
    };

    // Load saved preference on mount / when column definitions change
    useEffect(() => {
        if (!colPrefKey || !Array.isArray(tableColumns)) return;
        const allFields = tableColumns.filter((c) => c?.field).map((c) => c.field);
        try {
            const saved = window.localStorage.getItem(colPrefKey);
            if (saved) {
                const savedFields = JSON.parse(saved);
                // Column definitions could've changed since last save (new/removed field) —
                // drop stale entries, keep everything else valid
                const validSaved = savedFields.filter((f) => allFields.includes(f));
                setVisibleFields(validSaved.length ? validSaved : allFields);
            } else {
                setVisibleFields(allFields);
            }
        } catch (e) {
            setVisibleFields(allFields);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colPrefKey, tableColumns]);

    const toggleColumn = (field) => {
        setVisibleFields((prev) => {
            const isLastVisible = prev?.length === 1 && prev.includes(field);
            if (isLastVisible) return prev; // at least 1 column thakte hobe
            const next = prev?.includes(field) ? prev.filter((f) => f !== field) : [...(prev || []), field];
            if (colPrefKey) {
                try {
                    window.localStorage.setItem(colPrefKey, JSON.stringify(next));
                } catch (e) {}
            }
            return next;
        });
    };

    const resetColumns = () => {
        const allFields = tableColumns?.filter((c) => c?.field).map((c) => c.field) || [];
        setVisibleFields(allFields);
        if (colPrefKey) {
            try {
                window.localStorage.setItem(colPrefKey, JSON.stringify(allFields));
            } catch (e) {}
        }
    };

    // Final columns actually rendered/exported after applying user preference
    const displayedColumns = colPrefKey && visibleFields ? tableColumns?.filter((col) => !col?.field || visibleFields.includes(col.field)) : tableColumns; //end_end

    const dt = useRef(null);

    // Table Rightside Columns Freeze
    useEffect(() => {
        const styleId = "table-frozen-column-styles";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.innerHTML = `
    .p-datatable .p-datatable-thead > tr > th.frozen-column-custom,
    .p-datatable .p-datatable-tbody > tr > td.frozen-column-custom {
        position: sticky !important;
        background: white !important;
    }
    .p-datatable-striped .p-datatable-tbody > tr:nth-child(even) > td.frozen-column-custom {
        background: #f8f9fa !important;
    }
`;
            document.head.appendChild(style);
        }
    }, []);

    const getFrozenOffset = (columns, index, side) => {
        let offset = 0;
        if (side === "left") {
            for (let j = 0; j < index; j++) {
                const c = columns[j];
                if (c?.frozen && (c?.alignFrozen || "left") === "left") {
                    offset += parseInt(c?.style?.width || c?.style?.minWidth || "150") || 150;
                }
            }
        } else {
            for (let j = index + 1; j < columns.length; j++) {
                const c = columns[j];
                if (c?.frozen && c?.alignFrozen === "right") {
                    offset += parseInt(c?.style?.width || c?.style?.minWidth || "150") || 150;
                }
            }
        }
        return offset;
    };
    //END END

    const history = useHistory();
    const date = new Date(new Date().setHours(new Date().getHours() + 6)).toISOString();
    const route = window.location.href.split("/").pop();

    // Custom checkbox body template with conditional background color
    const checkboxBodyTemplate = (rowData, options) => {
        const backgroundColor = checkboxCellColor ? (typeof checkboxCellColor === "function" ? checkboxCellColor(rowData) : checkboxCellColor[rowData.id] || checkboxCellColor.default) : "transparent";

        return (
            <div style={{ backgroundColor, padding: "0.5rem", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

    const getCheckboxHeaderStyle = () => {
        return isSelectable && allChakboox
            ? {
                  minWidth: "2rem",
                  fontWeight: "bold",
                  pointerEvents: "none",
              }
            : { minWidth: "20rem !important" };
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        if (setCustomSearch) {
            setCustomSearch(value);
        }
    };

    const applySecondSearchValue = (value) => {
        setSecondSearch(value);
        if (setSecondCustomSearch) {
            setSecondCustomSearch(value);
        }
    };

    const handleSecondSearchChange = (e) => {
        applySecondSearchValue(e.target.value);
    };

    const handleSecondSearchPaste = (e) => {
        const pasted = e.clipboardData?.getData("text");
        if (pasted == null || pasted === "") return;

        const newlineCount = (pasted.match(/\n/g) || []).length;
        const commaCount = (pasted.match(/[,;]/g) || []).length;
        const isBulkList = newlineCount > 0 || commaCount > 1;

        e.preventDefault();

        if (isBulkList) {
            applySecondSearchValue(pasted);
            return;
        }

        const target = e.target;
        const current = secondSearch || "";
        const start = typeof target.selectionStart === "number" ? target.selectionStart : current.length;
        const end = typeof target.selectionEnd === "number" ? target.selectionEnd : current.length;
        applySecondSearchValue(current.slice(0, start) + pasted + current.slice(end));
    };

    const secondSearchTerms = useMemo(() => parseSecondSearchTerms(secondSearch, secondSearchMulti), [secondSearch, secondSearchMulti]);

    const renderSecondSearchInput = () => {
        if (!secondSearchShow) return null;

        const isBulk = secondSearchTerms.length > 8;
        const title = "Paste multiple values separated by comma, space or new line. Supports 1000+ items.";

        return (
            <span className="flex items-center gap-1">
                <span className="p-input-icon-right bg-white">
                    <i className="pi pi-search bg-white" />
                    <textarea
                        value={secondSearch}
                        onChange={handleSecondSearchChange}
                        onPaste={handleSecondSearchPaste}
                        placeholder={secondSearchPlaceholder}
                        rows={isBulk ? 3 : 1}
                        spellCheck={false}
                        autoComplete="off"
                        className={`px-4 py-2 shadow bg-white text-lg resize-none leading-6 ${isBulk ? "rounded-xl min-w-[260px] max-w-[320px] max-h-24 overflow-y-auto" : `rounded-full h-10 ${secondSearchMulti ? "min-w-[220px]" : ""}`}`}
                        title={title}
                    />
                </span>
                {secondSearchTerms.length > 1 && (
                    <>
                        <span className="text-[11px] leading-none bg-blue-600 text-white rounded-full px-2 py-1 font-semibold whitespace-nowrap" title={`${secondSearchTerms.length} values`}>
                            {secondSearchTerms.length}
                        </span>
                        <button type="button" className="text-gray-400 hover:text-red-500 pi pi-times text-xs" title="Clear" onClick={() => applySecondSearchValue("")} />
                    </>
                )}
            </span>
        );
    };

    const handleDescriptionSearchChange = (e) => {
        const value = e.target.value;
        setDescriptionSearch(value);
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
                    {renderSecondSearchInput()}
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

    /**
     * Renders Excel export button with branded template
     */

    const exportToExcelFixed = () => {
        try {
            const now = new Date();

            // Format Date – DD-MM-YYYY
            const day = String(now.getDate()).padStart(2, "0");
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const year = now.getFullYear();
            const formattedDate = `${day}-${month}-${year}`;

            // Format Time – hh:mm AM/PM
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12;
            const formattedTime = `${hours}:${minutes}${ampm}`;

            // Format title (optional)
            const title = (exportFileName || route).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

            // Final filename
            const filename = `${title} - (Date: ${formattedDate}) (Time: ${formattedTime})`;

            // Filter out action columns — respects the user's Column Manager selection,
            // so exported Excel matches exactly what's visible on screen
            const exportColumns = displayedColumns.filter((col) => col.field && col.field !== "slNo" && col.field !== "action");

            // Extract column headers
            const columnHeaders = exportColumns.map((col) => {
                if (typeof col.header === "string") {
                    return col.header;
                }
                if (col.header?.props?.children) {
                    if (typeof col.header.props.children === "string") {
                        return col.header.props.children;
                    }
                }
                return col.field;
            });

            // Helper function to extract text from React elements - keeps comma format
            const extractTextFromReactElement = (element) => {
                if (element === null || element === undefined || typeof element === "boolean") return "";

                if (typeof element === "string" || typeof element === "number") {
                    return String(element);
                }

                if (Array.isArray(element)) {
                    return element
                        .map((child) => extractTextFromReactElement(child))
                        .filter((text) => text.trim() !== "")
                        .join(", ");
                }

                // Function-component elements (e.g. <NumberCell value={x} />, <TextCell value={x} />)
                // haven't actually been rendered yet — call them to get their real output
                if (React.isValidElement(element) && typeof element.type === "function") {
                    try {
                        const rendered = element.type(element.props);
                        return extractTextFromReactElement(rendered);
                    } catch (error) {
                        console.warn("Failed to render component for export:", error);
                        return "";
                    }
                }

                if (element?.props?.children !== undefined) {
                    return extractTextFromReactElement(element.props.children);
                }

                if (element?.text) {
                    return String(element.text);
                }

                return "";
            };

            // ✅ tracks which [row,col] cells hold a real date, so the number-formatting
            // step below doesn't overwrite their date format
            const dateCells = new Set();

            // Prepare data rows with formatted values
            const dataRows = tableData.map((row, rowIndex) => {
                return exportColumns.map((col, colIndex) => {
                    let value;

                    // If column has sortableBody (custom rendering), use it
                    if (col.sortableBody && typeof col.sortableBody === "function") {
                        try {
                            const renderedElement = col.sortableBody(row);
                            value = extractTextFromReactElement(renderedElement);
                        } catch (error) {
                            console.warn(`Error rendering sortableBody for field ${col.field}:`, error);
                            value = row[col.field];
                        }
                    } else {
                        // Get raw value from data
                        value = row[col.field];
                    }

                    // Handle null/undefined
                    if (value === null || value === undefined || value === "") {
                        return "";
                    }

                    // Handle date strings - ✅ FIX: return a real Date object, not text
                    if (typeof value === "string" && value.includes("T") && value.length > 10) {
                        const datePart = value.split("T")[0];
                        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const [y, m, d] = datePart.split("-").map(Number);
                            dateCells.add(`${rowIndex}:${colIndex}`);
                            return new Date(y, m - 1, d);
                        }
                    }

                    // Handle boolean
                    if (typeof value === "boolean") {
                        return value ? "Yes" : "No";
                    }

                    // If it's a number type in the original data, keep it as number
                    if (typeof value === "number") {
                        return value;
                    }

                    // If it's a string, keep it as string
                    return String(value).trim();
                });
            });

            // Validate data
            if (dataRows.length === 0) {
                alert("No data available to export.");
                return;
            }

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Create worksheet from array of arrays
            const ws = XLSX.utils.aoa_to_sheet([columnHeaders, ...dataRows]);

            // Auto-size columns (✅ FIX: treat Date cells as ~10 chars, not their long toString())
            const colWidths = columnHeaders.map((header, colIndex) => {
                const headerLen = String(header).length;
                const maxContentLen = Math.max(
                    ...dataRows.map((row) => {
                        const cell = row[colIndex];
                        if (cell instanceof Date) return 10;
                        return String(cell || "").length;
                    }),
                );
                return { wch: Math.min(Math.max(headerLen + 2, maxContentLen + 2, 12), 50) };
            });
            ws["!cols"] = colWidths;

            // Style cells
            const range = XLSX.utils.decode_range(ws["!ref"]);

            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

                    if (!ws[cellRef]) continue;

                    // Header row styling
                    if (R === 0) {
                        ws[cellRef].s = {
                            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                            fill: { fgColor: { rgb: "4472C4" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            border: {
                                top: { style: "thin", color: { rgb: "FFFFFF" } },
                                bottom: { style: "thin", color: { rgb: "FFFFFF" } },
                                left: { style: "thin", color: { rgb: "FFFFFF" } },
                                right: { style: "thin", color: { rgb: "FFFFFF" } },
                            },
                        };
                    }
                    // Data rows styling
                    else {
                        const isDateCell = dateCells.has(`${R - 1}:${C}`);
                        const cellValue = ws[cellRef].v;
                        const cellType = ws[cellRef].t;
                        const isNumber = typeof cellValue === "number";

                        // Base styling for all cells
                        ws[cellRef].s = {
                            alignment: {
                                horizontal: isNumber ? "right" : "left",
                                vertical: "center",
                            },
                            border: {
                                top: { style: "thin", color: { rgb: "D0D0D0" } },
                                bottom: { style: "thin", color: { rgb: "D0D0D0" } },
                                left: { style: "thin", color: { rgb: "D0D0D0" } },
                                right: { style: "thin", color: { rgb: "D0D0D0" } },
                            },
                        };

                        if (isDateCell) {
                            ws[cellRef].z = "dd/mm/yyyy";
                        } else if (isNumber && cellType === "n") {
                            const hasDecimals = cellValue % 1 !== 0;

                            if (hasDecimals) {
                                ws[cellRef].z = "0.00";
                            } else {
                                ws[cellRef].z = "0";
                            }
                        } else if (cellType === "s") {
                            ws[cellRef].t = "s";
                        }
                    }
                }
            }

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, "Data");

            // Write file
            XLSX.writeFile(wb, `${filename}.xlsx`);

            console.log(`Successfully exported ${dataRows.length} rows to ${filename}.xlsx`);
        } catch (error) {
            console.error("Excel export error:", error);
            alert(`Error exporting to Excel: ${error.message}\n\nCheck browser console for details.`);
        }
    };

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
                    {!newBtn && tableHeaderName ? <p className={`whitespace-nowrap ${!tableHeaderComponent && "text-2xl"}`}>{tableHeaderName}</p> : null}
                    {newBtn && (permission?.canAdd || newBtnWithoutAddPermission) ? (
                        <div>
                            <CommonButton
                                label={newBtnLabel}
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
                                icon="pi pi-download"
                                className="p-button-seccess p-button-sm"
                                onClick={() => {
                                    setShowCreateModal(true);
                                }}
                            />
                        </div>
                    )}
                    {exportBtn && <CommonButton label="Export" icon="pi pi-upload" type="button" className="p-button-help !bg-orange-400 p-button-sm" onClick={exportToExcelFixed} />}
                    {exportBtnForIADashboard && (
                        <>
                            {exportType.toLowerCase() === "csv" && (
                                <CSVLink asyncOnClick={true} data={csvExportData?.length ? csvExportData : tableData} filename={`${exportFileName || route}-D${date.split("T")[0].replace(/-/g, "")}T${date.split("T")[1].replace(/:/g, "").split(".")[0]}`}>
                                    <CommonButton label="Export to Excel" icon="pi pi-upload" type="button" className={`p-button-help !bg-orange-400  ${!splitBtn && "p-button-sm"}`} bigButton={splitBtn} />
                                </CSVLink>
                            )}

                            {exportType.toLowerCase() === "excel" && (
                                <CommonButton
                                    label="Export to Excel"
                                    icon="pi pi-upload"
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

                    {/* Column Manager button — placed next to New/Export as requested */}
                    {tableId && Array.isArray(tableColumns) && tableColumns.length > 0 && (
                        <>
                            <CommonButton label="Columns" icon="pi pi-table" type="button" className="p-button-secondary !bg-slate-600 p-button-sm" onClick={(e) => columnPanelRef.current?.toggle(e)} />
                            <OverlayPanel ref={columnPanelRef} dismissable style={{ width: "280px", padding: 0, overflow: "hidden", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb" }} className="column-manager-panel">
                                {/* Header — no close icon collision, custom close button placed inline instead */}
                                <div className="px-3.5 pt-3 pb-2.5" style={{ borderBottom: "1px solid #f0f0f0" }}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-[12px] text-gray-700 tracking-wide">MANAGE COLUMNS</span>
                                        <span className="text-[11px] text-gray-400 font-medium">
                                            {visibleFields?.length || 0} / {tableColumns.filter((c) => c?.field).length}
                                        </span>
                                    </div>

                                    {/* Search box — only useful when there are many columns */}
                                    {tableColumns.filter((c) => c?.field).length > 6 && (
                                        <div className="relative mt-2">
                                            <input
                                                type="text"
                                                value={columnSearch}
                                                onChange={(e) => setColumnSearch(e.target.value)}
                                                placeholder="Search columns"
                                                className="w-full text-[12px] px-2 py-1.5 border border-gray-200 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-shadow"
                                            />
                                        </div>
                                    )}

                                    {/* Select all / Clear all / Reset — single clean row */}
                                    <div className="flex justify-between items-center mt-2.5 text-[10]">
                                        <div className="flex gap-2.5">
                                            <button type="button" className="text-blue-600 hover:text-blue-800 font-medium transition-colors" onClick={selectAllColumns}>
                                                Select all
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button type="button" className="text-gray-500 hover:text-gray-700 font-medium transition-colors" onClick={clearAllColumns}>
                                                Clear all
                                            </button>
                                        </div>
                                        <button type="button" className="text-orange-600 hover:text-orange-800 font-medium transition-colors flex items-center gap-1" onClick={resetColumns}>
                                            <i className="pi pi-refresh" style={{ fontSize: "10px" }} />
                                            Reset
                                        </button>
                                    </div>
                                </div>

                                {/* Column list — flat, minimal: no row backgrounds, just checkbox + label */}
                                <div className="max-h-96 overflow-y-auto py-1 text-[9px]">
                                    {tableColumns
                                        ?.filter((c) => c?.field)
                                        ?.filter((c) => {
                                            if (!columnSearch.trim()) return true;
                                            const headerText = typeof c.header === "string" ? c.header : c.field;
                                            return headerText.toLowerCase().includes(columnSearch.toLowerCase());
                                        })
                                        ?.map((col, i) => {
                                            const headerText = typeof col.header === "string" ? col.header : col.field;
                                            const checked = visibleFields?.includes(col.field);
                                            return (
                                                <label key={col.field + i} className="flex items-center gap-2.5 text-[13px] cursor-pointer py-[6px] px-4">
                                                    <input type="checkbox" checked={!!checked} onChange={() => toggleColumn(col.field)} className="w-1 h-1 accent-blue-600 cursor-pointer shrink-0" />
                                                    <span className={`truncate ${checked ? "text-gray-700" : "text-gray-400"}`}>{headerText}</span>
                                                </label>
                                            );
                                        })}
                                    {tableColumns
                                        ?.filter((c) => c?.field)
                                        ?.filter((c) => {
                                            if (!columnSearch.trim()) return true;
                                            const headerText = typeof c.header === "string" ? c.header : c.field;
                                            return headerText.toLowerCase().includes(columnSearch.toLowerCase());
                                        }).length === 0 && (
                                        <div className="text-xs text-gray-400 text-center py-6 flex flex-col items-center gap-1">
                                            <i className="pi pi-search" style={{ fontSize: "16px", opacity: 0.4 }} />
                                            No matching columns
                                        </div>
                                    )}
                                </div>
                            </OverlayPanel>
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
                        {renderSecondSearchInput()}
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

    // Filter data based on search criteria
    useEffect(() => {
        if (!data || !data.length) {
            return setTableData([]);
        }

        let filteredData = [...data];

        if (search) {
            const query = search.toLowerCase().trim();
            const queryWithoutComma = query.replace(/,/g, "");
            filteredData = filteredData.filter((item) => {
                return Object.values(item).some((value) => {
                    const cell = String(value ?? "").toLowerCase();
                    if (cell.includes(query)) return true;
                    // Allow search with thousand separators (e.g. 4,341,819,979.794)
                    const cellWithoutComma = cell.replace(/,/g, "");
                    return queryWithoutComma.length > 0 && cellWithoutComma.includes(queryWithoutComma);
                });
            });
        }

        if (secondSearchTerms.length === 1) {
            const term = secondSearchTerms[0];
            filteredData = filteredData.filter((item) => {
                const fieldVal = normalizeSecondSearchField(item[secondSearchField]);
                return fieldVal.includes(term);
            });
        } else if (secondSearchTerms.length > 1) {
            // Exact match via Set so 1000+ comma-separated values stay fast
            const termSet = new Set(secondSearchTerms);
            const compactSet = new Set(secondSearchTerms.map((term) => term.replace(/\s+/g, "")));
            filteredData = filteredData.filter((item) => {
                const fieldVal = normalizeSecondSearchField(item[secondSearchField]);
                return termSet.has(fieldVal) || compactSet.has(fieldVal.replace(/\s+/g, ""));
            });
        }

        if (descriptionSearch) {
            filteredData = filteredData.filter((item) => {
                const descriptionVal = item.materialDescription?.toString().toLowerCase();
                return descriptionVal?.includes(descriptionSearch.toLowerCase().trim());
            });
        }

        setTableData(filteredData);
    }, [search, secondSearchTerms, descriptionSearch, data, secondSearchField]);

    useEffect(() => {
        onFilteredDataChange?.(tableData);
    }, [tableData, onFilteredDataChange]);

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

    // KEY FIX: Custom selection change handler that only works with filtered data
    const handleSelectionChange = (e) => {
        if (onSelectionChange) {
            return onSelectionChange(e);
        }

        setSelectedData?.(e.value);
    };

    const onSelectAllChange = (e) => {
        if (onSelectionChange) {
            return onSelectionChange({ type: "all", value: e.checked ? tableData : [], checked: e.checked });
        }
        if (e.checked) {
            setSelectedData?.(tableData);
        } else {
            setSelectedData?.([]);
        }
    };

    const isAllFilteredSelected = !!tableData?.length && !!selectedData?.length && tableData.every((row) => selectedData.includes(row)) && selectedData.length === tableData.length;

    return (
        <div className={`overflow-x-auto ${sticky && "sticky"} ${!topSelection && "hideCheckBox"}`}>
            <div className="card">
                <DataTable
                    className={`p-datatable-gridlines ${stripedRows ? "p-datatable-striped" : ""} p-datatable-sm p-datatable-customers`}
                    value={tableData}
                    headerColumnGroup={headerGroup}
                    footerColumnGroup={footerGroup}
                    paginator={pageShow === false ? false : true}
                    rows={showRow || 10}
                    dataKey={dataKey}
                    rowHover
                    selection={selectedData}
                    onSelectionChange={handleSelectionChange} // Use custom handler
                    selectAll={isAllFilteredSelected}
                    onSelectAllChange={onSelectAllChange}
                    emptyMessage={emptyMessage}
                    loading={loading}
                    header={showTableHeader ? (newBtn || !tableHeaderName || exportBtn ? leftToolbar : tableHeader) : null}
                    rowsPerPageOptions={rowsPerPageOptions ? rowsPerPageOptions : [15, 25, 50, 75]}
                    paginatorTemplate={pageShow && "CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"}
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
                    resizableColumns
                    columnResizeMode="expand"
                    showGridlines
                    stripedRows={stripedRows}
                    autoLayout={autoLayout}
                    responsiveLayout="scroll"
                    selectionMode="checkbox"
                    isDataSelectable={isRowSelectable}
                    rowClassName={rowClassName}
                    selectionAutoFocus={false}
                    editMode={editMode || "cell"}
                    {...rest}
                >
                    {isSelectable && <Column selectionMode={checkboxCellColor ? null : "multiple"} body={checkboxCellColor ? checkboxBodyTemplate : null} selectionAutoFocus={false} headerStyle={getCheckboxHeaderStyle()} ref={dt} className={className}></Column>}

                    {actionButton && actionButtonPosition === "left" && <Column body={actionButton} header={actionHeader || "Action"} headerStyle={{ textAlign: "center", width: `${actionButtonWidth}rem` }} className={className}></Column>}

                    {(() => {
                        const cols = displayedColumns?.filter(Boolean) || [];
                        const colsWithAction = actionButton && actionButtonPosition === "right" && actionButtonFrozen ? [...cols, { frozen: true, alignFrozen: "right", style: { width: `${actionButtonWidth * 16}px` } }] : cols;

                        return cols.map((col, i) => {
                            const side = col?.alignFrozen === "right" ? "right" : "left";
                            const offset = col?.frozen ? getFrozenOffset(colsWithAction, i, side) : 0;
                            const frozenStyle = col?.frozen
                                ? {
                                      position: "sticky",
                                      [side]: `${offset}px`,
                                      background: "white",
                                      zIndex: 2,
                                  }
                                : {};

                            return (
                                <Column
                                    key={col?.field || i}
                                    field={col?.field}
                                    header={col?.header}
                                    sortable={sortable}
                                    body={col?.sortableBody}
                                    footer={col?.footer}
                                    footerClassName={col?.footerClassName}
                                    style={col?.frozen ? { ...col?.style, ...frozenStyle } : col?.style}
                                    bodyStyle={col?.frozen ? { ...col?.bodyStyle, ...frozenStyle } : col?.bodyStyle}
                                    headerStyle={col?.frozen ? { ...col?.headerStyle, ...frozenStyle, zIndex: 5 } : col?.headerStyle}
                                    headerClassName={col?.headerClassName}
                                    bodyClassName={col?.bodyClassName}
                                    editor={col?.editor}
                                    onCellEditComplete={col?.onCellEditComplete}
                                    className={[className, col?.className, col?.frozen && "frozen-column-custom"].filter(Boolean).join(" ") || undefined}
                                ></Column>
                            );
                        });
                    })()}
                    {/* {actionButton && actionButtonPosition === "right" && <Column body={actionButton} header={actionHeader || "Action"} headerStyle={{ textAlign: "center", width: `${actionButtonWidth}rem` }}></Column>} */}

                    {actionButton && actionButtonPosition === "right" && (
                        <Column
                            body={actionButton}
                            header={actionHeader || "Action"}
                            headerStyle={{
                                textAlign: "center",
                                width: `${actionButtonWidth}rem`,
                                ...(actionButtonFrozen && { position: "sticky", right: "0px", background: "white", zIndex: 5 }),
                            }}
                            bodyStyle={actionButtonFrozen ? { position: "sticky", right: "0px", background: "white", zIndex: 2 } : undefined}
                            className={actionButtonFrozen ? "frozen-column-custom" : undefined}
                        ></Column>
                    )}
                    {extraTableAction?.map((col, i) => (
                        <Column key={i} body={col.body} header={col.header} headerStyle={{ textAlign: "center" }}></Column>
                    ))}
                    {editMode === "row" && <Column rowEditor bodyStyle={{ textAlign: "center" }}></Column>}
                </DataTable>
            </div>
        </div>
    );
};
