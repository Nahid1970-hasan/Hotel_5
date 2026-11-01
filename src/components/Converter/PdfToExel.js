import React, { useState, useRef } from "react";
import axios from "axios";
import { CommonButton } from "components/Buttons/Buttons";

export default function PdfToExcel() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [excelLink, setExcelLink] = useState(null);
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const resetFileState = () => {
        setExcelLink(null);
        setFileName("");
        setError(null);
        setProgress(0);
    };

    const applyFile = (file) => {
        if (!file) return;
        if (file.type !== "application/pdf") {
            setError("Only PDF files are supported.");
            return;
        }
        setSelectedFile(file);
        resetFileState();
    };

    const handleFileChange = (event) => {
        applyFile(event.target.files[0]);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        applyFile(event.dataTransfer.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Please select a PDF file to upload.");
            return;
        }

        setLoading(true);
        setError(null);
        setExcelLink(null);

        const formData = new FormData();
        formData.append("pdfFile", selectedFile);

        try {
            const response = await axios.post("http://119.148.49.85:8005/OCR/ConvertPDFtoExcel", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentage);
                },
            });

            if (response.data && response.data.url) {
                setExcelLink(response.data.url);
                setFileName(response.data.fileName || "converted-file.xlsx");
            } else {
                setError("Unexpected response from the server.");
            }
        } catch (err) {
            setError("Failed to convert PDF to Excel. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!excelLink) {
            setError("No file available for download.");
            return;
        }

        try {
            const response = await axios.get(excelLink, {
                responseType: "blob",
            });

            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            setError("Failed to download the Excel file. Please try again.");
            console.error("Error downloading file:", err);
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedFile(null);
        resetFileState();
        setLoading(false);
        setIsDragging(false);
    };

    return (
        <div>
            <CommonButton type="button" label="PDF to Excel" icon="pi pi-file-excel" onClick={() => setModalOpen(true)} className="!bg-yellow-400 !text-black h-11" />

            {modalOpen && (
                <>
                    <style>{`
                        @keyframes p2e-fade-in {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes p2e-scale-in {
                            from { opacity: 0; transform: translateY(8px) scale(0.98); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                        .p2e-close-btn:hover { background: #F1F5F9; color: #1E293B; }
                        .p2e-dropzone:hover { border-color: #94A3B8; background: #F8FAFC; }
                        .p2e-browse-link { color: #2563EB; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
                        .p2e-convert-btn:not(:disabled):hover { background: #1D4ED8; }
                        .p2e-download-btn:hover { background: #15803D; }
                        .p2e-secondary-btn:hover { background: #F1F5F9; }
                        .p2e-remove-file:hover { color: #DC2626; }
                    `}</style>

                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            backgroundColor: "rgba(15, 23, 42, 0.5)",
                            backdropFilter: "blur(2px)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 1000,
                            animation: "p2e-fade-in 0.15s ease-out",
                        }}
                        onClick={handleCloseModal}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: "#FFFFFF",
                                borderRadius: "12px",
                                maxWidth: "440px",
                                width: "92%",
                                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                                animation: "p2e-scale-in 0.18s ease-out",
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                overflow: "hidden",
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "18px 20px",
                                    borderBottom: "1px solid #E2E8F0",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div
                                        style={{
                                            width: "34px",
                                            height: "34px",
                                            borderRadius: "8px",
                                            background: "#EFF6FF",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <i className="pi pi-file-excel" style={{ color: "#2563EB", fontSize: "16px" }} />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#0F172A" }}>Convert PDF to Excel</h2>
                                        <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>Upload a PDF and get a downloadable spreadsheet</p>
                                    </div>
                                </div>
                                <button
                                    className="p2e-close-btn"
                                    onClick={handleCloseModal}
                                    style={{
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "6px",
                                        border: "none",
                                        background: "transparent",
                                        color: "#94A3B8",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "13px",
                                        transition: "background 0.15s, color 0.15s",
                                    }}
                                    aria-label="Close"
                                >
                                    <i className="pi pi-times" />
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{ padding: "20px" }}>
                                {!excelLink && (
                                    <>
                                        {!selectedFile ? (
                                            <label
                                                htmlFor="p2e-file-input"
                                                className="p2e-dropzone"
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(true);
                                                }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={handleDrop}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: "8px",
                                                    padding: "28px 16px",
                                                    borderRadius: "10px",
                                                    border: `1.5px dashed ${isDragging ? "#2563EB" : "#CBD5E1"}`,
                                                    background: isDragging ? "#EFF6FF" : "#FAFBFC",
                                                    cursor: "pointer",
                                                    transition: "all 0.15s ease",
                                                }}
                                            >
                                                <i className="pi pi-cloud-upload" style={{ fontSize: "26px", color: "#94A3B8" }} />
                                                <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", textAlign: "center" }}>
                                                    Drag and drop your PDF here, or <span className="p2e-browse-link">browse</span>
                                                </p>
                                                <p style={{ margin: 0, fontSize: "11.5px", color: "#94A3B8" }}>PDF files only</p>
                                                <input ref={fileInputRef} id="p2e-file-input" type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
                                            </label>
                                        ) : (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "10px",
                                                    padding: "12px 14px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #E2E8F0",
                                                    background: "#F8FAFC",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: "34px",
                                                        height: "34px",
                                                        borderRadius: "7px",
                                                        background: "#FEE2E2",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <i className="pi pi-file-pdf" style={{ color: "#DC2626", fontSize: "15px" }} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: "13px",
                                                            fontWeight: 500,
                                                            color: "#0F172A",
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                        }}
                                                    >
                                                        {selectedFile.name}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "11.5px", color: "#94A3B8" }}>{(selectedFile.size / 1024).toFixed(0)} KB</p>
                                                </div>
                                                {!loading && (
                                                    <button
                                                        className="p2e-remove-file"
                                                        onClick={() => {
                                                            setSelectedFile(null);
                                                            resetFileState();
                                                        }}
                                                        style={{
                                                            border: "none",
                                                            background: "transparent",
                                                            color: "#94A3B8",
                                                            cursor: "pointer",
                                                            fontSize: "13px",
                                                            padding: "4px",
                                                        }}
                                                        aria-label="Remove file"
                                                    >
                                                        <i className="pi pi-trash" />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {loading && (
                                            <div style={{ marginTop: "16px" }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        marginBottom: "6px",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "12px", color: "#475569" }}>Converting…</span>
                                                    <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>{progress}%</span>
                                                </div>
                                                <div
                                                    style={{
                                                        height: "6px",
                                                        width: "100%",
                                                        backgroundColor: "#E2E8F0",
                                                        borderRadius: "999px",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            height: "100%",
                                                            width: `${progress}%`,
                                                            backgroundColor: "#2563EB",
                                                            borderRadius: "999px",
                                                            transition: "width 0.25s ease",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {error && (
                                            <div
                                                style={{
                                                    marginTop: "14px",
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "8px",
                                                    padding: "10px 12px",
                                                    borderRadius: "8px",
                                                    background: "#FEF2F2",
                                                    border: "1px solid #FECACA",
                                                }}
                                            >
                                                <i className="pi pi-exclamation-circle" style={{ color: "#DC2626", fontSize: "13px", marginTop: "1px" }} />
                                                <p style={{ margin: 0, fontSize: "12.5px", color: "#B91C1C" }}>{error}</p>
                                            </div>
                                        )}

                                        <button
                                            className="p2e-convert-btn"
                                            onClick={handleUpload}
                                            disabled={loading || !selectedFile}
                                            style={{
                                                width: "100%",
                                                marginTop: "16px",
                                                padding: "11px",
                                                fontSize: "13.5px",
                                                fontWeight: 600,
                                                color: "#FFFFFF",
                                                backgroundColor: loading || !selectedFile ? "#93C5FD" : "#2563EB",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: loading || !selectedFile ? "not-allowed" : "pointer",
                                                transition: "background 0.15s ease",
                                            }}
                                        >
                                            {loading ? "Converting…" : "Convert to Excel"}
                                        </button>
                                    </>
                                )}

                                {excelLink && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            textAlign: "center",
                                            padding: "8px 0 4px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "50%",
                                                background: "#DCFCE7",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginBottom: "12px",
                                            }}
                                        >
                                            <i className="pi pi-check" style={{ color: "#16A34A", fontSize: "20px" }} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: 600, color: "#0F172A" }}>Conversion complete</h3>
                                        <p style={{ margin: "4px 0 16px", fontSize: "12.5px", color: "#64748B" }}>{fileName}</p>
                                        <button
                                            className="p2e-download-btn"
                                            onClick={handleDownload}
                                            style={{
                                                width: "100%",
                                                padding: "11px",
                                                fontSize: "13.5px",
                                                fontWeight: 600,
                                                color: "#FFFFFF",
                                                backgroundColor: "#16A34A",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "8px",
                                                transition: "background 0.15s ease",
                                            }}
                                        >
                                            <i className="pi pi-download" />
                                            Download Excel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div
                                style={{
                                    padding: "12px 20px",
                                    borderTop: "1px solid #E2E8F0",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    className="p2e-secondary-btn"
                                    onClick={handleCloseModal}
                                    style={{
                                        padding: "8px 16px",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#475569",
                                        background: "transparent",
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "7px",
                                        cursor: "pointer",
                                        transition: "background 0.15s ease",
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
