import { CommonButton } from "components/Buttons/Buttons";
import { AiOutlineEye } from "react-icons/ai";
import { FiEdit } from "react-icons/fi";
import { FaTrash } from "react-icons/fa";

export const actionButtonTemp = (rowData, { deleteFunc, editFunc, viewFunc }, permission) => {
    return (
        <div className=" flex justify-center text-center">
            {/* View button */}
            {viewFunc && <CommonButton icon={<AiOutlineEye className="text-green-700 text-2xl" />} className="p-button-rounded p-mr-2 action-button-green" onClick={() => viewFunc(rowData)} title="view"/>}
            {/* Update Button */}
            {editFunc && permission?.canEdit && <CommonButton icon={<FiEdit className="text-green-700 text-lg" />} className="p-button-rounded p-mr-2 action-button-green" onClick={() => editFunc(rowData)} title="edit"/>}
            {/* Delete Button */}
            {deleteFunc && permission?.canDelete && <CommonButton icon={<FaTrash className="text-red-700 text-lg" />} className="p-button-rounded bg-red-100 p-mr-2 action-button-red" onClick={() => deleteFunc(rowData)} title="delete"/>}
        </div>
    );
};

export default actionButtonTemp;
