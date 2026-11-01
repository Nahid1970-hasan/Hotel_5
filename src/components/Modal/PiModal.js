import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import Loader from "components/Loader/Loader";
import { Dialog } from "primereact/dialog";
import { FiEdit } from "react-icons/fi";
const PiModal = ({ dialogVisible = false, onHide, modalWidth = "450px", column = 1, inputData, formik, dialogHeader, reset, btnLoading, update, disabled = false, gridColumnGap, btnColSpan, gridRowGap, formdata, loader, tableShow, table, button, customBtn, classNames, ...rest }) => {
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
            <Dialog visible={dialogVisible} style={{ width: modalWidth }} header={dialogHeader} modal className="p-fluid" onHide={onHide} closeOnEscape blockScroll icons focusOnShow resizable maximizable>
                {loader && <Loader />}
                <form onSubmit={formik.handleSubmit} className={`grid grid-cols-${column} mt-2 gap-y-${gridColumnGap} gap-x-${gridRowGap || "2"}`} encType={formdata && "multipart/form-data"}>
                    {inputData.map(({ name, id, type, labelFor, label, required, className, autoCompleteMethod, autoFilteredValue, onBlur, onChange, errors, ...rest }) => (
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
                        </div>
                    ))}
                    <div className="col-span-3">{tableShow && table}</div>

                    <div className={`flex justify-between items-center col-span-${column}`}>
                        <p>
                            N.B: <span className="text-red-500"> Red border field is must be required</span>
                        </p>
                        <div className="flex gap-2">
                            <CommonButton type="reset" onClick={reset} className=" p-button-raised p-button-danger" title="Reset" disabled={btnLoading} label="Reset" icon="pi pi-times" color="p-button-raised p-button-success" />
                            <CommonButton
                                type="submit"
                                className={`p-mr-2 p-button-raised ${update && !btnLoading ? "p-button-warning" : !update && !btnLoading && "p-button-success"}`}
                                title={update && !btnLoading ? "Update" : !update && !btnLoading ? "Save" : "Loading"}
                                disabled={disabled || btnLoading}
                                label={update && !btnLoading ? "Update" : !update && !btnLoading ? "Save" : "Loading"}
                                icon={update && !btnLoading ? <FiEdit className="text-3xl mr-2" /> : !update && !btnLoading ? "pi pi-save" : "pi pi-spin"}
                                loading={btnLoading}
                            />
                        </div>
                    </div>
                </form>
            </Dialog>
        </>
    );
};

export default PiModal;
