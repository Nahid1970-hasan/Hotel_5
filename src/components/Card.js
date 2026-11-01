const Card = ({ title, subTitle, children, footer, className = "", bodyClassName = "", onClick }) => {
    return (
        <div className={`bg-white rounded-lg border border-gray-100 shadow-md ${onClick ? "cursor-pointer transition-shadow duration-200 hover:shadow-lg" : ""} ${className}`} onClick={onClick}>
            {(title || subTitle) && (
                <div className="border-b border-gray-100 px-4 py-3">
                    {title && <h3 className="text-base font-semibold text-gray-800">{title}</h3>}
                    {subTitle && <p className="mt-1 text-sm text-gray-500">{subTitle}</p>}
                </div>
            )}
            <div className={`p-4 ${bodyClassName}`}>{children}</div>
            {footer && <div className="border-t border-gray-100 px-4 py-3">{footer}</div>}
        </div>
    );
};

export { Card };
export default Card;
