import { TextField } from "@mui/material";
import { DatePicker, DateTimeField, DateTimePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { AutoComplete } from "primereact/autocomplete";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { InputSwitch } from "primereact/inputswitch";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { ListBox } from "primereact/listbox";
import { MultiSelect } from "primereact/multiselect";
import { Password } from "primereact/password";
import { PickList } from "primereact/picklist";
import { RadioButton } from "primereact/radiobutton";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { MdOutlineFilePresent, MdOutlineGTranslate } from "react-icons/md";
import { toast } from "react-toastify";
import { debounce } from "lodash";

export const InputField = ({
    id,
    type,
    name,
    label,
    labelFor,
    required,
    dialog,
    errors,
    defaultValue,
    disabled = false,
    disabledMulti = false,
    register,
    width = "full",
    height,
    value,
    optionLabel,
    autoFilteredValue,
    autoCompleteMethod,
    selectedAutoValue,
    setSelectedAutoValue,
    className,
    checked,
    onChange,
    onKeyPress,
    ref,
    translateHandler,
    setSwitchChecked,
    switchChecked,
    onBlur,
    options = [],
    imagePreview,
    setImagePreview,
    onSelect,
    onClick,
    inputGroup,
    inputGroupIcon,
    switchClassName,
    picklistSourceValue,
    picklistTargetValue,
    setPicklistSourceValue,
    setPicklistTargetValue,
    sourceHeader,
    targetHeader,
    fileUploadPadding,
    autoCompleteFieldName,
    maxFractionDigits,
    minFractionDigits,
    prefix,
    suffix,
    mode,
    min,
    filePreview,
    radioBtnmap = [],
    selectionMode,
    minDate,
    maxDate,
    readOnlyInput,
    dateWriteAble,
    maxlength,
    onClose,
    accept,
    rows,
    cols,
    listValue,
    max,
    placeholder,
    padding,
    timeOnly,
    readOnly,
    onFocus,
    hourFormat,
    showTime,
    display,
    selectionLimit,
    maxSelectedLabels = 3,
    selectedItemsLabel,
    panelStyle,
    panelClassName,
    autoComplete,
    "auto-complete": autoCompleteEnabled,
    ...rest
}) => {
    // State and refs
    const [numbers, setNumbers] = useState(value || "");
    const [inputValue, setInputValue] = useState(value !== undefined ? String(value) : "0");
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [currentFilter, setCurrentFilter] = useState("");
    const numberInputRef = useRef(null);
    const inputRef = useRef(null);
    const customTextRef = useRef(null);
    const isAutoCompleteEnabled = autoCompleteEnabled === true || autoCompleteEnabled === "true" || autoCompleteEnabled === "on" || autoComplete === true;

    // Initialize with first chunk of data for large datasets
    useEffect(() => {
        if (currentFilter === "") {
            let initialOptions;
            if (type === "multiselect" && options?.length > 1000) {
                initialOptions = options.slice(0, 100);
            } else if (type === "multiselect") {
                initialOptions = options;
            } else {
                return;
            }

            if (value && Array.isArray(value) && value.length > 0) {
                const selectedNotInInitial = value.filter((selectedItem) => !initialOptions.some((opt) => (optionLabel ? opt[optionLabel] === selectedItem[optionLabel] : opt === selectedItem)));

                if (selectedNotInInitial.length > 0) {
                    initialOptions = [...value, ...initialOptions.filter((opt) => !value.some((v) => (optionLabel ? v[optionLabel] === opt[optionLabel] : v === opt)))];
                }
            }

            setFilteredOptions(initialOptions);
        }
    }, [options, type, value, optionLabel, currentFilter]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const filterOptions = useCallback(
        debounce((filterValue, allOptions, optLabel, currentValue) => {
            setLoading(true);

            if (filterValue === "") {
                // Reset to initial state
                let initial = allOptions.length > 1000 ? allOptions.slice(0, 100) : allOptions;

                // Include selected values
                if (currentValue && Array.isArray(currentValue) && currentValue.length > 0) {
                    const selectedNotInInitial = currentValue.filter((selectedItem) => !initial.some((opt) => (optLabel ? opt[optLabel] === selectedItem[optLabel] : opt === selectedItem)));

                    if (selectedNotInInitial.length > 0) {
                        initial = [...currentValue, ...initial.filter((opt) => !currentValue.some((v) => (optLabel ? v[optLabel] === opt[optLabel] : v === opt)))];
                    }
                }

                setFilteredOptions(initial);
            } else {
                // Perform filtering
                const filtered = allOptions.filter((option) => {
                    const label = optLabel ? option[optLabel] : option;
                    const labelStr = String(label || "").toLowerCase();
                    const match = labelStr.includes(filterValue.toLowerCase());
                    return match;
                });

                // Always include selected items even if they don't match filter
                if (currentValue && Array.isArray(currentValue) && currentValue.length > 0) {
                    const selectedNotInFiltered = currentValue.filter((selectedItem) => !filtered.some((opt) => (optLabel ? opt[optLabel] === selectedItem[optLabel] : opt === selectedItem)));

                    if (selectedNotInFiltered.length > 0) {
                        filtered.unshift(...selectedNotInFiltered);
                    }
                }

                const result = filtered.slice(0, 100);
                setFilteredOptions(result);
            }

            setLoading(false);
        }, 300),
        [],
    );

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            filterOptions.cancel();
        };
    }, [filterOptions]);

    // Wheel event prevention for number inputs
    useEffect(() => {
        const handleWheel = (event) => {
            event.preventDefault();
        };

        const elements = document.querySelectorAll(".numberFieldID");
        elements.forEach((element) => {
            element.addEventListener("wheel", handleWheel, { passive: false });
        });

        return () => {
            elements.forEach((element) => {
                element.removeEventListener("wheel", handleWheel);
            });
        };
    }, []);

    // Error handling
    useEffect(() => {
        if (errors) {
            toast.error(errors, { onClose });
        }
    }, [errors]);

    // Sync number values
    useEffect(() => {
        setNumbers(value);
    }, [value]);

    // Sync input values - Only if not a numberFix field or user is not typing
    useEffect(() => {
        if (type === "numberFix") {
            // For numberFix, only sync if user is not actively typing
            if (!isUserTyping) {
                setInputValue(value !== undefined && value !== null ? String(value) : "0");
            }
        } else {
            setInputValue(value || "");
        }
    }, [value, type, isUserTyping]);

    // Style configurations
    const style = {
        "& .MuiOutlinedInput-root": {
            "&.Mui-focused fieldset": {
                borderColor: "#3F51B5",
            },
        },
    };

    const requiredStyle = {
        "& .MuiOutlinedInput-root": {
            "&.Mui-focused fieldset": {
                borderColor: "#3F51B5",
            },
            "& fieldset": {
                borderColor: "red",
            },
        },
    };

    const dateTimeStyle = {
        ".MuiInputBase-input": {
            padding: "11.5px",
            backgroundColor: "#fff !important",
        },
        "& .MuiOutlinedInput-root": {
            "&.Mui-focused fieldset": {
                borderColor: "#3F51B5",
            },
            ...(required &&
                !value && {
                    "& fieldset": {
                        borderColor: "red",
                    },
                }),
        },
    };

    // Helper functions
    const fixedNumber = (e) => {
        const number = maxFractionDigits === undefined ? e : Math.round(e * Math.pow(10, maxFractionDigits)) / Math.pow(10, maxFractionDigits);
        return number === 0 ? numbers : number === "" ? "" : number;
    };

    const handleFocus = () => {
        if (numberInputRef.current) {
            numberInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    // NumberFix handlers
    const handleNumberFixChange = (e) => {
        let newValue = e.target.value;
        setIsUserTyping(true);

        // Allow empty or just decimal point to stay in display
        if (newValue === "" || newValue === ".") {
            setInputValue(newValue);
            // Always send numeric value to parent
            onChange({
                ...e,
                value: 0,
                target: {
                    ...e.target,
                    name: name,
                    value: 0,
                },
            });
            return;
        }

        // Only allow digits and decimal point
        if (!/^\d*\.?\d*$/.test(newValue)) return;

        // Check min/max constraints
        if (newValue !== "") {
            const numericValue = parseFloat(newValue);
            if (typeof min === "number" && numericValue < min) return;
            if (typeof max === "number" && numericValue > max) return;
        }

        // Enforce max fraction digits
        if (maxFractionDigits !== undefined && newValue.includes(".")) {
            const decimalPart = newValue.split(".")[1];
            if (decimalPart && decimalPart.length > maxFractionDigits) {
                newValue = newValue.slice(0, newValue.indexOf(".") + maxFractionDigits + 1);
            }
        }

        setInputValue(newValue);
        const numericValue = parseFloat(newValue) || 0;

        onChange({
            ...e,
            value: numericValue,
            target: {
                ...e.target,
                name: name,
                value: numericValue,
            },
        });
    };

    const handleNumberFixBlur = (e) => {
        setIsUserTyping(false);

        // If it's just a decimal point, display "0." but send 0
        if (inputValue === ".") {
            setInputValue("0.");
            const blurEvent = {
                ...e,
                value: 0,
                target: {
                    ...e.target,
                    name: name,
                    value: 0,
                },
            };
            if (onBlur) onBlur(blurEvent);
            return;
        }

        // If empty or invalid, default to 0
        if (inputValue === "" || isNaN(Number(inputValue))) {
            setInputValue("0");
            const blurEvent = {
                ...e,
                value: 0,
                target: {
                    ...e.target,
                    name: name,
                    value: 0,
                },
            };
            if (onBlur) onBlur(blurEvent);
            return;
        }

        if (onBlur) onBlur(e);
    };

    const handleNumberFixKeyDown = (event) => {
        // Prevent decimal if maxFractionDigits is 0
        if (!maxFractionDigits && event.key === ".") {
            event.preventDefault();
        }
    };

    const handleNumberFixFocus = (e) => {
        setIsUserTyping(true);
        if (onFocus) onFocus(e);
    };

    // const handleChange = (e) => {
    //     let newValue = e.target.value;

    //     if (newValue === "") {
    //         setInputValue(0);
    //         onChange({
    //             ...e,
    //             value: 0,
    //             target: {
    //                 ...e.target,
    //                 name: name,
    //                 value: 0,
    //             },
    //         });
    //         return;
    //     }

    //     if (!/^\d*\.?\d*$/.test(newValue)) return;

    //     if (newValue !== "" && newValue !== ".") {
    //         const numericValue = parseFloat(newValue);
    //         if (typeof min === "number" && numericValue < min) return;
    //         if (typeof max === "number" && numericValue > max) return;
    //     }

    //     if (maxFractionDigits !== undefined && newValue.includes(".")) {
    //         const decimalPart = newValue.split(".")[1];
    //         if (decimalPart && decimalPart.length > maxFractionDigits) {
    //             newValue = newValue.slice(0, newValue.indexOf(".") + maxFractionDigits + 1);
    //         }
    //     }

    //     setInputValue(newValue);
    //     const numericValue = newValue === "" ? 0 : Number(newValue);
    //     onChange({
    //         ...e,
    //         value: numericValue,
    //         target: {
    //             ...e.target,
    //             name: name,
    //             value: numericValue,
    //         },
    //     });
    // };

    // const handleBlur = (e) => {
    //     if (inputValue === "" || inputValue === "." || isNaN(Number(inputValue))) {
    //         setInputValue(0);
    //         setNumbers(0);
    //         const blurEvent = {
    //             ...e,
    //             value: 0,
    //             target: {
    //                 ...e.target,
    //                 name: name,
    //                 value: 0,
    //             },
    //         };
    //         if (onBlur) onBlur(blurEvent);
    //         return;
    //     }

    //     setNumbers(value ? value : 0);
    //     if (onBlur) onBlur(e);
    // };

    // const handleFocus1 = (e) => {
    //     if (onFocus) onFocus(e);
    // };

    // Optimized MultiSelect component
    const renderMultiSelect = useMemo(() => {
        return (
            <>
                <MultiSelect
                    value={value || []}
                    onChange={(e) => {
                        // After selection, ensure all selected items are in filteredOptions
                        if (e.value && e.value.length > 0) {
                            const missingItems = e.value.filter((selectedItem) => !filteredOptions.some((opt) => (optionLabel ? opt[optionLabel] === selectedItem[optionLabel] : opt === selectedItem)));

                            if (missingItems.length > 0) {
                                setFilteredOptions((prev) => [...prev, ...missingItems]);
                            }
                        }
                        onChange(e);
                    }}
                    options={filteredOptions}
                    optionLabel={optionLabel}
                    placeholder={placeholder}
                    disabled={disabledMulti || disabled}
                    filter
                    display={display}
                    selectionLimit={selectionLimit}
                    panelStyle={panelStyle}
                    panelClassName={panelClassName}
                    selectedItemsLabel={selectedItemsLabel}
                    className={`rounded-md w-${width} ${required && (!Array.isArray(value) || value.length === 0) ? "!border-red-500 autoComplete-red" : ""} ${className || ""}`}
                    maxSelectedLabels={maxSelectedLabels}
                    virtualScrollerOptions={{
                        itemSize: 38,
                        lazy: true,
                        onLazyLoad: (e) => {
                            // Only load more if not filtering
                            if (currentFilter === "" && options.length > filteredOptions.length) {
                                const newOptions = options.slice(filteredOptions.length, filteredOptions.length + 100);
                                setFilteredOptions((prev) => [...prev, ...newOptions]);
                            }
                        },
                    }}
                    onFilter={(e) => {
                        const filterValue = e.filter || "";

                        setCurrentFilter(filterValue);
                        filterOptions(filterValue, options, optionLabel, value);
                    }}
                    loading={loading}
                    resetFilterOnHide={true}
                    onHide={() => {
                        setCurrentFilter("");
                        let initialOptions;
                        if (options.length > 1000) {
                            initialOptions = options.slice(0, 100);
                        } else {
                            initialOptions = options;
                        }

                        if (value && value.length > 0) {
                            const selectedNotInInitial = value.filter((selectedItem) => !initialOptions.some((opt) => (optionLabel ? opt[optionLabel] === selectedItem[optionLabel] : opt === selectedItem)));

                            if (selectedNotInInitial.length > 0) {
                                initialOptions = [...selectedNotInInitial, ...initialOptions];
                            }
                        }

                        setFilteredOptions(initialOptions);
                    }}
                />
                <label htmlFor={labelFor}>{label}</label>
            </>
        );
    }, [filteredOptions, value, optionLabel, placeholder, disabledMulti, disabled, width, required, loading, labelFor, label, onChange, currentFilter, options, filterOptions, display, selectionLimit, maxSelectedLabels, selectedItemsLabel, panelStyle, panelClassName, className]);

    useEffect(() => {
        if (type === "customText" && customTextRef.current) {
            const savedPosition = customTextRef.current.dataset.cursorPosition;
            if (savedPosition !== undefined) {
                const position = parseInt(savedPosition, 10);
                customTextRef.current.setSelectionRange(position, position);
            }
        }
    }, [value, type]);

    return (
        <>
            {type !== "image" && (
                <span className={type === "numbers" || type === "listbox" || type === "picklist" || (type === "date" && showTime) || (type === "date" && timeOnly) ? "w-full" : "p-float-label w-full"}>
                    {!inputGroup && type === "text" && isAutoCompleteEnabled && (
                        <div className="relative p-float-label w-full">
                            <AutoComplete
                                suggestions={autoFilteredValue || []}
                                completeMethod={typeof autoCompleteMethod === "function" ? autoCompleteMethod : undefined}
                                field={autoCompleteFieldName || "name"}
                                id={id}
                                name={name}
                                className={`rounded-md w-${width}`}
                                disabled={disabled}
                                value={value == null ? "" : value}
                                onChange={onChange}
                                onBlur={onBlur}
                                onClick={onClick}
                                dropdown={false}
                                forceSelection={false}
                                {...rest}
                            />
                            <label className="text-[#A2B3C4]" htmlFor={labelFor}>
                                {label}
                            </label>
                        </div>
                    )}
                    {!inputGroup && type === "text" && !isAutoCompleteEnabled && (
                        <>
                            <InputText
                                id={id}
                                name={name}
                                className={`rounded-md ${required && !value?.length && "border-red-500"} w-${width}`}
                                disabled={disabled}
                                value={value == null ? "" : value}
                                onChange={onChange}
                                required={required}
                                onBlur={onBlur}
                                onClick={onClick}
                                onKeyPress={onKeyPress}
                                autoComplete={autoComplete}
                                {...rest}
                            />
                            <label className="text-[#A2B3C4]" htmlFor={labelFor}>
                                {label}
                            </label>
                        </>
                    )}
                    {!inputGroup && type === "customText" && (
                        <>
                            <input
                                type="text"
                                id={id}
                                name={name}
                                ref={customTextRef}
                                className={`rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${required && !value?.length && "border-red-500"} w-${width}`}
                                disabled={disabled}
                                value={typeof value === "string" ? value : ""}
                                onChange={(e) => {
                                    const cursorPosition = e.target.selectionStart;
                                    const newValue = e.target.value;

                                    // Store cursor position
                                    customTextRef.current.dataset.cursorPosition = cursorPosition;

                                    // Create proper event structure
                                    const customEvent = {
                                        ...e,
                                        value: newValue,
                                        target: {
                                            ...e.target,
                                            name: name,
                                            value: newValue,
                                        },
                                    };

                                    onChange(customEvent);
                                }}
                                required={required}
                                onBlur={onBlur}
                                onClick={onClick}
                                onKeyPress={onKeyPress}
                                {...rest}
                            />
                            <label className="text-[#A2B3C4]" htmlFor={labelFor}>
                                {label}
                            </label>
                        </>
                    )}
                    {!inputGroup && type === "number" && (
                        <>
                            <InputText id={id} name={name} className={`rounded-md ${required && !value?.length && "p-invalid"} w-${width}`} disabled={disabled} value={value == null ? "" : value} onChange={onChange} required={required} onBlur={onBlur} onClick={onClick} autoComplete="on" />
                            <label className="text-[#A2B3C4]" htmlFor={labelFor}>
                                {label}
                            </label>
                        </>
                    )}

                    {!inputGroup && type === "numbers" && (
                        <>
                            <TextField
                                type="number"
                                value={fixedNumber(numbers)}
                                required={required}
                                variant="outlined"
                                onChange={(e) => {
                                    let newValue = e.target.value;
                                    if (typeof min === "number" || typeof max === "number") {
                                        if (typeof min === "number" && newValue < min) return;
                                        if (typeof max === "number" && newValue > max) return;
                                    }
                                    const roundedValue = !maxFractionDigits ? newValue : Math.round(newValue * Math.pow(10, maxFractionDigits)) / Math.pow(10, maxFractionDigits);
                                    setNumbers(roundedValue ? Number(roundedValue) : roundedValue);
                                    return onChange({
                                        ...e,
                                        value: roundedValue ? Number(roundedValue) : roundedValue,
                                        target: {
                                            ...e.target,
                                            value: roundedValue ? Number(roundedValue) : roundedValue,
                                        },
                                    });
                                }}
                                onFocus={() => {
                                    value ? setNumbers(value) : setNumbers("");
                                    // handleFocus();
                                    onFocus && onFocus();
                                }}
                                id={id}
                                label={label}
                                name={name}
                                onBlur={(e) => {
                                    setNumbers(value ? value : 0);
                                    onBlur && onBlur(e);
                                }}
                                onClick={onClick}
                                fullWidth
                                inputMode={mode || "decimal"}
                                className="p-inputtext border-red-500 sortable-handler numberFieldID"
                                autoComplete={"true"}
                                InputProps={{
                                    style: {
                                        height: 36,
                                        fontSize: "12px", // Normal font size
                                        fontWeight: "normal", // Normal font weight
                                    },
                                    pattern: "[0-9]*",
                                    step: "any",
                                    max: min,
                                    min: max,
                                }}
                                InputLabelProps={{
                                    className: `${required && !value && "!border-red-500"} w-${width}`,
                                    style: {
                                        fontSize: "12px",
                                        fontWeight: "normal",
                                    },
                                }}
                                size="small"
                                sx={{
                                    ...(required && !value ? requiredStyle : style),
                                    "& .MuiOutlinedInput-root": {
                                        fontSize: "12px",
                                        fontWeight: "normal",
                                        "& fieldset": {
                                            borderWidth: "1px", // Thin border like PrimeReact
                                        },
                                        "&:hover fieldset": {
                                            borderWidth: "1px",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderWidth: "2px",
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        fontSize: "12px",
                                        fontWeight: "normal",
                                    },
                                }}
                                onKeyDown={(event) => {
                                    !maxFractionDigits && event.key === "." && event.preventDefault();
                                    if (event.key === "Backspace" && event.target.value === "0") {
                                        setNumbers("");
                                    }
                                }}
                                onPaste={(event) => {
                                    event.preventDefault();
                                    let pasteData = event.clipboardData?.getData("text") || "";
                                    pasteData = String(pasteData).replace(/[^0-9.-]/g, "");
                                    if (maxFractionDigits !== undefined && pasteData.includes(".")) {
                                        const [wholePart, fractionPart = ""] = pasteData.split(".");
                                        pasteData = `${wholePart}.${fractionPart.slice(0, maxFractionDigits)}`;
                                    }
                                    if (pasteData === "" || pasteData === "-" || pasteData === "." || pasteData === "-.") {
                                        setNumbers("");
                                        onChange({
                                            value: "",
                                            target: { name, value: "" },
                                        });
                                        return;
                                    }
                                    const numericValue = Number(pasteData);
                                    if (Number.isNaN(numericValue)) return;
                                    if (typeof min === "number" && numericValue < min) return;
                                    if (typeof max === "number" && numericValue > max) return;
                                    setNumbers(numericValue);
                                    onChange({
                                        value: numericValue,
                                        target: { name, value: numericValue },
                                    });
                                }}
                                disabled={disabled || readOnly}
                                step="any"
                                inputRef={numberInputRef}
                                {...rest}
                            />
                        </>
                    )}

                    {!inputGroup && type === "numberFix" && (
                        <div className="">
                            {label && (
                                <label htmlFor={labelFor} className="block text-sm font-medium text-gray-700 mb-1">
                                    {label}
                                </label>
                            )}
                            <input
                                type="text"
                                id={id}
                                name={name}
                                value={inputValue}
                                onChange={handleNumberFixChange}
                                onBlur={handleNumberFixBlur}
                                onFocus={handleNumberFixFocus}
                                onClick={onClick}
                                onKeyDown={handleNumberFixKeyDown}
                                disabled={disabled || readOnly}
                                className={`w-full px-4 py-3 border rounded-md ${required && !inputValue && inputValue !== 0 ? "border-red-500" : "border-gray-300"}`}
                                style={{ width: width ? `${width}px` : "100%", maxWidth: "500px" }}
                                ref={inputRef}
                                placeholder={placeholder}
                                {...rest}
                            />
                            {required && !inputValue && inputValue !== 0 && <p className="text-sm text-red-500 mt-1">This field is required.</p>}
                        </div>
                    )}

                    {!inputGroup && type === "password" && (
                        <>
                            <Password
                                id={id}
                                name={name}
                                className={`rounded-md ${required && !value?.length && "border-red-500"} w-${width}`}
                                disabled={disabled}
                                value={value == null ? "" : value}
                                onChange={onChange}
                                required={required}
                                onBlur={onBlur}
                                onClick={onClick}
                                feedback={false}
                                autoComplete={autoComplete || "off"}
                                inputClassName={`rounded-md ${required && !value?.length && "border-red-500"} w-${width}`}
                            />
                            <label className="text-[#A2B3C4]" htmlFor={labelFor}>
                                {label}
                            </label>
                        </>
                    )}

                    {type === "textarea" && (
                        <>
                            <InputTextarea
                                autoResize
                                rows={rows ?? "5"}
                                cols={cols ?? "30"}
                                id={id}
                                name={name}
                                className={`rounded-md ${required && !value && "border-red-500"} w-${width}`}
                                disabled={disabled}
                                value={value == null ? "" : value}
                                onChange={onChange}
                                required={required}
                                onBlur={onBlur}
                            />
                            <label htmlFor={labelFor}>{label}</label>
                        </>
                    )}

                    {type === "select" && (
                        <div className="relative p-float-label w-full">
                            <AutoComplete
                                dropdown
                                suggestions={autoFilteredValue}
                                completeMethod={autoCompleteMethod}
                                field={autoCompleteFieldName || "label"}
                                id={id}
                                name={name}
                                className={`rounded-md w-${width} ${required && !value?.length && !value?.[autoCompleteFieldName || "label"]?.length && "autoComplete-red"}`}
                                disabled={disabled}
                                value={value == null ? "" : value}
                                onChange={onChange}
                                ref={ref}
                                onBlur={onBlur}
                                autoHighlight
                                onSelect={onSelect}
                                onClick={onClick}
                                defaultValue={defaultValue}
                                dropdownAutoFocus
                                required={required}
                                size={1}
                                forceSelection
                                {...rest}
                            />
                            <label htmlFor={labelFor}>{label}</label>
                        </div>
                    )}

                    {type === "multiselect" && renderMultiSelect}

                    {type === "listbox" && (
                        <>
                            <ListBox value={value} options={listValue} onChange={onChange} optionLabel="name" />
                        </>
                    )}

                    {type === "date" && !showTime && !timeOnly && !dateWriteAble && (
                        <>
                            <Calendar
                                showIcon
                                showButtonBar={timeOnly && false}
                                className={`rounded-md ${required && !value && "border-red-500"} w-${width}`}
                                required={required}
                                value={value}
                                onChange={(e) => {
                                    const userValue = e?.value || e.target?.value;
                                    const localTime = Number(process.env.REACT_APP_LOCAL_TIME);

                                    if (selectionMode === "range") {
                                        return onChange({
                                            ...e,
                                            value: userValue,
                                            target: {
                                                ...e.target,
                                                value: userValue,
                                            },
                                            originalEvent: {
                                                ...e,
                                                name: id,
                                            },
                                        });
                                    }

                                    if (selectionMode === "multiple") {
                                        const userValue = e?.value || e.target?.value;
                                        const convertedTime = userValue.map((value) => {
                                            return new Date(value);
                                        });
                                        const sixHoursLater = convertedTime.map((value) => {
                                            return showTime || timeOnly ? value : new Date(value.setHours(value.getHours() + localTime));
                                        });
                                        return onChange({
                                            ...e,
                                            value: !userValue ? [] : sixHoursLater,
                                            target: {
                                                ...e.target,
                                                value: !userValue ? [] : sixHoursLater,
                                            },
                                            originalEvent: {
                                                ...e,
                                                name: id,
                                            },
                                        });
                                    }

                                    const selectedDate = e?.value || e.target?.value;
                                    if (selectedDate === null) {
                                        return onChange({
                                            ...e,
                                            value: null,
                                            target: {
                                                ...e.target,
                                                value: null,
                                            },
                                            originalEvent: {
                                                ...e,
                                                name: id,
                                            },
                                        });
                                    }

                                    const userData = new Date(e?.value || e.target?.value);
                                    const sixHoursLater = new Date(userData.setHours(userData.getHours() + localTime));
                                    return onChange({
                                        ...e,
                                        value: showTime || timeOnly ? userValue : sixHoursLater,
                                        target: {
                                            ...e.target,
                                            value: showTime || timeOnly ? userValue : sixHoursLater,
                                        },
                                        originalEvent: {
                                            ...e,
                                            name: id,
                                        },
                                    });
                                }}
                                id={id}
                                name={name}
                                disabled={disabled}
                                onClick={onClick}
                                onBlur={onBlur}
                                onSelect={onSelect}
                                monthNavigator
                                yearNavigator
                                yearRange="1900:2050"
                                dateFormat="dd/mm/yy"
                                selectionMode={selectionMode}
                                hideOnRangeSelection={selectionMode === "range"}
                                readOnlyInput={readOnlyInput}
                                maxDate={maxDate}
                                minDate={minDate}
                                timeOnly={timeOnly}
                                showTime={showTime}
                                showOnFocus
                                hourFormat={hourFormat || "12"}
                                input={true}
                                {...rest}
                            />
                            <label className="text-[#A2B3C4]" htmlFor={labelFor}>
                                {label}
                            </label>
                        </>
                    )}

                    {type === "date" && showTime && !timeOnly && !dateWriteAble && (
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            {dialog ? (
                                <DateTimeField
                                    {...rest}
                                    className={`rounded-md ${required && !value && "!border-red-500"} w-${width} `}
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                            sx: {
                                                ...dateTimeStyle,
                                            },
                                        },
                                    }}
                                    id={id}
                                    name={name}
                                    clearable
                                    label={label}
                                    placeholder={label}
                                    disabled={disabled}
                                    maw={400}
                                    mx="auto"
                                    my="auto"
                                    format="DD/MM/YYYY hh:mm:ss a"
                                    ampm
                                    ampmInClock
                                    required={required}
                                    value={value ? moment(value) : null}
                                    onChange={(e) => {
                                        return onChange({
                                            ...e,
                                            value: e?._d,
                                            target: {
                                                ...e,
                                                value: e?._d,
                                            },
                                            originalEvent: {
                                                ...e,
                                                name: id,
                                            },
                                        });
                                    }}
                                />
                            ) : (
                                <DateTimePicker
                                    {...rest}
                                    className={`rounded-md ${required && !value && "!border-red-500"} w-${width} `}
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                            sx: {
                                                ...dateTimeStyle,
                                            },
                                        },
                                    }}
                                    id={id}
                                    name={name}
                                    clearable
                                    label={label}
                                    placeholder={label}
                                    disabled={disabled}
                                    maw={400}
                                    mx="auto"
                                    my="auto"
                                    format="DD/MM/YYYY hh:mm:ss a"
                                    ampm
                                    ampmInClock
                                    required={required}
                                    value={value ? moment(value) : null}
                                    onChange={(e) => {
                                        return onChange({
                                            ...e,
                                            value: e?._d,
                                            target: {
                                                ...e,
                                                value: e?._d,
                                            },
                                            originalEvent: {
                                                ...e,
                                                name: id,
                                            },
                                        });
                                    }}
                                />
                            )}
                        </LocalizationProvider>
                    )}

                    {type === "date" && !showTime && timeOnly && !dateWriteAble && (
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <TimePicker
                                {...rest}
                                className={`rounded-md ${required && !value && "!border-red-500"} w-${width} `}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: {
                                            ...dateTimeStyle,
                                        },
                                    },
                                    popper: {
                                        disablePortal: false,
                                        placement: "bottom-start",
                                        modifiers: [
                                            {
                                                name: "flip",
                                                enabled: true,
                                                options: {
                                                    altBoundary: true,
                                                    rootBoundary: "viewport",
                                                    padding: 8,
                                                    fallbackPlacements: [
                                                        "top-start",
                                                        "bottom-end",
                                                        "top-end",
                                                    ],
                                                },
                                            },
                                            {
                                                name: "preventOverflow",
                                                enabled: true,
                                                options: {
                                                    altAxis: true,
                                                    altBoundary: true,
                                                    tether: false,
                                                    rootBoundary: "viewport",
                                                    padding: 8,
                                                },
                                            },
                                        ],
                                        sx: {
                                            zIndex: 20000,
                                            "& .MuiPaper-root": {
                                                zIndex: 20000,
                                            },
                                        },
                                    },
                                    desktopPaper: {
                                        sx: {
                                            zIndex: 20000,
                                            maxHeight: 260,
                                            overflow: "hidden",
                                            "& .MuiMultiSectionDigitalClock-root": {
                                                maxHeight: 220,
                                            },
                                            "& .MuiMultiSectionDigitalClock-root ul": {
                                                maxHeight: 220,
                                                overflowY: "auto",
                                            },
                                        },
                                        // sx: { zIndex: 20000 },
                                    },
                                    mobilePaper: {
                                        sx: { zIndex: 20000 },
                                    },
                                    dialog: {
                                        sx: { zIndex: 20000 },
                                    },
                                }}
                                id={id}
                                name={name}
                                clearable
                                required={required}
                                label={label}
                                placeholder={label}
                                disabled={disabled}
                                maw={400}
                                mx="auto"
                                my="auto"
                                format="hh:mm:ss a"
                                ampm
                                ampmInClock
                                value={value ? moment(value) : null}
                                onChange={(e, d) => {
                                    return onChange({
                                        ...e,
                                        value: e?._d,
                                        target: {
                                            ...e,
                                            value: e?._d,
                                        },
                                        originalEvent: {
                                            ...e,
                                            name: id,
                                        },
                                    });
                                }}
                            />
                        </LocalizationProvider>
                    )}

                    {type === "date" && showTime && !timeOnly && dateWriteAble && (
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <DatePicker
                                {...rest}
                                className={`rounded-md ${required && !value && "!border-red-500"} w-${width} `}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: {
                                            ...dateTimeStyle,
                                        },
                                    },
                                }}
                                id={id}
                                name={name}
                                clearable
                                label={label}
                                placeholder={label}
                                disabled={disabled}
                                maw={400}
                                mx="auto"
                                my="auto"
                                format="DD/MM/YYYY"
                                required={required}
                                value={value ? moment(value) : null}
                                onChange={(e) => {
                                    const newValue = e ? e._d : null;
                                    onChange({
                                        target: {
                                            name: name,
                                            value: newValue,
                                        },
                                    });
                                }}
                            />
                        </LocalizationProvider>
                    )}

                    {type === "translate" && (
                        <>
                            <div className="p-inputgroup ">
                                <div className="p-float-label">
                                    <InputText className={`rounded-md ${required && !value?.length && "border-red-500"} w-${width}`} />
                                    <label className="text-[#A2B3C4]" htmlFor={labelFor}>
                                        {label}
                                    </label>
                                    <button type="" icon={<MdOutlineGTranslate />} className="bg-gray-500 text-2xl" onClick={translateHandler} />
                                </div>
                            </div>
                        </>
                    )}

                    {type === "switch" && (
                        <div className={!switchClassName ? `border border-gray-400 grid grid-cols-${label ? 2 : 1} p-3 rounded-md bg-white` : switchClassName}>
                            {label && <p className="text-gray-600  ">{label}</p>}
                            <div className={label ? "justify-self-end" : "justify-self-center"}>
                                <InputSwitch checked={switchChecked || false} onChange={setSwitchChecked} id={id} name={name} value={value} />
                            </div>
                        </div>
                    )}

                    {type === "checkbox" && (
                        <>
                            <Checkbox inputId={id} name={name} value={value} checked={checked} onChange={onChange} />
                            <label htmlFor={labelFor} className={className}>
                                {label}
                            </label>
                        </>
                    )}

                    {inputGroup && type === "text" && (
                        <div className="col-12 md:col-4 rounded-md">
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">
                                    <i className={inputGroupIcon}></i>
                                </span>
                                <span className="p-float-label">
                                    <InputText id={id} name={name} className={`rounded-md ${required && !value?.length && "border-red-500"} w-${width} `} disabled={disabled} value={value == null ? "" : value} onChange={onChange} required={required} onBlur={onBlur} onClick={onClick} />
                                    <label className="text-[#A2B3C4]" htmlFor={labelFor}>
                                        {label}
                                    </label>
                                </span>
                            </div>
                        </div>
                    )}

                    {inputGroup && type === "password" && (
                        <div className="col-12 md:col-4">
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">
                                    <i className={inputGroupIcon}></i>
                                </span>
                                <span className="p-float-label">
                                    <Password
                                        id={id}
                                        name={name}
                                        className={`${required && !value?.length && "border-red-500"} w-${width}`}
                                        disabled={disabled}
                                        value={value == null ? "" : value}
                                        onChange={onChange}
                                        required={required}
                                        onBlur={onBlur}
                                        onClick={onClick}
                                        feedback={false}
                                        inputClassName={` ${required && !value?.length && "border-red-500"} w-${width}`}
                                    />
                                    <label className="text-[#A2B3C4]" htmlFor={labelFor}>
                                        {label}
                                    </label>
                                </span>
                            </div>
                        </div>
                    )}
                </span>
            )}

            {type === "image" && (
                <>
                    <div className={`flex flex-col w-full  border-2 border-dashed ${required && !imagePreview ? "border-red-500 hover:bg-gray-100 hover:border-gray-300" : "border-gray-400 hover:bg-gray-100 hover:border-gray-300"} rounded `}>
                        {imagePreview ? (
                            <div className="imageBox flex flex-col items-center justify-center">
                                <img className="object-cover  w-32 h-32" src={imagePreview} alt="" />
                                <button type="button" onClick={setImagePreview} className="text-red-600 text-center text-sm deleteButton px-2 py-2">
                                    <i className="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        ) : (
                            <label className="imageBox p-2">
                                <div className="flex flex-col items-center justify-center pt-7">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                    <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">{label}</p>
                                </div>
                                <input accept="image/*" pattern="([^\\s]+(\\.(?i)(jpe?g|png|gif|bmp))$)" name={name} id={id} type="file" className="opacity-0" onChange={onChange} onBlur={onBlur} required={required} />
                            </label>
                        )}
                    </div>
                </>
            )}

            {type === "file" && (
                <>
                    <div className={`flex flex-col w-full  border border-solid ${required && !filePreview ? "border-red-400 hover:bg-red-100 hover:border-red-300 " : "border-gray-400 hover:bg-gray-100 hover:border-gray-300"} rounded-lg `}>
                        <label className={`imageBox p-${fileUploadPadding || "2"} h-${height}`}>
                            <div className={`flex items-center justify-center pt-${padding || "7"} gap-2`}>
                                <MdOutlineFilePresent className="text-3xl  font-light text-center" />
                                <p className="p- text-md tracking-wider text-gray-600 group-hover:text-gray-600 bg-cyan-400 rounded-md">Attach File</p>
                            </div>
                            <input name={name} id={id} type="file" className="opacity-0" onChange={onChange} onBlur={onBlur} multiple required={required} accept={accept} />
                        </label>
                    </div>
                </>
            )}

            {type === "file2" && (
                <>
                    <div className={`flex flex-col w-full  border border-solid ${required && !filePreview ? "border-red-400 hover:bg-red-100 hover:border-red-300 " : "border-gray-400 hover:bg-gray-100 hover:border-gray-300"} rounded-lg `}>
                        <label className={`imageBox h-12 p-${fileUploadPadding || "2"} `}>
                            <div className="flex items-center justify-center -mt-0 gap-2">
                                <MdOutlineFilePresent className="text-3xl  font-light " />
                                <p className="p-1 text-md tracking-wider text-gray-600 group-hover:text-gray-600 bg-cyan-400 rounded-md">Attach File</p>
                            </div>
                            <input name={name} id={id} type="file" className="opacity-0" onChange={onChange} onBlur={onBlur} multiple required={required} accept={accept} />
                        </label>
                    </div>
                </>
            )}

            {type === "pickList" && (
                <div className="picklist-demo">
                    <div className="card">
                        <PickList
                            source={picklistSourceValue}
                            target={picklistTargetValue}
                            sourceHeader={sourceHeader}
                            targetHeader={targetHeader}
                            itemTemplate={(item) => <div>{item.name}</div>}
                            onChange={(e) => {
                                !onChange ? setPicklistSourceValue(e.source) : onChange(e);
                                !onChange ? setPicklistTargetValue(e.target) : onChange(e);
                            }}
                            sourceStyle={{ height: "342px" }}
                            targetStyle={{ height: "342px" }}
                            showTargetControls={false}
                            showSourceControls={false}
                            showSourceFilter
                            filterBy="name"
                            sourceFilterPlaceholder="Search"
                            targetFilterPlaceholder="Search"
                            {...rest}
                        ></PickList>
                    </div>
                </div>
            )}

            {type === "radio" && (
                <>
                    <div className="p-radiobutton">
                        {radioBtnmap.map(({ label, value: radioValue, checked, onChange: radioOnChange }, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <RadioButton inputId={`${id}-${index}`} name={name} value={radioValue} checked={checked} onChange={radioOnChange} className="ml-2" />
                                <label htmlFor={`${labelFor}-${index}`} className={`p-radiobutton-label`}>
                                    {label}
                                </label>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );
};
