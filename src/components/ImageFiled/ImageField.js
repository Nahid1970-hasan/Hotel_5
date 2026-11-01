import React, { useState } from "react";

const ImageField = ({ selectedImage, onSelectFile, editedMaterial }) => {
    /* const imageList = editedMaterial?.imageInformation;
    //Console.log("emi", imageList);
    let imageArray = [];
    const image = imageList?.map((i) => {8
        imageArray.push(i.imagePath);
    });
    //Console.log("object"); */

    return (
        <div>
            {/* this image field for capture multiple image */}
            <div className="col-span-1  ">
                <label class="flex flex-col w-full h-28 border-2 border-dashed  hover:bg-gray-100 hover:border-gray-300">
                    <div class="flex flex-col items-center justify-center pt-7">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-400 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                        </svg>
                    </div>

                    {selectedImage?.length < 7 ? (
                        <div>
                            <p class="pt-1 text-sm tracking-wider text-gray-400 text-center group-hover:text-gray-600">Only {7 - selectedImage.length} Images can add</p>
                            <div>
                                <input accept="image/png, image/jpeg" name="imageList" id="input" onChange={onSelectFile} type="file" class="opacity-0" multiple />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p class="pt-1 text-sm tracking-wider text-red-600 text-center group-hover:text-gray-600">no more image can add . please delete extra{selectedImage?.length - 7} image</p>
                            <div></div>
                        </div>
                    )}
                </label>
            </div>
        </div>
    );
};

export default ImageField;
