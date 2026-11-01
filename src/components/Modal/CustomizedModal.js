import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import Loader from "components/Loader/Loader";
import { Dialog } from "primereact/dialog";
import { FiEdit } from "react-icons/fi";
const CustomizedModal = ({
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
    tableShow,
    table,
    button,
    customBtn,
    classNames,
    lgColumn,
    xlColumn,
    smColumn,
    maximized,
    isAssign,
    ...rest
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

    return (
        <>
            <Dialog visible={dialogVisible} style={{ width: modalWidth }} header={dialogHeader} modal className="p-fluid" onHide={onHide} closeOnEscape blockScroll icons focusOnShow resizable maximizable keepInViewport={false} maximized={maximized}>
                {loader && <Loader />}
                <form onSubmit={formik.handleSubmit} className={`grid grid-cols-${column} lg:grid-cols-${lgColumn} xl:grid-cols-${xlColumn} sm:grid-cols-${smColumn} mt-2 gap-y-${gridColumnGap} gap-x-${gridRowGap || "2"}`} encType={formdata && "multipart/form-data"}>
                    {inputData.map(({ name, id, type, labelFor, label, required, className, autoCompleteMethod, autoFilteredValue, onBlur, onChange, errors, preview, onDeleteFile, onViewFile, ...rest }) => (
                        <div key={id} className={`p-field  ${className} `}>
                            <InputField
                                id={id}
                                type={type}
                                required={required}
                                name={name}
                                errors={errors || formik.errors[id]}
                                label={label}
                                labelFor={labelFor}
                                value={formik.values[id]}
                                autoCompleteMethod={autoCompleteMethod}
                                autoFilteredValue={autoFilteredValue}
                                onChange={(...args) => {
                                    !onChange && formik.handleChange(...args);
                                    onChange?.(...args);
                                }}
                                onBlur={onBlur}
                                {...rest}
                            />
                            {id === "file" && (
                                <div className={`${className}`}>
                                    {preview?.map((file, i) => (
                                        <div key={file?.documentID ?? `file-${file?.name ?? file?.documentLocation}-${i}`} className="bg-gray-200 p-3 flex justify-between mt-2 rounded-lg" tabIndex="-1" aria-label={`"Attachment: ${file.name || file.documentLocation}. Press enter to view the attachment and delete to remove it"`}>
                                            <div
                                                className="flex gap-1 cursor-pointer"
                                                role={onViewFile ? "button" : undefined}
                                                tabIndex={onViewFile ? 0 : undefined}
                                                title={onViewFile ? "Click to view file" : undefined}
                                                onClick={onViewFile ? () => onViewFile(file) : undefined}
                                                onKeyDown={
                                                    onViewFile
                                                        ? (e) => {
                                                              if (e.key === "Enter" || e.key === " ") {
                                                                  e.preventDefault();
                                                                  onViewFile(file);
                                                              }
                                                          }
                                                        : undefined
                                                }
                                            >
                                                <div className={`text-blue-700 font-bold${onViewFile ? " hover:underline" : ""}`}>{file.name || file.documentLocation}</div>
                                                <div className="text-gray-500 font-bold">({((file.size || file.fileSize) / Math.pow(1024, 2)).toFixed(2)}MB)</div>
                                            </div>
                                            <div
                                                role="button"
                                                aria-label="Remove attachment"
                                                className="vq"
                                                tabIndex="-1"
                                                data-tooltip="Remove attachment"
                                                onClick={() => {
                                                    onDeleteFile(file);
                                                }}
                                            >
                                                <i className="fa-solid fa-trash-can text-red-800"></i>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <div className={`flex justify-between items-center col-span-2`}>
                        <p>
                            N.B: <span className="text-red-500"> Red border field is must be required</span>
                        </p>
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
                </form>
                {tableShow && table}
                <div className="flex justify-end">{customBtn && button}</div>
            </Dialog>
        </>
    );
};

export default CustomizedModal;
