export const statusBodyTemplate = (data, props, condition) => {
    // //Console.log(data?.[props?.field])
    const status = data?.[props?.field] || data?.approvalStatus;
    return (
        <>
            <div
                className={`font-semibold px-1 py-2 shadow rounded text-center ${
                    status?.toLowerCase()?.includes("approved") || status?.toLowerCase()?.includes("approve")
                        ? "bg-green-600 text-white "
                        : status?.toLowerCase()?.includes("rejected") || status?.toLowerCase()?.includes("reject")
                        ? "bg-red-600 text-white font-semibold"
                        : status?.toLowerCase()?.split(" ")?.join("").includes("justentry")
                        ? "bg-orange-200 font-semibold"
                        : status?.toLowerCase()?.includes("submitted")
                        ? "bg-gray-200 font-semibold"
                        : status?.toLowerCase()?.includes("pending")
                        ? "bg-yellow-200 font-semibold"
                        : condition
                }`}
            >
                {/* <span className="p-column-title">{props.header}</span> */}
                <span className={`truncate`}>{data?.[props?.field] || data?.approvalStatus}</span>
            </div>
        </>
    );
};
export const approvalStatus = (data, props, condition) => {
    return (
        <>
            <div
                className={`text-center font-semibold ${
                    data?.statusID === 0
                        ? "text-sm text-orange-600 bg-orange-100 p-2"
                        : data?.statusID === 1
                        ? "text-sm text-yellow-600 bg-yellow-100 p-2"
                        : data?.isApproved
                        ? "text-sm text-green-600 bg-green-100 p-2"
                        : data?.statusID % 2 !== 0 && data?.statusID > 1
                        ? "text-sm text-red-600 bg-red-100 p-2"
                        : ""
                }`}
            >
                {data?.approvalStatus || data?.statusDescription || data?.status || data?.statusDesc}
            </div>
        </>
    );
};
