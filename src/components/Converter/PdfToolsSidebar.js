// src/components/Converter/PdfToolsSidebar.js

import React, { useEffect, useState } from "react";
import { FaFileExcel, FaFileWord, FaExternalLinkAlt } from "react-icons/fa";
import { CommonButton } from "components/Buttons/Buttons";

// Add or remove tools here. Each opens the matching conversion page in a new window.
const TOOLS = [
    {
        label: "PDF to Excel",
        desc: "Extract tables and data into a spreadsheet",
        Icon: FaFileExcel,
        color: "#16A34A",
        bg: "#DCFCE7",
        url: "https://www.ilovepdf.com/pdf_to_excel",
    },
    {
        label: "PDF to Word",
        desc: "Turn a PDF into an editable Word document",
        Icon: FaFileWord,
        color: "#2563EB",
        bg: "#DBEAFE",
        url: "https://www.ilovepdf.com/pdf_to_word",
    },
];

function openTool(url) {
    const width = 1000;
    const height = 750;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(url, "DocumentConverterTool", `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
}

export default function PdfToolsSidebar() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <>
            <CommonButton type="button" label="Document Converter" icon="pi pi-sync" onClick={() => setOpen(true)} className="!bg-yellow-400 !text-black h-11" />

            {open && (
                <>
                    <style>{`
                        .pts-tool-card:hover { background: #F8FAFC; border-color: #CBD5E1; }
                        .pts-close-btn:hover { background: #F1F5F9; color: #1E293B; }
                    `}</style>

                    <div
                        onClick={() => setOpen(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(15, 23, 42, 0.45)",
                            zIndex: 1000,
                        }}
                    />

                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            right: 0,
                            height: "100vh",
                            width: "380px",
                            maxWidth: "92vw",
                            background: "#FFFFFF",
                            boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
                            zIndex: 1001,
                            display: "flex",
                            flexDirection: "column",
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: "22px 24px",
                                borderBottom: "1px solid #E2E8F0",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                            }}
                        >
                            <div>
                                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>Document Converter</h2>
                                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>Select a conversion to continue</p>
                            </div>
                            <button
                                className="pts-close-btn"
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "6px",
                                    border: "none",
                                    background: "transparent",
                                    color: "#94A3B8",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "14px",
                                    flexShrink: 0,
                                }}
                            >
                                <i className="pi pi-times" />
                            </button>
                        </div>

                        {/* Tool list */}
                        <div
                            style={{
                                padding: "20px 24px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                            }}
                        >
                            {TOOLS.map((tool) => {
                                const { Icon } = tool;
                                return (
                                    <button
                                        key={tool.label}
                                        className="pts-tool-card"
                                        onClick={() => openTool(tool.url)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "16px",
                                            padding: "18px",
                                            borderRadius: "12px",
                                            border: "1px solid #E2E8F0",
                                            background: "#FFFFFF",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            width: "100%",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "10px",
                                                background: tool.bg,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Icon size={22} color={tool.color} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: "14.5px", fontWeight: 700, color: "#0F172A" }}>{tool.label}</p>
                                            <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748B", lineHeight: 1.4 }}>{tool.desc}</p>
                                        </div>
                                        <FaExternalLinkAlt size={12} color="#CBD5E1" style={{ flexShrink: 0 }} />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "14px 24px", borderTop: "1px solid #E2E8F0", marginTop: "auto", flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: "11.5px", color: "#94A3B8", textAlign: "center" }}>© DIBS Design & Developed by DEKKO ISHO GROUP</p>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
