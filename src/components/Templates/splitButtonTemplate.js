import { SplitButton } from "primereact/splitbutton";

export const splitButtonTemp = (
    rowData,
    { defaultFunc, defaultLabel, defaultIcon, defaultColor, defaultDisabled, defaultVisible, buttonClassName } = {},
    buttonTemplate,
    loading = false,
) => {
    let filteredData = buttonTemplate?.filter(Boolean) || [];
    const defaultButtonClass = `p-button-rounded p-button-sm ${defaultColor || "p-button-success"}`;
    /** @defaultFunc => */
    // */
    return (
        <div className=" flex justify-center text-center">
            <SplitButton
                className={buttonClassName || defaultButtonClass}
                label={defaultLabel || "Action"}
                icon={defaultIcon || undefined}
                onClick={() => defaultFunc && defaultFunc(rowData)}
                model={filteredData}
                disabled={defaultDisabled || false}
                menuClassName={filteredData?.length === 0 && "hidden"}
                loading={loading}
            ></SplitButton>
        </div>
    );
};

export default splitButtonTemp;
