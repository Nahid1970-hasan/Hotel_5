import React, { useState, useEffect } from "react";
import { InputField } from "components/InputField/Input";
import { useFormik } from "formik";
import { CommonButton } from "components/Buttons/Buttons";
import { getLovType, getLovTypeByParams, getVendorsByCategoryID } from "service/dropdown";
import { toast } from "react-toastify";
import { InputSwitch } from "primereact/inputswitch";
const Form = ({ cs, vendorType }) => {
    const [loading, setloading] = useState(false);
    const [unit, setUnit] = useState([]);
    /*  const [quantity, setQuantity] = useState();
    const [rate, setRate] = useState(); */
    const [price, setPrice] = useState();
    const [vendors, setVendors] = useState([]);
    const [currency, setCurrency] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState([]);
    const [checked1, setChecked1] = useState(false);

    useEffect(() => {
        fetchAndGetUnit();
        getVendors();
        fetchAndGetCurrency();
        getPaymentMethod();
    }, []);
    const fetchAndGetUnit = async () => {
        try {
            setUnit(await getLovTypeByParams("BuOM"));
        } catch (err) {
            toast.error(err);
        }
    };

    //  price calculation

    var quantity = cs?.quantity;
    var rate = cs?.rate;
    const calculatePrice = (num1, num2) => {
        setPrice(num1 * num2);
    };

    const getQuantity = ({ target: { value } }) => {
        calculatePrice(value, rate);
        cs.quantity = parseInt(value);
    };
    const getRate = ({ target: { value } }) => {
        calculatePrice(value, quantity);
        cs.rate = parseFloat(value).toFixed(4);
    };

    // dropdown1
    const getVendors = async () => {
        try {
            setVendors(await getVendorsByCategoryID(cs?.categoryID));
        } catch (err) {
            toast.error(err);
        }
    };
    const searchVendors = (event) => {
        setTimeout(() => {
            if (!event.query.trim().length && event?.length === undefined) {
                setVendors([...vendors]);
            } else {
                setVendors(
                    vendors?.filter((v) => {
                        return v.name.toLowerCase().startsWith(event.query.toLowerCase());
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
                        return v.name.toLowerCase().startsWith(event.query.toLowerCase());
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
    const editedValue = {
        quantity: cs?.quantity,
        rate: cs?.rate,
        unit: cs?.unitName,
        totalPrice: parseFloat(quantity * rate).toFixed(4),
        vendorID: "",
    };
    const formik = useFormik({
        initialValues: editedValue,

        onSubmit: async (values) => {
            // //Console.log("v", values);
            cs?.apadoto?.push(values);
        },
    });

    // //Console.log("allad", cs?.apadoto);

    return (
        <div>
            <form action="" onSubmit={formik.handleSubmit}>
                <div className="p-field">
                    <InputField
                        id="vendorID"
                        name="vendorID"
                        type="select"
                        labelFor="vendorID"
                        label="Select a Vendor"
                        errors=""
                        disabled={false}
                        required={false}
                        width="full"
                        optionLabel=""
                        onChange={formik.handleChange}
                        value={formik.values.vendorID || vendorType?.name}
                        autoFilteredValue={vendors}
                        autoCompleteMethod={searchVendors}
                    />
                </div>
                <div className="p-field">
                    <InputField
                        id="quantity"
                        name="quantity"
                        type="text"
                        labelFor="quantity"
                        label="Quantity"
                        errors=""
                        disabled={false}
                        required={false}
                        width="full"
                        optionLabel=""
                        onChange={(...rest) => {
                            formik.handleChange(...rest);
                            getQuantity(...rest);
                        }}
                        value={formik.values.quantity}
                    />
                </div>
                <div className="p-field">
                    <InputField
                        id="unit"
                        name="unit"
                        type="select"
                        labelFor="unit"
                        label="Select a Unit"
                        errors=""
                        disabled={false}
                        required={false}
                        width="full"
                        optionLabel=""
                        onChange={(...rest) => {
                            formik.handleChange(...rest);
                        }}
                        value={formik.values.unit}
                        /* autoFilteredValue={costCenter}
                        autoCompleteMethod={searchCostCenter} */
                    />
                </div>
                <div className="p-field">
                    <InputField
                        id="rate"
                        name="rate"
                        type="text"
                        labelFor="rate"
                        label="Select Rate"
                        errors=""
                        disabled={false}
                        required={false}
                        width="full"
                        optionLabel=""
                        onChange={(...rest) => {
                            formik.handleChange(...rest);
                            getRate(...rest);
                        }}
                        value={formik.values.rate}
                        /* autoFilteredValue={costCenter}
                        autoCompleteMethod={searchCostCenter} */
                    />
                </div>
                <div className="p-field">
                    <InputField id="totalPrice" name="totalPrice" type="text" labelFor="totalPrice" label="Total Price" errors="" disabled={false} required={false} width="full" optionLabel="" onChange={formik.handleChange} value={price} /* {formik.values.totalPrice} */ />
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
                        onChange={formik.handleChange}
                        value={formik.values.currency}
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
                        label="Select Payment Method"
                        errors=""
                        disabled={false}
                        required={false}
                        width="full"
                        optionLabel=""
                        onChange={formik.handleChange}
                        value={formik.values.paymentMethod}
                        autoFilteredValue={paymentMethod}
                        autoCompleteMethod={searchPaymentMethod}
                    />
                </div>
                <div className="p-field">
                    <InputField
                        id="remarks"
                        name="remarks"
                        type="textarea"
                        labelFor="remarks"
                        label="Remarks"
                        errors=""
                        disabled={false}
                        required={false}
                        width="full"
                        optionLabel=""
                        onChange={formik.handleChange}
                        value={formik.values.remarks}
                        /* autoFilteredValue={costCenter}
                        autoCompleteMethod={searchCostCenter} */
                    />
                </div>
                <div className="p-field">
                    <div className="border border-gray-400 grid grid-cols-2 p-4 rounded-md">
                        <p className="text-gray-600 col-span-1 ">Is Vendor</p>
                        <div className="col-span-1 justify-self-end">
                            <InputSwitch value={formik.values.isCostCenterEnable} id="isVendor" name="isVendor" checked={checked1} required onChange={(e) => setChecked1(e.value)} />
                        </div>
                    </div>
                </div>
                <input type="submit" />
            </form>
        </div>
    );
};

export default Form;

/* import React, { useState } from "react";
import { InputField } from "components/InputField/Input";
import { useFormik } from "formik";
import Form from "./Form";
import { CommonButton } from "components/Buttons/Buttons";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";

const CsForm = ({ cs, vendorType1, vendorType2, vendorType3 }) => {
    const [formFields, setFormFields] = useState([]);
    const handleAddFields = () => {
        setFormFields([...formFields, { id: uuidv4(), name: "vendor" }]);
    };

    //Console.log("cs", vendorType1);

    const handleRemoveFields = (id) => {
        const values = [...formFields];

        values.splice(
            values.findIndex((value) => value.id === id),
            1
        );
        setFormFields(values);
    };
    return (
        <div data-aos="fade-down" className="border-t-2 mt-2">
            <div className="flex justify-end mt-1">
                <CommonButton onClick={() => handleAddFields()} className=" p-button-raised p-button-success " title="Add" disabled={false} label="Add" icon="pi pi-plus" color="p-button-raised p-button-success" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                <div className="bg-white rounded-md p-4 shadow-lg">
                    <div className="flex justify-between">
                        <h1 className="font-bold text-gray-600 py-2 ">Vendor 1</h1>
                    </div>
                    <Form cs={cs} vendorType={vendorType1}></Form>
                </div>
                <div className="bg-white rounded-md p-4 shadow-lg">
                    <div className="flex justify-between">
                        <h1 className="font-bold text-gray-600 py-2 ">Vendor 2</h1>
                    </div>
                    <Form cs={cs} vendorType={vendorType2}></Form>
                </div>
                <div className="bg-white rounded-md p-4 shadow-lg">
                    <div className="flex justify-between">
                        <h1 className="font-bold text-gray-600 py-2 ">Vendor 3</h1>
                    </div>
                    <Form cs={cs} vendorType={vendorType3}></Form>
                </div>
                {formFields?.map((form) => (
                    <div className="bg-white rounded-md p-4 shadow-lg">
                        <div className="flex justify-between">
                            <h1 className="font-bold text-gray-600 py-2 ">Vendor {formFields.indexOf(form) + 4}</h1>
                            <i onClick={() => handleRemoveFields(form.id)} className="pi pi-trash text-red-600 cursor-pointer" style={{ fontSize: "1em" }}></i>
                        </div>
                        <Form cs={cs}></Form>
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <CommonButton className="p-mr-2 p-button-raised p-button-danger" title="Reject" disabled={false} label="Reset" icon="pi pi-times" color="p-button-raised p-button-success" loading={false} />
                <CommonButton className="p-mr-2 p-button-raised p-button-success" title="Save" disabled={false} label="Save" icon="pi pi-bookmark" color="p-button-raised p-button-success" />
            </div>
        </div>
    );
};

export default CsForm;
 */
