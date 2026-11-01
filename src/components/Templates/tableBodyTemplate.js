import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

export const tableBodyTemplate = (data, props) => {
    return (
        <>
            <span className="p-column-title">{props.header}</span>
            <span className="truncate">{typeof data[props.field] !== "number" ? data[props.field] : data[props.field] === 1 ? "YES" : "NO"}</span>
        </>
    );
};
export const booleanBodyTemplate = (data, props) => {
    return (
        <div className="text-center">
            <span className="p-column-title">{props.header}</span>
            <span className="truncate">{data[props.field] ? "YES" : "NO"}</span>
        </div>
    );
};
let nf = new Intl.NumberFormat("en-US");
export const tableBodyTemp = (data, props) => {
    return (
        <div>
            <p className={`p-column-title ${typeof data[props.field] === "number" && "text-right"}`}>{props.header}</p>
            <p className={`truncate ${typeof data[props.field] === "number" && "text-right"}`}>{typeof data[props.field] === "number" ? nf.format(data[props.field]) : data[props.field]}</p>
        </div>
    );
};
export const amountBodyTemp = (data, props) => {
    let nf = new Intl.NumberFormat("en-US");
    return (
        <div className=" text-center w-full">
            <p className="p-column-title text-right">{props.header}</p>
            <p className="truncate text-right">{nf.format(data[props.field])}</p>
        </div>
    );
};
export const tableBodyTempWithPadding = (data, props) => {
    return (
        <div className="p-3">
            <span className="p-column-title">{props.header}</span>
            <span className="truncate">{data[props.field]}</span>
        </div>
    );
};
const dateFormat = (date) => {
    if (typeof date === "string") {
        const trimmed = date.trim();
        const dayMonthYear = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dayMonthYear) {
            const day = Number(dayMonthYear[1]);
            const month = Number(dayMonthYear[2]);
            const year = dayMonthYear[3];
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
            }
        }
    }
    const inputDate = new Date(date);
    if (Number.isNaN(inputDate.getTime())) {
        return typeof date === "string" ? date : "";
    }
    const day = inputDate.getDate().toString().padStart(2, "0");
    const month = (inputDate.getMonth() + 1).toString().padStart(2, "0");
    const year = inputDate.getFullYear().toString();
    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate;
};
export const dateBodyTemp = (data, props) => {
    return (
        <>
            <span className="p-column-title">{props.header}</span>
            <span className="truncate">{data[props.field] ? dateFormat(data[props.field]) : ""}</span>
        </>
    );
};
const dateTimeFormat = (date) => {
    const inputDateTime = new Date(date);
    const formattedDate = inputDateTime.toLocaleDateString("en-GB");
    const formattedTime = inputDateTime.toLocaleTimeString("en-GB", { hour12: true });
    const formattedDateTime = `${formattedDate} ${formattedTime}`;
    return formattedDateTime;
};
export const dateTimeBodyTemp = (data, props) => {
    return (
        <>
            <span className="p-column-title">{props.header}</span>
            <span className="truncate">{data[props.field] ? dateTimeFormat(data[props.field]) : ""}</span>
        </>
    );
};
export const permissionTemp = (data, props) => {
    return (
        <>
            <div className="flex justify-center">
                <span className="p-column-title">{props.header}</span>
                <span className="truncate">{data[props.field] === 1 ? <AiOutlineCheck className="pi pi-check text-green-500 font-bold text-3xl"></AiOutlineCheck> : <AiOutlineClose className="pi pi-times text-red-500 text-3xl"></AiOutlineClose>}</span>
            </div>
        </>
    );
};
