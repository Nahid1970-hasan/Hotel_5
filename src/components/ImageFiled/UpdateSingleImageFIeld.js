import DeleteModal from "components/Modal/DeleteModal";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { userInfo } from "service/login";
import { coreAxios } from "utilities/axios";
import { errorHandler } from "utilities/errorHandler/errorHandler";

const UpdateSingleImageField = ({ defaultFile, setDefaultFile, imageFile, handleImage, defaultImage, editedMaterial, onHide, categoryID }) => {
    // //Console.log("emi", defaultImage);
    // //Console.log("categoryID", categoryID);

    const [loading, setLoading] = useState(false);
    const [deleteID, setDeleteID] = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [mainImage, setMainImage] = useState(false);

    const { EmpID } = userInfo();

    // delete image

    const deleteMaterialImage = (id) => {
        // //Console.log("click", id);
        if (id === null) {
            setDeleteModal(false);
        }
        setDeleteID(id);
        // modal => true

        setDeleteModal(true);
    };
    const confirmDelete = () => {
        // state id
        const dataArray = { createdBy: EmpID, id: deleteID };

        if (dataArray.id !== null) {
            try {
                setLoading(true);
                coreAxios
                    .delete("/api/Material/Image", { data: dataArray })
                    .then(function (res) {
                        if (res.status === 201) {
                            setConfirm(true);
                            toast.success("SuccessFully deleted");
                            hideModal();
                            onHide("displayBasic2");
                            setLoading(false);
                        }
                    })
                    .catch(function (error) {
                        // //Console.log(error);
                        errorHandler(error);
                        setLoading(false);
                    });
            } catch (err) {
                errorHandler(err);
                // //Console.log(err);
            }
        }
        hideModal();

        // api
        // modal false
    };
    const hideModal = () => {
        setDeleteModal(false);
        setDeleteID(null);
    };
    return (
        <div>
            {/* its use for single image field design */}
            <div className="col-span-1">
                <label class="flex flex-col w-full h-30  border-2 border-dashed border-gray-400 hover:bg-gray-100 hover:border-gray-300 rounded">
                    {defaultFile ? (
                        <div>
                            <div className="imageBox">
                                <img className="object-cover  w-32 h-32" src={imageFile} alt="" />
                                <button onClick={() => setDefaultFile(null)} className="text-red-600 text-center text-sm deleteButton">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="imageBox">
                                {defaultImage ? (
                                    <div>
                                        <img className="object-cover  w-32 h-32" src={defaultImage?.imagePath} alt="" />
                                        <button
                                            type="reset"
                                            onClick={(e) => {
                                                deleteMaterialImage(categoryID);
                                            }}
                                            className="text-red-600 text-center text-sm deleteButton"
                                        >
                                            <i class="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div class="flex flex-col items-center justify-center pt-7">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-400 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                        </svg>
                                        <p class="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">Image</p>
                                        <input accept="image/png, image/jpeg" name="imageList" id="input" onChange={(e) => handleImage(e)} type="file" class="opacity-0" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </label>
            </div>
            <DeleteModal loading={loading} visibleModal={deleteModal} item={deleteID} name={deleteID?.categoryName} confirmDelete={confirmDelete} onHide={hideModal} />
        </div>
    );
};

export default UpdateSingleImageField;
