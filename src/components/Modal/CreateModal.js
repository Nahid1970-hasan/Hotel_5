import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import Loader from "components/Loader/Loader";
import { Table } from "components/Table/Table";
import { Dialog } from "primereact/dialog";
import { useRef } from "react";
import { FiEdit } from "react-icons/fi";
import { toast } from "react-toastify";
const CreateModal = ({
    dialogVisible = false,
    onHide,
    modalWidth = "450px",
    column = 1,
    inputData,
    formik,
    dialogHeader,
    reset,
    btnLoading,
    update,
    disabled = false,
    gridColumnGap,
    btnColSpan,
    gridRowGap,
    formdata,
    loader,
    isAssign,
    maximized,
    lgColumn,
    xlColumn,
    smColumn,
    TableColumns,
    lovDetails,
    breakpoints,
}) => {
    /**
     * @dialogVisible => state for dialog/modal open and close
     * @onHide => state for dialog hidden
     * @modalWidth => modal size default 450px
     * @column => grid per column
     * @inputData => data for input field
     * @formik => formik object
     * @dialogHeader => Header for the dialog box
     * @reset => form reset
     * @btnLoading => Button loading state => true / false
     * @disabled => to disable the button => true / false
     * @gridColumnGap => gap per column
     * @gridRowGap => gap per row
     * @btnColSpan => btn grow row based on the column
     * @formdata => if you want a return as a formdata
     * @loader => if you want to show a loader
     */

    const ref = useRef();

    const viewLocalFile = (file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    };

    const viewServerFile = (file) => {
        const path = file?.documentPath || file?.DocumentPath;
        if (!path) {
            toast.error("File path not available.");
            return;
        }
        window.open(path, "_blank", "noopener,noreferrer");
    };

    const viewAttachmentFile = (file) => {
        if (file?.documentPath || file?.DocumentPath || file?.documentID > 0) {
            viewServerFile(file);
        } else {
            viewLocalFile(file);
        }
    };



    // visible={showModal} style={{ width: "900px" }} modal className="p-fluid" onHide={hideModal} closeOnEscape blockScroll resizable

    return (
        <>
            <Dialog visible={dialogVisible} style={{ width: modalWidth }} breakpoints={breakpoints} header={dialogHeader} modal className="p-fluid" onHide={onHide} closeOnEscape blockScroll icons focusOnShow resizable maximizable keepInViewport={false} maximized={maximized}>
                {loader && <Loader />}
                <form onSubmit={formik.handleSubmit} encType={formdata && "multipart/form-data"}>
                    <div className={`grid grid-cols-${column} lg:grid-cols-${lgColumn} xl:grid-cols-${xlColumn} sm:grid-cols-${smColumn}  mt-2 gap-y-${gridColumnGap} gap-x-${gridRowGap || "2"} `}>
                        {inputData.map(({ name, id, type, labelFor, label, required, className, autoCompleteMethod, autoFilteredValue, onBlur, onChange, errors, preview, onDeleteFile, topContent,customElement, ...rest }) => (
                            <div key={id} className={`p-field  ${className} `}>
                                {topContent}
                                <InputField
                                    id={id}
                                    type={type}
                                    required={required}
                                    name={name}
                                    errors={errors || formik.errors?.[id]?.id || formik.errors[id]}
                                    label={label}
                                    labelFor={labelFor}
                                    className={className}
                                    value={formik.values?.[id]}
                                    autoCompleteMethod={autoCompleteMethod}
                                    autoFilteredValue={autoFilteredValue}
                                    ref={ref}
                                    onChange={(...args) => {
                                        !onChange && formik.handleChange(...args);
                                        onChange?.(...args);
                                    }}
                                    onBlur={onBlur}
                                    onClose={() => formik.setErrors({})}
                                    {...rest}


                                    
                                />
                                {id === "file" && (
                                    <div className={`${className}`}>
                                        {preview?.map((file, i) => (
                                            <div key={file?.documentID ?? `local-${file?.name}-${i}`} className="bg-gray-200 p-3 flex justify-between mt-2 rounded-lg" tabIndex="-1" aria-label={`"Attachment: ${file.name || file.documentLocation}. Press enter to view the attachment and delete to remove it"`}>
                                                <div
                                                    className="flex gap-1 cursor-pointer"
                                                    role="button"
                                                    tabIndex={0}
                                                    title="Click to view file"
                                                    onClick={() => viewAttachmentFile(file)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            viewAttachmentFile(file);
                                                        }
                                                    }}
                                                >
                                                    <div className=" text-blue-700 font-bold hover:underline">{file.name || file.documentLocation}</div>
                                                    <div className="text-gray-500 font-bold">({((file.size || file.fileSize) / Math.pow(1024, 2)).toFixed(4)}MB)</div>
                                                </div>
                                                <div
                                                    role="button"
                                                    aria-label="Remove attachment"
                                                    className="vq"
                                                    tabIndex="-1"
                                                    data-tooltip="Remove attachment"
                                                    onClick={() => {
                                                        onDeleteFile(file);
                                                        ref?.current && (ref.current.value = "");
                                                    }}
                                                >
                                                    <i className="fa-solid fa-trash-can text-red-800"></i>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {customElement}
                            </div>
                        ))}
                    </div>
                    <div className={`flex justify-between items-center col-span-${column}`}>
                        <p>N.B: Red border fields are required.</p>
                        <div className="flex gap-2">
                            <div>
                                <CommonButton type="reset" onClick={reset} className=" p-button-raised p-button-danger" title="Reset" disabled={btnLoading} label="Reset" icon="pi pi-times" color="p-button-raised p-button-success" />
                            </div>
                            {
                                <div>
                                    <CommonButton
                                        type="submit"
                                        className={`p-mr-2 p-button-raised ${update && !btnLoading ? "p-button-warning" : !update && !btnLoading && "p-button-success"}`}
                                        title={update && !btnLoading ? "Update" : !update && !btnLoading ? "Save" : "Loading"}
                                        disabled={disabled || btnLoading}
                                        label={update && !btnLoading ? "Update" : !update && !btnLoading ? (isAssign ? "Assign" : "Save") : "Loading"}
                                        icon={update && !btnLoading ? <FiEdit className="text-lg mr-2" /> : !update && !btnLoading ? "pi pi-save" : "pi pi-spin"}
                                        loading={btnLoading}
                                    />
                                </div>
                            }
                        </div>
                    </div>
                    {TableColumns && (
                        <div>
                            <Table {...TableColumns} />
                        </div>
                    )}
                </form>
            </Dialog>
        </>
    );
};

export default CreateModal;
