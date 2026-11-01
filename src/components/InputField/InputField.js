import { FormControl, FormControlLabel, MenuItem, Radio, RadioGroup, Select, TextField } from "@mui/material";
import React, { useState, useEffect } from "react";
import styles from "./inputField.module.css";
import { alpha, styled } from "@mui/material/styles";
const InputField2 = ({ register, width, widthXl, widthLg, widthMd, fullWidth, isRequired, type, message, fieldName, label, dropValue, values, defaultValue, isMultiline, ...rest }) => {
    const handleChange = (event) => {
        rest.setDropValue(event.target.value);
    };

    const CssTextField = styled(TextField)({
        background: "white",
        "& label.Mui-focused": {
            color: "green",
        },
        "& .MuiInput-underline:after": {
            borderBottomColor: "green",
        },

        "& .MuiOutlinedInput-root": {
            "& fieldset": {
                borderColor: "red",
            },
            "&.Mui-focused fieldset": {
                borderColor: "green",
            },
        },
    });
    return (
        <>
            {type !== "select" ? (
                <div>
                    {isMultiline ? (
                        <div>
                            {isRequired ? (
                                <CssTextField fullWidth id="custom-css-outlined-input" helperText={message} label={label} type={type} variant="outlined" {...register(`${fieldName}`, { required: isRequired, maxLength: 50 })} {...rest} defaultValue={defaultValue} multiline />
                            ) : (
                                <TextField fullWidth id="outlined-basic" label={label} type={type} variant="outlined" {...register(`${fieldName}`, { required: isRequired, maxLength: 150 })} {...rest} defaultValue={defaultValue} multiline />
                            )}
                        </div>
                    ) : (
                        <div>
                            {isRequired ? (
                                <CssTextField fullWidth id="custom-css-outlined-input" helperText={message} label={label} type={type} variant="outlined" {...register(`${fieldName}`, { required: isRequired, maxLength: 50 })} {...rest} defaultValue={defaultValue} />
                            ) : (
                                <TextField fullWidth id="outlined-basic" label={label} type={type} variant="outlined" {...register(`${fieldName}`, { required: isRequired, maxLength: 150 })} {...rest} defaultValue={defaultValue} />
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {isRequired ? (
                        <CssTextField className={` ${isRequired && styles.borderErrorStyle}bg-white`} id="" label={label} select value={dropValue} {...register(`${fieldName}`, { required: isRequired, maxLength: 20 })} onChange={handleChange} fullWidth>
                            {values?.length &&
                                values?.map((option) => (
                                    <MenuItem key={option.id} selectedValue={defaultValue} value={option.id}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                        </CssTextField>
                    ) : (
                        <TextField className={` ${isRequired && styles.borderErrorStyle} bg-white`} id="" label={label} select value={dropValue} {...register(`${fieldName}`, { required: isRequired, maxLength: 20 })} onChange={handleChange} fullWidth>
                            {values?.length &&
                                values?.map((option) => (
                                    <MenuItem key={option.id} selectedValue={defaultValue} value={option.id}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                        </TextField>
                    )}
                </div>
            )}
        </>
    );
};

export default InputField2;
