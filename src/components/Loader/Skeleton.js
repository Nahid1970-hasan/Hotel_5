import { Skeleton } from "primereact/skeleton";

const skeleton = (options) => {
    return (
        <div className="flex align-items-center" style={{ height: "17px", flexGrow: "1", overflow: "hidden" }}>
            <Skeleton height="1rem" />
        </div>
    );
};

export default skeleton;
