import React, { useContext, useEffect, useState } from "react";
import { InputField } from "components/InputField/Input";
import { useFormik } from "formik";
import Form from "./Form";
import { CommonButton } from "components/Buttons/Buttons";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { Button, Icon, IconButton, TextField } from "@mui/material";
import { InputSwitch } from "primereact/inputswitch";
import { getLovTypeByParams, getVendorsByCategoryID } from "service/dropdown";
import { userInfo } from "service/login";
import { coreAxios } from "utilities/axios";
import { AppContext } from "App";

const UpdateCsForm = ({ cs, recall, setRdId, vendors, setVendors, index, vendorType1, vendorType2, vendorType3 }) => {
    const { csCategoryID, /* vendorType1, setVendorType1, vendorType2, setVendorType2, vendorType3, setVendorType3, */ submitDataForCs, setSubmitDataForCs, submitDataID, setSubmitDataID, /* checked1, setChecked1, */ checked, setChecked } = useContext(AppContext);

    let updateCs = [];
    /* const [vendors, setVendors] = useState([]); */
    const [autoFilteredValue, setAutoFilteredValue] = useState([]);
    const [currency, setCurrency] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState([]);
    const [checked1, setChecked1] = useState(false);
    const [unit, setUnit] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoader, setSubmitLoader] = useState(false);
    // const [checked, setChecked] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);

    const { EmpID } = userInfo();

    cs?.csDetail.forEach((c, idx) => {
        const csObj = {
            id: uuidv4(),
            vendor: c.vendorName,
            quantity: c?.quantity,
            rate: c?.rate || 0,
            unitID: cs?.unitName,
            totalValue: c?.totalValue,
            isSelectedVendor: c?.isSelected === 1 ? true : false,
            paymentMethod: c?.paymentMethodName,
            currency: c?.currencyName,
            remarks: c?.remarks,
        };
        updateCs.push(csObj);
    });
    const [inputFields, setInputFields] = useState(updateCs);

    useEffect(() => {
        fetchAndGetUnit();
        /*  getVendors(); */
        fetchAndGetCurrency();
        getPaymentMethod();
    }, []);
    const [update, setUpdate] = useState(null);
    const handleSubmit = (e) => {
        setSubmitLoader(true);
        e.preventDefault();
        // //Console.log("click submit button");
        inputFields.map((i, idx) => {
            // //Console.log("cs?.csDetail[idx]?.vendorID", cs?.csDetail[idx]?.vendorID);
            i.unitID = i?.unitID;
            i.paymentMethodID = i.paymentMethod?.id || cs?.csDetail[idx]?.paymentMethodID;
            i.currencyID = i.currency?.id || cs?.csDetail[idx]?.currencyID;
            i.vendorID = cs?.csDetail[idx]?.vendorID || (i.vendor?.id ? i.vendor?.id : idx === 0 ? vendorType1?.id : idx === 1 ? vendorType2?.id : idx === 2 ? vendorType3?.id : 0);
            i.batchID = cs?.batchID;
            i.requisitionID = cs?.requisitionID;
            i.materialID = cs?.materialID;
            i.createdBy = EmpID;
            i.materialDescription = cs?.materialDescription;
            i.inventoryID = cs?.inventoryID;
            i.requisitionDetailID = cs?.csDetail[idx]?.requisitionDetailID;
            i.remarks = i.remarks;
            i.comparisonDetailID = cs?.csDetail[idx]?.comparisonDetailID || null;
            i.quantity = i?.quantity;
            /* delete i.unit;
            delete i.vendor;
            delete i.currency;
            delete i.paymentMethod; */
            return i;
        });

        if (checked) {
            setSubmitDataForCs((prev) => [...prev, { data: inputFields, id: index }]);
        } else {
            setSubmitDataForCs(
                submitDataForCs.filter((object) => {
                    return object.id !== index;
                })
            );
        }

        setLoading(true);
        setLoading(false);
        setSubmitLoader(false);
    };

    const handleChangeInput = (id, event) => {
        const newInputFields = inputFields.map((i) => {
            if (id === i.id) {
                i[event.target.name] = event.target.value;
            }
            return i;
        });

        setInputFields(newInputFields);
    };

    const handleAddFields = () => {
        setInputFields([...inputFields, { id: uuidv4(), quantity: 0 || cs?.quantity, rate: 0, unitID: cs?.unitName, totalValue: 0, isSelectedVendor: false, vendor: "", paymentMethod: "", currency: "BDT", remarks: "" }]);
    };

    const handleRemoveFields = (id) => {
        const values = [...inputFields];
        values.splice(
            values.findIndex((value) => value.id === id),
            1
        );
        setInputFields(values);
    };
    //  price calculation

    const calculatePrice = (num1, num2, idx) => {
        inputFields[idx].totalValue = num1 * num2;
        // setPrice(num1 * num2);
    };

    const getQuantity = ({ target: { value } }, idx) => {
        inputFields[idx].quantity = value;
        if (value === "") {
            calculatePrice(0, inputFields[idx].rate, idx);
        } else {
            calculatePrice(parseFloat(value), inputFields[idx].rate, idx);
        }
        // quantity = ;
    };
    const getRate = ({ target: { value } }, idx) => {
        inputFields[idx].rate = Math.max(parseFloat(value), 0);
        if (value === "") {
            calculatePrice(0, inputFields[idx].quantity, idx);
        } else {
            calculatePrice(parseFloat(value), inputFields[idx].quantity, idx);
        }
        // rate = .toFixed(4);
    };

    // dropdown1
    /*  const getVendors = async () => {
        try {
            setVendors(await getVendorsByCategoryID(cs?.categoryID));
        } catch (err) {
            toast.error(err);
        }
    }; */
    const searchVendors = (event) => {
        setTimeout(() => {
            if (!event.query.trim().length && event?.length === undefined) {
                setAutoFilteredValue([...vendors]);
            } else {
                setAutoFilteredValue(
                    vendors?.filter((v) => {
                        return v?.name.toLowerCase().startsWith(event.query.toLowerCase());
                    })
                );
            }
        }, 250);
    };
    //dropdown 2
    const fetchAndGetCurrency = async () => {
        try {
            setCurrency(await getLovTypeByParams("currency"));
        } catch (err) {
            toast.error(err);
        }
    };
    const searchCurrency = (event) => {
        setTimeout(() => {
            if (!event.query.trim().length && event?.length === undefined) {
                setCurrency([...currency]);
            } else {
                setCurrency(
                    currency?.filter((v) => {
                        return v?.name.toLowerCase().startsWith(event.query.toLowerCase());
                    })
                );
            }
        }, 250);
    };
    // dropdown 3
    const getPaymentMethod = async () => {
        try {
            setPaymentMethod(await getLovTypeByParams("paymentMethod"));
        } catch (err) {
            toast.error(err);
        }
    };
    const searchPaymentMethod = (event) => {
        setTimeout(() => {
            if (!event.query.trim().length && event?.length === undefined) {
                setPaymentMethod([...paymentMethod]);
            } else {
                setPaymentMethod(
                    paymentMethod?.filter((v) => {
                        return v.name.toLowerCase().startsWith(event.query.toLowerCase());
                    })
                );
            }
        }, 250);
    };
    //dropdown 4
    const fetchAndGetUnit = async () => {
        try {
            setUnit(await getLovTypeByParams("BuOM"));
        } catch (err) {
            toast.error(err);
        }
    };
    const searchUnit = (event) => {
        setTimeout(() => {
            if (!event.query.trim().length && event?.length === undefined) {
                setUnit([...unit]);
            } else {
                setUnit(
                    unit?.filter((v) => {
                        return v.name.toLowerCase().startsWith(event.query.toLowerCase());
                    })
                );
            }
        }, 250);
    };
    /* const editedValue = {
        quantity: cs?.quantity,
        rate: cs?.rate,
        unit: cs?.unitName,
        totalValue: parseFloat(quantity * rate).toFixed(4),
        vendor: "",
    };
    const formik = useFormik({
        initialValues: editedValue,

        onSubmit: async (values) => {
            //Console.log("v", values);
            cs?.apadoto?.push(values);
        },
    }); */

    /*  const getVendorType1 = ({ target: { value } }) => {
        setVendorType1(value);
    };
    const getVendorType2 = ({ target: { value } }) => {
        setVendorType2(value);
    };
    const getVendorType3 = ({ target: { value } }) => {
        setVendorType3(value);
    }; */
    return (
        <div className="mt-2">
            <form onSubmit={handleSubmit}>
                <div className="cs-check-btn">
                    {checked ? (
                        <button onClick={() => setChecked(false)} className={`py-0.5 px-1.5 border rounded-md bg-blue-700`}>
                            <i className="pi pi-check text-white text-sm"></i>
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setChecked(true);
                            }}
                            className="p-3 border border-blue-700 rounded-md"
                            type="submit"
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2">
                    {inputFields.map((inputField, idx) => (
                        <div data-aos="" key={inputField.id} className="bg-white rounded-md p-3 shadow-lg">
                            <div className="flex justify-between">
                                <h1 className="font-bold text-gray-600 py-2 ">Vendor {inputFields.indexOf(inputField) + 1}</h1>
                                {inputFields.indexOf(inputField) > 2 && <i onClick={() => handleRemoveFields(inputField.id)} className="pi pi-trash text-red-600 cursor-pointer" style={{ fontSize: "1em" }}></i>}
                            </div>
                            <div className="p-field">
                                {inputFields.indexOf(inputField) === 0 ? (
                                    <InputField
                                        id="vendor"
                                        name="vendor"
                                        type="select"
                                        labelFor="vendor"
                                        label="Select a Vendor"
                                        errors=""
                                        disabled={false}
                                        required={false}
                                        width="full"
                                        optionLabel=""
                                        value={inputField.vendor || vendorType1?.name}
                                        onChange={(event) => {
                                            handleChangeInput(inputField.id, event);
                                            /*  getVendorType1(event); */
                                        }}
                                        /* onSelect={(e) => {
                                            const filterVendor = vendors.filter((value) => value.id !== e.value.id);
                                            setVendors(filterVendor);
                                        }}*/
                                        autoFilteredValue={autoFilteredValue}
                                        autoCompleteMethod={searchVendors}
                                        selectedAutoValue={vendors}
                                        setSelectedAutoValue={setVendors}
                                    />
                                ) : (
                                    <>
                                        {inputFields.indexOf(inputField) === 1 ? (
                                            <InputField
                                                id="vendor"
                                                name="vendor"
                                                type="select"
                                                labelFor="vendor"
                                                label="Select a Vendor"
                                                errors=""
                                                disabled={false}
                                                required={false}
                                                width="full"
                                                optionLabel=""
                                                value={inputField.vendor || vendorType2?.name}
                                                /*  onSelect={(e) => {
                                                    const filterVendor = vendors.filter((value) => value.id !== e.value.id);
                                                    setVendors(filterVendor);
                                                }} */
                                                onChange={(event) => {
                                                    handleChangeInput(inputField.id, event);
                                                    /*   getVendorType2(event); */
                                                }}
                                                autoFilteredValue={autoFilteredValue}
                                                autoCompleteMethod={searchVendors}
                                                selectedAutoValue={vendors}
                                                setSelectedAutoValue={setVendors}
                                            />
                                        ) : (
                                            <>
                                                {inputFields.indexOf(inputField) === 2 ? (
                                                    <InputField
                                                        id="vendor"
                                                        name="vendor"
                                                        type="select"
                                                        labelFor="vendor"
                                                        label="Select a Vendor"
                                                        errors=""
                                                        disabled={false}
                                                        required={false}
                                                        width="full"
                                                        optionLabel=""
                                                        value={inputField.vendor || vendorType3?.name}
                                                        onChange={(event) => {
                                                            handleChangeInput(inputField.id, event);
                                                            /*   getVendorType3(event); */
                                                        }}
                                                        /*   onSelect={(e) => {
                                                            const filterVendor = vendors.filter((value) => value.id !== e.value.id);
                                                            setVendors(filterVendor);
                                                        }} */
                                                        autoFilteredValue={autoFilteredValue}
                                                        autoCompleteMethod={searchVendors}
                                                        selectedAutoValue={vendors}
                                                        setSelectedAutoValue={setVendors}
                                                    />
                                                ) : (
                                                    <InputField
                                                        id="vendor"
                                                        name="vendor"
                                                        type="select"
                                                        labelFor="vendor"
                                                        label="Select a Vendor"
                                                        errors=""
                                                        disabled={false}
                                                        required={false}
                                                        width="full"
                                                        optionLabel=""
                                                        value={inputField.vendor}
                                                        onChange={(event) => handleChangeInput(inputField.id, event)}
                                                        /*  onSelect={(e) => {
                                                            const filterVendor = vendors.filter((value) => value.id !== e.value.id);
                                                            setVendors(filterVendor);
                                                        }} */
                                                        autoFilteredValue={autoFilteredValue}
                                                        autoCompleteMethod={searchVendors}
                                                        selectedAutoValue={vendors}
                                                        setSelectedAutoValue={setVendors}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <div className="p-field">
                                    <TextField
                                        size="small"
                                        className=""
                                        required
                                        disabled={true}
                                        id="outlined-required"
                                        label="Quantity"
                                        defaultValue={cs?.quantity}
                                        onChange={(event) => {
                                            handleChangeInput(inputField.id, event);
                                            getQuantity(event, idx);
                                        }}
                                        type="number"
                                        fullWidth
                                    />
                                </div>
                                {/*  <div className="p-field">
                                    <InputField
                                        id="unitID"
                                        name="unitID"
                                        type="text"
                                        labelFor="unitID"
                                        label="Unit"
                                        errors=""
                                        disabled={true}
                                        required={false}
                                        width="full"
                                        optionLabel=""
                                        value={inputField.unitID}
                                        onChange={(event) => handleChangeInput(inputField.id, event)}
                                        
                                    />
                                </div> */}

                                <div className="p-field">
                                    <TextField id="unitID" size="small" name="unitID" type="text" labelFor="unitID" label="Unit" errors="" disabled={true} required={false} width="full" optionLabel="" value={inputField.unitID} onChange={(event) => handleChangeInput(inputField.id, event)} />
                                </div>
                                <div className="p-field ">
                                    <TextField
                                        size="small"
                                        className=""
                                        id="rate"
                                        name="rate"
                                        type="number"
                                        labelFor="rate"
                                        label="Select Rate"
                                        errors=""
                                        disabled={false}
                                        required={false}
                                        width="full"
                                        optionLabel=""
                                        onChange={(e) => {
                                            handleChangeInput(inputField.id, e);
                                            getRate(e, idx);
                                        }}
                                        value={inputField.rate}
                                    />
                                </div>
                                <div className="p-field">
                                    <TextField
                                        size="small"
                                        id="totalValue"
                                        name="totalValue"
                                        type="text"
                                        labelFor="totalValue"
                                        label="Total Price"
                                        errors=""
                                        disabled={true}
                                        required={false}
                                        width="full"
                                        optionLabel=""
                                        value={inputFields[idx].totalValue}
                                        onChange={(event) => handleChangeInput(inputField.id, event)} /* {formik.values.totalValue} */
                                    />
                                </div>
                                <div className="p-field">
                                    <InputField
                                        id="currency"
                                        name="currency"
                                        type="select"
                                        labelFor="currency"
                                        label="Select Currency"
                                        errors=""
                                        disabled={false}
                                        required={false}
                                        width="full"
                                        optionLabel=""
                                        value={inputField.currency}
                                        onChange={(event) => handleChangeInput(inputField.id, event)}
                                        autoFilteredValue={currency}
                                        autoCompleteMethod={searchCurrency}
                                    />
                                </div>
                                <div className="p-field">
                                    <InputField
                                        id="paymentMethod"
                                        name="paymentMethod"
                                        type="select"
                                        labelFor="paymentMethod"
                                        label="Payment Method"
                                        errors=""
                                        disabled={false}
                                        required={false}
                                        width="full"
                                        optionLabel=""
                                        value={inputField.paymentMethod}
                                        onChange={(event) => handleChangeInput(inputField.id, event)}
                                        autoFilteredValue={paymentMethod}
                                        autoCompleteMethod={searchPaymentMethod}
                                    />
                                </div>
                                <div className="p-field">
                                    <InputField
                                        id="remarks"
                                        name="remarks"
                                        type="text"
                                        labelFor="remarks"
                                        label="Remarks"
                                        errors=""
                                        disabled={false}
                                        required={false}
                                        width="full"
                                        optionLabel=""
                                        value={inputField.remarks}
                                        onChange={(event) => handleChangeInput(inputField.id, event)}
                                        /* autoFilteredValue={costCenter}
                        autoCompleteMethod={searchCostCenter} */
                                    />
                                </div>
                                <div className="p-field ">
                                    <div className="border border-gray-400 flex px-2 py-3   rounded-md ">
                                        <p className="text-gray-600 text-sm col-span-1 ">Is Selected Vendor</p>
                                        <div className="col-span-1 justify-self-end">
                                            <InputSwitch
                                                value={inputField.isSelectedVendor}
                                                id="isSelectedVendor"
                                                name="isSelectedVendor"
                                                checked={inputField.isSelectedVendor}
                                                disabled={isDisabled !== inputField.id ? checked1 : false}
                                                onChange={(e) => {
                                                    handleChangeInput(inputField.id, e);
                                                    setChecked1(e.value);
                                                    setIsDisabled(inputField.id);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/*  <div className="flex justify-end gap-2 pt-4">
                    <CommonButton className="p-mr-2 p-button-raised p-button-danger" title="Reject" type="reset" disabled={false} label="Reset" icon="pi pi-times" color="p-button-raised p-button-success" />
                    <CommonButton onClick={handleSubmit} className="p-mr-2 p-button-raised p-button-success" type="submit" title="Save" loading={submitLoader} disabled={false} label="Save" icon="pi pi-bookmark" color="p-button-raised p-button-success" />
                </div> */}
            </form>
            <div className="flex justify-end my-1  cs-add-btn">
                <CommonButton onClick={() => handleAddFields()} className="py-1 px-2 p-button-success " title="Add" disabled={false} label="Add" icon="pi pi-plus" color="p-button-raised p-button-success" />
            </div>
        </div>
    );
};

export default UpdateCsForm;
