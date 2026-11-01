import { Dialog } from "primereact/dialog";
import { CommonButton } from "components/Buttons/Buttons";

const InactivityLogoutModal = ({ visible, onClose }) => {
    return (
        <Dialog
            visible={visible}
            modal
            closable={false}
            closeOnEscape={false}
            blockScroll
            dismissableMask={false}
            header="Session Expired"
            style={{ width: "520px", maxWidth: "95vw", zIndex: 12000 }}
            className="inactivity-logout-dialog"
            footer={<CommonButton label="Sign In" icon="pi pi-sign-in" className="p-button-raised p-button-primary" onClick={onClose} />}
        >
            <div className="space-y-3 py-1">
                <p className="font-semibold text-lg text-gray-800">You have been logged out due to inactivity.</p>
                <p className="text-gray-600 leading-relaxed">
                    For security reasons, your session has expired because there was no activity for a while. Please click the Sign In button to sign in again and continue.
                </p>
            </div>
        </Dialog>
    );
};

export default InactivityLogoutModal;
