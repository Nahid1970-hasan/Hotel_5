// src/components/Converter/PdfToExcelSpecial.js

import React from "react";
import { CommonButton } from "components/Buttons/Buttons";
import { openPopupWindow } from "utilities/openPopupWindow";

export default function PdfToExcelSpecial() {
    // Opens iLovePDF's PDF to Excel tool in a popup window (no backend needed)
    const handleOpenILovePdfPopup = () => {
        openPopupWindow("https://www.ilovepdf.com/pdf_to_excel", "iLovePDF_PdfToExcel");
    };

    return <CommonButton type="button" label="PDF to Excel" icon="pi pi-file-excel" onClick={handleOpenILovePdfPopup} className="!bg-yellow-400 !text-black h-11" />;
}
