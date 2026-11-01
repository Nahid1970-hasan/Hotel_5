import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import { Table } from "components/Table/Table";
import Loader from "components/Loader/Loader";
import { Dialog } from "primereact/dialog";
import { FiEdit } from "react-icons/fi";
import { useRef } from "react";

const CreateModalSL = ({
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
    errorHandler,
    coreAxios,
    toast,
}) => {
    const ref = useRef();

    // Correct condition: Show only for SL (id=1) with 2+ days duration
    const showFileInput = formik.values?.leaveMasterID?.id === 1 && formik.values?.diffInDays !== undefined && formik.values.diffInDays + 1 >= 2;

    //Console.log("DEKHI EKBAR: ", formik?.values);
    //Console.log("Etao EKBAR: ", showFileInput);

    //File Onchange Start
    const handelFilesOnChange = (e) => {
        const selectedFilesArray = Array.from(e.target.files);
        const filesArray = selectedFilesArray.map((file) => file);
        const previousFile = [...formik.values.files];
        const previousFilePreview = [...formik.values.filesPreview];
        formik.setFieldValue("files", previousFile.concat(filesArray));
        formik.setFieldValue("filesPreview", previousFilePreview.concat(filesArray));
    }; //File Onchage End
    return (
        <Dialog visible={dialogVisible} style={{ width: modalWidth }} header={dialogHeader} modal className="p-fluid" onHide={onHide} closeOnEscape blockScroll icons focusOnShow resizable maximized={maximized} keepInViewport={false}>
            {loader && <Loader />}
            <form onSubmit={formik.handleSubmit} encType={formdata && "multipart/form-data"}>
                <div className={`grid grid-cols-${column} lg:grid-cols-${lgColumn} xl:grid-cols-${xlColumn} sm:grid-cols-${smColumn} mt-2 gap-y-${gridColumnGap} gap-x-${gridRowGap || "2"}`}>
                    {inputData.map(({ name, id, type, labelFor, label, required, className, autoCompleteMethod, autoFilteredValue, onBlur, onChange, errors, preview, onDeleteFile, ...rest }) => (
                        <div key={id} className={`p-field ${className}`}>
                            <InputField
                                id={id}
                                type={type}
                                required={required}
                                name={name}
                                errors={errors || formik.errors?.[id]?.id || formik.errors[id]}
                                label={label}
                                labelFor={labelFor}
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
                        </div>
                    ))}

                    {/* Corrected: Only show when both conditions are met */}
                    {showFileInput && (
                        <div className="w-full col-span-2 my-3">
                            <div className="border border-red-600 rounded-lg">
                                <InputField id="file" type="file2" name="file" label="file" labelFor="file" onChange={handelFilesOnChange} fileUploadPadding="5" filePreview={formik.values.filesPreview} />
                            </div>
                            <div className="mb-3">
                                {formik.values.filesPreview?.map((file, i) => (
                                    <div key={i} className="bg-gray-200 p-2 flex justify-between mt-2 rounded-lg" tabIndex="-1" aria-label={`"Attachment: ${file.name || file.documentLocation}. Press enter to view the attachment and delete to remove it"`}>
                                        <div className="flex gap-1 cursor-pointer">
                                            <div className=" text-blue-700 font-bold">{file.name || file.documentLocation}</div>
                                            <div className="text-gray-500 font-bold">({((file.size || file.fileSize) / Math.pow(1024, 2)).toFixed(4)}MB)</div>
                                        </div>
                                        <div
                                            role="button"
                                            aria-label="Remove attachment"
                                            className="vq"
                                            tabIndex="-1"
                                            data-tooltip="Remove attachment"
                                            onClick={async () => {
                                                formik.setFieldValue(
                                                    "files",
                                                    formik.values.files.filter((e) => e !== file)
                                                );
                                                formik.setFieldValue(
                                                    "filesPreview",
                                                    formik.values.filesPreview.filter((e) => e !== file)
                                                );
                                            }}
                                        >
                                            <i className="fa-solid fa-trash-can text-red-800"></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`flex justify-between items-center col-span-${column}`}>
                    <p>N.B: Red border fields are required.</p>
                    <div className="flex gap-2">
                        <CommonButton type="reset" onClick={reset} className="p-button-raised p-button-danger" title="Reset" disabled={btnLoading} label="Reset" icon="pi pi-times" />
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
                </div>

                {TableColumns && <Table {...TableColumns} />}
            </form>
        </Dialog>
    );
};

export default CreateModalSL;
