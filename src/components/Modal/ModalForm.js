import React, { useState, useEffect } from "react";
import "antd/dist/antd.css";
import { Modal, Button } from "antd";
const ModalForm = ({ props }) => {
    const [searchResult, setSearchResult] = useState();
    const [visible, setVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [modalText, setModalText] = useState("Content of the modal");
    const showModal = () => {
        setVisible(true);
    };

    const handleOk = () => {
        setModalText("The modal will be closed after two seconds");
        setConfirmLoading(true);
        setTimeout(() => {
            setVisible(false);
            setConfirmLoading(false);
        }, 2000);
    };

    const handleCancel = () => {
        //Console.log("Clicked cancel button");
        setVisible(false);
    };
    return (
        <div>
            <Modal title="Title" visible={visible} onOk={handleOk} confirmLoading={confirmLoading} onCancel={handleCancel}>
                <p>{modalText}</p>
            </Modal>
        </div>
    );
};

export default ModalForm;
