import { CommonButton } from "components/Buttons/Buttons";
import { InputField } from "components/InputField/Input";
import Loader from "components/Loader/Loader";
import { useFormik } from "formik";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { coreAxios } from "utilities/axios";
import { dropdownFunction } from "utilities/dropdownFunc";
import { errorHandler } from "utilities/errorHandler/errorHandler";
import { Dialog } from "primereact/dialog";
import { responsiveModalStyle } from "utilities/modalWidth";
import { useEffect } from "react";
import { getCompanyDropdown } from "actions/Dropdown/Dropdown_CompanyAction";

export default function UpdateDeliveryAddress({ showForm, rowData, hideModal }) {
    //Console.log("rowData", rowData);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [companyDropdown, setCompanyDropdown] = useState([]);
    const { companies, companiesError } = useSelector((state) => state.dropdownCompany);

    useEffect(() => {
        dispatch(getCompanyDropdown({}));
    }, [dispatch]);

    const createInitialValue = {
        workOrderNo: "",
        grnNo: "",
        deliveryOrderNo: rowData?.workOrderNo || "",
        companyID: 0,
        materialOrderNo: "",
        oldMaterialName: "",
        materialName: "",
        comparisonNo: "",
        supplierMaterial: "",
        supplierName: "",
        noteType: 0,
        referenceName: "",
    };
    const formik = useFormik({
        initialValues: createInitialValue,
        onSubmit: (values) => {
            //Console.log("Values", values);
        },
        enableReinitialize: true,
        validateOnChange: false,
    });
    const updateAddress = async () => {
        setLoading(true);
        try {
            const response = await coreAxios.put(`/api/QuickSupport/Get_QuickSupportForInventory?OrderNo=${formik.values?.deliveryOrderNo}&OrderTypeID=${0}&OldMaterialName=${0}&MaterialName=${0}&DeliveryCompanyID=${formik.values?.companyID?.id}&CommandID=${2}`);
            if (response.status === 200) {
                setLoading(false);
                toast.success("Successfully updated delivery address");
                hideModal();
            }
        } catch (error) {
            setLoading(false);
            hideModal();
            errorHandler(error.response);
        }
    };
    return (
        <div>
            <Dialog visible={showForm ? true : false} style={{ width: "600px" }} header={``} modal className="p-fluid" onHide={hideModal} closeOnEscape blockScroll icons focusOnShow resizable maximizable>
                <div className="bg-[#ffff] border-2-gray p-2 m-2 col-span-1  mt-10 mb-10 shadow-2xl rounded-md border-t-2 border-[#1565C0]">
                    <p className="col-span-2 text-center text-lg font-semibold">Update Delivery Address</p>

                    <div className=" ">
                        <form className=" mt-6 mb-6 ml-auto mr-auto" onSubmit={formik.handleSubmit}>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-1">
                                    <InputField id="deliveryOrderNo" name="deliveryOrderNo" labelFor="deliveryOrderNo " type="text" label="Work Order Number " width="full" value={formik.values.deliveryOrderNo} onChange={formik.handleChange} disabled />
                                </div>
                                <div className="col-span-1">
                                    <InputField
                                        id="companyID"
                                        name="companyID"
                                        labelFor="Company "
                                        type="select"
                                        label="Select Company"
                                        width="full"
                                        value={formik.values.companyID}
                                        onChange={formik.handleChange}
                                        autoFilteredValue={companyDropdown}
                                        autoCompleteMethod={(event) => dropdownFunction(event, setCompanyDropdown, companies)}
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="ml-auto mr-auto md:flex md:ml-2">
                            <CommonButton icon="pi pi-pencil" onClick={() => updateAddress()} loading={loading} className="p-mr-3 p-button-raised p-button-success md:w-full " title="UnLock" label="Update Adress" type="" color="p-button-raised p-button-success"></CommonButton>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
