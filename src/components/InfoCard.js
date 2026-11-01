const isTailwindBg = (value) => typeof value === "string" && value.trim().startsWith("bg-");

const InfoCard = ({ title = false, label, icon, backgroundColor, children, className = "", bodyClassName = "grid grid-cols-1 md:grid-cols-4 gap-x-3 p-3" }) => {
    const colorClass = isTailwindBg(backgroundColor) ? backgroundColor.trim() : "";
    const colorStyle = backgroundColor && !colorClass ? { backgroundColor } : undefined;

    return (
        <div className={`rounded-lg border border-gray-200 overflow-hidden ${colorClass || "bg-white"} ${className}`} style={colorStyle}>
            {title && (
                <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 ${colorClass || colorStyle ? "" : "bg-gray-50"}`}>
                    {icon && <i className={`${icon} text-gray-600`} />}
                    <span className="font-semibold text-gray-800">{label}</span>
                </div>
            )}
            <div className={bodyClassName}>{children}</div>
        </div>
    );
};

export { InfoCard };
export default InfoCard;