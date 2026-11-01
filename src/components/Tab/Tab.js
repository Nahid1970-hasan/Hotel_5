import { useSelector } from "react-redux";
import { matchPath, useHistory } from "react-router-dom";

const Tab = ({ tab, title, col = "6", pathAt }) => {
    const history = useHistory();
    const pathName = history.location.pathname;
    const locationName = pathName.split("/")[pathAt];
    const { getPermissions } = useSelector((state) => state.userPermissions);
    const filterItemBasedOnPermission = tab.filter((value) => {
        return getPermissions?.permissions?.permissionDetail?.find((value2) => {
            const match = matchPath(value.navigate, {
                path: value2.pageLocation,
                exact: true,
                strict: true,
            });
            return match;
        });
    });

    return (
        <div>
            <div className={`grid xl:grid-cols-${col} lg:grid-cols-${col} grid-cols-1 md:grid-cols-2 gap-3 text-center mb-6 text-lg text-gray-700`}>
                {tab.map(({ btnName, navigate, className, onClick, verifyRouteBased = true, activeState }) => (
                    <div
                        key={btnName}
                        className={` self-center rounded p-4 shadow cursor-pointer ${locationName?.toLowerCase().split(" ").join("") === btnName?.toLowerCase().split(" ").join("") ? "!bg-blue-700  text-white" : "bg-gray-200"} ${className} ${
                            !verifyRouteBased && activeState.toLowerCase().split(" ").join("") === btnName.toLowerCase().split(" ").join("") ? "bg-blue-700  text-black font-semibold" : "bg-gray-200"
                        }`}
                        onClick={() => {
                            if (onClick) return onClick();
                            history.push(navigate);
                        }}
                    >
                        <h3>{btnName}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tab;
