import { AppContext } from "App";
import AppBreadcrumb from "AppBreadcrumb";
import AppConfig from "AppConfig";
import AppFooter from "AppFooter";
import AppInlineMenu from "AppInlineMenu";
import AppMenu from "AppMenu";
import AppRightMenu from "AppRightMenu";
import AppTopbar from "AppTopbar";
import classNames from "classnames";
// import Messenger from "Messenger";
import PrimeReact from "primereact/api";
import { useContext, useEffect, useRef, useState } from "react";
import { userInfo } from "service/login";
import { coreAxios } from "utilities/axios";
import { errorHandler } from "utilities/errorHandler/errorHandler";

export default function DashboardLayout({ children }) {
    const [menuMode, setMenuMode] = useState("static");
    const [inlineMenuPosition, setInlineMenuPosition] = useState("top");
    const [desktopMenuActive, setDesktopMenuActive] = useState(true);
    const [mobileMenuActive, setMobileMenuActive] = useState(false);
    const [activeTopbarItem, setActiveTopbarItem] = useState(null);
    const [rightMenuActive, setRightMenuActive] = useState(false);
    const [messageMenuActive, setMessageMenuActive] = useState(false);
    const [configActive, setConfigActive] = useState(false);
    const [menuActive, setMenuActive] = useState(false);
    const [inputStyle, setInputStyle] = useState("outlined");
    const [ripple, setRipple] = useState(true);
    const [mobileTopbarActive, setMobileTopbarActive] = useState(false);
    const [menuTheme, setMenuTheme] = useState("light");
    const [topbarTheme, setTopbarTheme] = useState("blue");
    const [theme, setTheme] = useState("indigo");
    const [isInputBackgroundChanged, setIsInputBackgroundChanged] = useState(false);
    const [inlineMenuActive, setInlineMenuActive] = useState({});
    const [searchActive, setSearchActive] = useState(false);
    let currentInlineMenuKey = useRef(null);
    const { isRTL, colorMode, setRTL, setColorMode, setNewThemeLoaded } = useContext(AppContext);
    const [menuItem, setMenuItem] = useState([]);
    let searchClick;
    let topbarItemClick;
    let menuClick;
    let inlineMenuClick;

    const getUserPages = async () => {
        try {
            const { data } = await coreAxios.get(`/api/User/UserRoute?ReferenceDocNameID=1&ReferenceDocID=${userInfo().EmpID}`);
            setMenuItem([
                {
                    label: "Menu",
                    items: data.map((v) => {
                        return {
                            ...v,
                            items: v?.items?.map((item) => {
                                if (item?.items?.length)
                                    return {
                                        ...item,
                                    };
                                delete item.items;
                                return {
                                    ...item,
                                };
                            }),
                        };
                    }),
                },
            ]);
        } catch (error) {
            errorHandler(error.response);
        }
    };

    useEffect(() => {
        getUserPages();
    }, []);

    useEffect(() => {
        const fetchThemeSettings = async () => {
            const userID = localStorage.getItem("userID");
            try {
                const { data } = await coreAxios.get(`/api/User/GetUserThemelayout?UserID=${userID}`);
                setColorMode(data.layoutMode || "dark");
                setMenuMode(data.menuMode || "static");
                setInlineMenuPosition(data.menuPosition || "top");
                setInputStyle(data.inputBackground || "outlined");
                setRipple(data.rippleEffect === 1);
                setRTL(data.rtlEffect === 1);
                setMenuTheme(data.menuThemes || "light");
                setTopbarTheme(data.topbarThemes || "blue");
                const componentTheme = data.componentThemes || "indigo";
                setTheme(componentTheme);
                onThemeChange(componentTheme);
                const scale = data.layoutScale ? parseInt(data.layoutScale, 10) : 11;
                document.documentElement.style.fontSize = scale + "px";
                localStorage.setItem("layoutScale", scale.toString());
            } catch (err) {
                errorHandler(err);
            }
        };

        fetchThemeSettings();
    }, []);

    // const sideMenu = menuItem;

    const routes = [
        { parent: "", label: "" },
        { parent: "Favorites", label: "Dashboard Analytics" },
        { parent: "UI Kit", label: "Form Layout" },
        { parent: "UI Kit", label: "Input" },
        { parent: "UI Kit", label: "Float Label" },
        { parent: "UI Kit", label: "Invalid State" },
        { parent: "UI Kit", label: "Button" },
        { parent: "UI Kit", label: "Table" },
        { parent: "UI Kit", label: "List" },
        { parent: "UI Kit", label: "Panel" },
        { parent: "UI Kit", label: "Tree" },
        { parent: "UI Kit", label: "Overlay" },
        { parent: "UI Kit", label: "Menu" },
        { parent: "UI Kit", label: "Message" },
        { parent: "UI Kit", label: "File" },
        { parent: "UI Kit", label: "Chart" },
        { parent: "UI Kit", label: "Misc" },
        { parent: "Utilities", label: "Display" },
        { parent: "Utilities", label: "Elevation" },
        { parent: "Utilities", label: "Flexbox" },
        { parent: "Utilities", label: "Icons" },
        { parent: "Utilities", label: "Widgets" },
        { parent: "Utilities", label: "Grid" },
        { parent: "Utilities", label: "Spacing" },
        { parent: "Utilities", label: "Typography" },
        { parent: "Utilities", label: "Text" },
        { parent: "Pages", label: "Crud" },
        { parent: "Pages", label: "Calendar" },

        { parent: "Pages", label: "AddCategory" },
        { parent: "HRM", label: "Employees" },
        { parent: "HRM", label: "Discontinue" },
        { parent: "HRM", child: "Employee", label: "Personal" },
        { parent: "HRM", label: "View Employee" },
        { parent: "HRM", label: "Shift" },
        { parent: "HRM", label: "Attendence" },
        { parent: "HRM", label: "Department" },
        { parent: "HRM", label: "Designation" },
        { parent: "HRM", label: "Worker-List" },
        { parent: "HRM", label: "Employee-Confirmation-Dashboard" },
        { parent: "HRM", label: "Section" },
        { parent: "HRM", label: "Line" },
        { parent: "HRM", label: "Floor" },
        { parent: "HRM", label: "Unit" },
        { parent: "HRM", label: "Emp_MonthlyAttendance" },
        { parent: "HRM", label: "Add-Tiffin-Rules" },
        { parent: "HRM", label: "Tiffin-Rules" },
        { parent: "HRM", label: "Add-Salary-Rules" },
        { parent: "HRM", label: "Update-Salary-Rules" },
        { parent: "HRM", label: "Salary-Rules" },
        { parent: "HRM", label: "Shift" },
        { parent: "HRM", label: "Shift-Entry" },
        { parent: "HRM", label: "Shift-Update" },
        { parent: "HRM", label: "Employee-Type" },
        { parent: "HRM", label: "Company-Permission" },
        { parent: "HRM", label: "Style-Dashboard" },
        { parent: "HRM", label: "Arear" },
        { parent: "HRM", label: "Appraisal-Increment" },
        { parent: "HRM", label: "Production" },
        { parent: "HRM", label: "Leave-Reconfirm" },
        { parent: "HRM", label: "Bonus" },
        { parent: "HRM", label: "Salary-Wise-Bonus-Configuration" },
        { parent: "HRM", label: "Salary-Advance" },
        { parent: "HRM", label: "Salary-Advance-Approval" },
        { parent: "HRM", label: "Fair-Shop-Deduct" },
        { parent: "HRM", label: "Loan" },
        { parent: "HRM", label: "Loan-Approval" },
        { parent: "HRM", label: "Loan-Schedule-Dashboard" },
        { parent: "HRM", label: "Unpaid-Loan-Dashboard" },
        { parent: "HRM", label: "Leave-Master" },
        { parent: "HRM", label: "Leave-Apply" },
        { parent: "HRM", label: "OSD" },
        { parent: "HRM", label: "OSD-Approval" },
        { parent: "HRM", label: "Leave-Approval" },
        { parent: "HRM", label: "Holiday" },
        { parent: "HRM", label: "Holiday-Details" },
        { parent: "HRM", label: "Discontinue" },
        { parent: "HRM", label: "Salary-Deduction" },
        { parent: "HRM", label: "General-Duty" },
        { parent: "HRM", label: "Monthly-Shift-Configuration" },
        { parent: "HRM", label: "Manually-Emp-Monthly-Attendance" },
        { parent: "HRM", label: "Manually-Attendance-Request-User" },
        { parent: "HRM", label: "Manually-Attendance-Request-User-Approval" },
        { parent: "HRM", label: "Manual-Attendance-Entry" },
        { parent: "HRM", label: "Unpaid-Schedule-Deduction" },
        { parent: "HRM", label: "schedule-deduction-details" },
        { parent: "HRM", label: "Schedule-Deduction" },
        { parent: "HRM", label: "Unpaid-Schedule-Deduction" },
        { parent: "HRM", label: "Schedule-Deduction-Pause-Dashboard" },
        { parent: "HRM", label: "Schedule-Deduction-Pause-Approval" },
        { parent: "HRM", label: "unpaid-deduction-approval" },
        { parent: "HRM", label: "Loan-Pause-Approval" },
        { parent: "HRM", label: "Loan-Pause-Dashboard" },
        { parent: "HRM", label: "Final-Settlement" },
        { parent: "HRM", label: "Job-Card" },
        { parent: "HRM", label: "Pay-Slip" },
        { parent: "HRM", label: "Discontinue-Employee" },
        { parent: "HRM", label: "Manual-Attendance-Request-Dashboard" },
        { parent: "HRM", label: "Kpi-Template-Dashboard" },
        { parent: "HRM", label: "Kpi-Dashboard" },
        { parent: "HRM", label: "My-Attendance" },
        { parent: "HRM", label: "Department-Wise" },
        { parent: "HRM", label: "Manual-Attendance-Approval" },
        { parent: "HRM", label: "Employee-Tax-Challan" },
        { parent: "HRM", label: "Fair-Shop-Deduct" },
        { parent: "HRM", label: "Upload-Hr-Data" },
        { parent: "HRM", label: "Night-Bill-Rules" },
        { parent: "HRM", label: "Leave-Form-Report" },
        { parent: "HRM", label: "Leave-Status-Report" },
        { parent: "HRM", label: "Increament-Letter" },
        { parent: "HRM", label: "Increament-Letter-English" },
        { parent: "HRM", label: "Festival-Bonus" },
        { parent: "HRM", label: "Top-Sheet" },
        { parent: "HRM", label: "Monthly-Salary-Top-Sheet" },
        { parent: "HRM", label: "Monthly-Extra-Ot-Sheet" },
        { parent: "HRM", label: "Salary-Wise-Report" },
        { parent: "HRM", label: "Salary-Process" },
        { parent: "HRM", label: "Production-Entry" },
        { parent: "HRM", label: "Style-Wise-Production" },
        { parent: "HRM", label: "Style-Wise-Process-Dashboard" },
        { parent: "HRM", label: "Style-Wise-Pcs-Rate-Dashboard" },
        { parent: "HRM", label: "No-Work-Dashboard" },
        { parent: "HRM", label: "Process" },
        { parent: "HRM", label: "Sub-Process" },
        { parent: "HRM", label: "Production-Collection" },
        { parent: "HRM", label: "Production-Rate-Without-Card" },
        { parent: "HRM", label: "Daily-Production-Sheet" },
        { parent: "HRM", label: "Daily-Production-Sheet-Summary" },
        { parent: "HRM", label: "Absent-But-Production" },
        { parent: "HRM", label: "Present-But-No-Production" },
        { parent: "HRM", label: "Production-Card-Rate" },
        { parent: "HRM", label: "Style-Wise-Production-Summary" },
        { parent: "HRM", label: "Maternity-Bill-Dashboard" },
        { parent: "HRM", label: "Earn-Leave-Payment-Process" },
        { parent: "HRM", label: "Employee-Wise-Daily-Production-Sheet" },
        { parent: "HRM", label: "Pcs-Rate-Salary" },
        { parent: "HRM", label: "Production-Create" },
        { parent: "HRM", label: "Present-Employee-List" },
        { parent: "HRM", label: "Late-Employee-List" },
        { parent: "HRM", label: "Employee-Profile" },
        { parent: "HRM", label: "Daily-Man-Power" },
        { parent: "HRM", label: "Attendance-Summary" },
        { parent: "HRM", label: "Lunch-Allocate-Dashboard" },
        { parent: "HRM", label: "Lunch-Pause-Request-Dashboard" },
        { parent: "HRM", label: "Daily-Lunch-Dashboard" },
        { parent: "HRM", label: "My-Employment-Info" },
        { parent: "HRM", label: "Lunch-Scan-Dashboard" },
        { parent: "HRM", label: "Lunch-Pause-Dashboard" },
        { parent: "HRM", label: "Guest-Token-Dashboard" },
        { parent: "HRM", label: "Daily-Lunch-Dashboard-For-Canteen" },
        { parent: "HRM", label: "Employee-Wise-Salary-Report" },
        { parent: "HRM", label: "Employee-Wise-Pay-Slip" },
        { parent: "HRM", label: "Employee-Wise-Job-Card" },
        { parent: "HRM", label: "Tiffin-Bill-Requsition" },
        { parent: "HRM", label: "Tiffin-Bill-Requsition-Approval" },
        { parent: "HRM", label: "Tiffin-Bill-Requsition-List" },
        { parent: "HRM", label: "Tiffin-Bill-Upload" },
        { parent: "HRM", label: "Festival-Bonus-Bank-Summary" },
        { parent: "HRM", label: "Monthly-Holiday-Summary" },

        { parent: "HRM", label: "Attendance-Correction-Dashboard" },
        { parent: "HRM", label: "Punch-Machine-Configuration-Dashboard" },
        { parent: "HRM", label: "Official-Leave-Apply" },
        { parent: "HRM", label: "Hr-Osd-Dashboard" },
        { parent: "HRM", label: "Tax-Return" },
        { parent: "HRM", label: "Employee-Configuration" },
        { parent: "HRM", label: "Sub-Section" },
        { parent: "HRM", label: "Roster-Holiday-Configuration" },
        { parent: "HRM", label: "Matrix" },
        { parent: "HRM", label: "Update-Matrix" },
        { parent: "HRM", label: "Salary-Mail" },
        { parent: "HRM", label: "Bonus-Config" },
        { parent: "HRM", label: "Worker-Approval" },
        { parent: "HRM", label: "Foreigner-Salary" },
        { parent: "HRM", label: "Salary-Approval" },
        { parent: "HRM", label: "Foreigner-Salary-Deduction" },
        { parent: "HRM", label: "Monthly-Attendance-Summary-Dashboard" },
        { parent: "HRM", label: "Festival-Salary" },

        { parent: "HRM", label: "Tiffin-Bill-Dashboard" },
        { parent: "HRM", label: "Tiffin-Bill-Requsition-List" },
        { parent: "HRM", label: "Tiffin-Bill-Requsition-Approval" },
        { parent: "HRM", label: "Tiffin-Bill-Requsition" },
        { parent: "HRM", label: "Official-Memo" },
        { parent: "HRM", label: "Employee-File-Upload" },
        { parent: "HRM", label: "Unapprove-Leave" },
        { parent: "HRM", label: "Absent-Dashboard" },
        { parent: "HRM", label: "Employee-Transfer-Dashboard" },

        { parent: "Sample", label: "Sample-Galary" },

        { parent: "Production", label: "Production-Order-Dashboard" },
        { parent: "Production", label: "Production-Order-Approval" },
        { parent: "Production", label: "Cut-To-Ship" },

        { parent: "Pages", label: "Timeline" },
        { parent: "Pages", label: "Invoice" },
        { parent: "Pages", label: "Login" },
        { parent: "Pages", label: "Help" },
        { parent: "Pages", label: "Empty" },
        { parent: "Pages", label: "Access" },
        { parent: "Pages", label: "Requisitioncart" },
        { parent: "Start", label: "Documentation" },
        // Company
        { parent: "Admin", child: "Company", label: "Add Company" },
        { parent: "Admin", child: "Company", label: "Update Company" },
        { parent: "Admin", child: "Company", label: "List Company" },
        { parent: "Admin", child: "Company", label: "View Company" },
        { parent: "Admin", child: "Company", label: "View Company" },
        { parent: "Pages", label: "All Buttons" },
        { parent: "Pages", label: "Table" },

        { parent: "Production", label: "Production-Wise-Operation" },
        { parent: "Production", label: "Employee-Wise-Operation" },
        { parent: "Production", label: "Po-For-Gpro" },

        { parent: "Admin", label: "Country" },
        { parent: "Admin", label: "Meeting-Room-Entry" },
        { parent: "Admin", label: "Division" },
        { parent: "Admin", label: "District" },
        { parent: "Admin", label: "Upazila" },
        { parent: "Admin", label: "Post-Office" },
        { parent: "Admin", label: "Module" },
        { parent: "Admin", label: "Sub-Module" },
        { parent: "Admin", label: "Page" },
        { parent: "Admin", label: "Role" },
        { parent: "Admin", label: "Permission Master" },
        { parent: "Admin", label: "Permission Details" },
        { parent: "Admin", label: "User" },
        { parent: "Admin", label: "LOV Master" },
        { parent: "Admin", label: "LOV Details" },
        { parent: "Admin", label: "functional-approval" },
        { parent: "Admin", label: "PhoneBook" },
        { parent: "Admin", label: "MeetingRoomBooking" },
        { parent: "Admin", label: "Meeting Room Entry" },
        { parent: "Admin", label: "employeeWise-approvalDetail-dashboard" },
        { parent: "Admin", label: "Dashboard-Permission" },
        { parent: "Admin", label: "Company-Lay-Off" },

        /* Inventory Module */

        { parent: "Inventory", label: "Category" },
        { parent: "Inventory", label: "Create-Category" },
        { parent: "Inventory", label: "Material" },
        { parent: "Inventory", label: "AddMaterial" },
        { parent: "Inventory", label: "Main-Material" },
        { parent: "Inventory", label: "Vendor" },
        { parent: "Inventory", label: "AddVendor" },
        { parent: "Inventory", label: "VendorApproval" },
        { parent: "Inventory", label: "Requisition" },
        { parent: "Inventory", label: "RequisitionApproval" },
        { parent: "Inventory", label: "comparisonStatement" },
        { parent: "Inventory", label: "Company-Wise-Yearly-Purchase" },
        { parent: "Inventory", label: "Supply-Chain-Pi-Dashboard" },
        { parent: "Inventory", label: "Supply-Chain-LC-Dashboard" },
        { parent: "Inventory", label: "Supply-Chain-Create-LC" },
        { parent: "Inventory", label: "Supply-Chain-Update-LC" },
        { parent: "Inventory", label: "Supply-Chain-TT-Dashboard" },
        { parent: "Inventory", label: "SC-TT-Provision-Dashboard" },
        { parent: "Inventory", label: "Supply-Chain-Create-TT" },
        { parent: "Inventory", label: "Supply-Chain-Update-TT" },
        { parent: "Inventory", label: "Requisition-For-Yarn-Dashboard" },
        { parent: "Inventory", label: "Bulk-Yarn-Requisition" },
        { parent: "Inventory", label: "Yarn-Allocate-Dashboard" },
        { parent: "Inventory", label: "Yarn-Purchase-Dashboard" },
        { parent: "Inventory", label: "Issuechallan-Approval" },
        { parent: "Inventory", label: "Store" },
        { parent: "Inventory", label: "Rack" },
        { parent: "Inventory", label: "Bin" },
        { parent: "Inventory", label: "receive-dashboard" },
        { parent: "Inventory", label: "Material-Issue-Dashboard" },
        { parent: "Inventory", label: "Material-Issue-List" },
        { parent: "Inventory", label: "material-dashboard" },
        { parent: "Inventory", label: "vehicle-master" },
        { parent: "Inventory", label: "Project-Budget-Dashboard" },
        { parent: "Inventory", label: "Project-Budget-Approval" },
        { parent: "Inventory", label: "Budget-Approval" },
        { parent: "Inventory", label: "Grn-Dashboard" },
        { parent: "Inventory", label: "Store-Transfer-Request-Dashboard" },
        { parent: "Inventory", label: "Store-Transfer-Dashboard" },
        { parent: "Inventory", label: "Store-Transfer-For-Request-Dashboard" },
        { parent: "Inventory", label: "Store-Transfer-Receive-Dashboard" },
        { parent: "Inventory", label: "Supply-Chain-Acceptance-Dashboard" },
        { parent: "Inventory", label: "Store-Requisition-Approval" },
        { parent: "Inventory", label: "All-Challan-Approval" },
        { parent: "Inventory", label: "Return-To-Vendor" },

        { parent: "Inventory", label: "Issuechallan-Update" },
        { parent: "Inventory", label: "Issuechallan-Dashboard" },
        { parent: "Inventory", label: "Issuechallan" },
        { parent: "Inventory", label: "Material-Disposal-List" },
        { parent: "Inventory", label: "Other-Material-Disposal-List" },
        { parent: "Inventory", label: "Quick-Support" },

        { parent: "Inventory", label: "Qc-Entry-Dashboard" },
        { parent: "Inventory", label: "Material-Qc-Dashboard" },
        { parent: "Inventory", label: "QC-Approval-Dashboard" },
        { parent: "Inventory", label: "QC-Inspection" },
        { parent: "Inventory", label: "Fabric-Qc-Entry" },
        { parent: "Inventory", label: "Rejected-Qc-Approval" },
        { parent: "Inventory", label: "Qc-Dashboard" },
        { parent: "Inventory", label: "Qc-Pending-List" },

        { parent: "Inventory", label: "All-Challan-Dashboard" },
        { parent: "Inventory", label: "All-Challan-Approval" },
        { parent: "Inventory", label: "Yarn-Reverse-Allowcation" },
        { parent: "Inventory", label: "All-Receive-Dashboard" },
        { parent: "Inventory", label: "Enlisted-Material-Dashboard" },
        { parent: "Inventory", label: "Fabric-Stock-Dashboard" },
        { parent: "Inventory", label: "Age-Wise-Fabric-Stock-Dashboard" },
        { parent: "Inventory", label: "Buyer-Wise-Fabric-Stock-Dashboard" },
        { parent: "Inventory", label: "Cutting-Dashboard" },
        { parent: "Inventory", label: "Fabric-Stock-Main-Dashboard" },
        { parent: "Inventory", label: "Procurement-Invoice-Dashboard" },
        { parent: "Inventory", label: "Budget-Report" },
        { parent: "Inventory", label: "Project-Budget-Ceo-Approval" },

        /* Procurement Module */

        { parent: "Procurement", label: "assign" },
        { parent: "Procurement", label: "Comparison-Statement" },
        { parent: "Procurement", label: "create batch" },
        { parent: "Procurement", label: "Purchase-Dashboard" },
        { parent: "Procurement", label: "Direct-Purchase-Dashboard" },

        { parent: "Procurement", label: "po" },
        { parent: "Procurement", label: "Direct Purchase" },
        { parent: "Procurement", label: "Dp Approval" },
        { parent: "Procurement", label: "CsApproval" },
        { parent: "Procurement", label: "Invoice" },
        { parent: "Procurement", label: "po-approval" },
        { parent: "Procurement", label: "invoice-approval" },
        { parent: "Procurement", label: "status-dashboard" },
        { parent: "Procurement", label: "Invoice Report" },
        { parent: "Procurement", label: "PR-Permission" },
        { parent: "Procurement", label: "Update-Invoce" },
        { parent: "Procurement", label: "Update-Requisitioncart" },
        { parent: "Procurement", label: "Sport-Purchase-Cs" },
        { parent: "Procurement", label: "Direct-Purchase-Cs-Dashboard" },
        { parent: "Procurement", label: "Direct-Purchase-Cs-Approval" },

        //Merchandisingr

        { parent: "Merchandising", label: "Buyers" },
        { parent: "Merchandising", label: "Map" },
        { parent: "Merchandising", label: "Bill-Off-Materials" },
        { parent: "Merchandising", label: "Work-Order-Create" },
        { parent: "Merchandising", label: "Buyer-Approval" },
        { parent: "Merchandising", label: "Buyer-Address" },
        { parent: "Merchandising", label: "Buyer-Brand" },
        { parent: "Merchandising", label: "Buyer-Config" },
        { parent: "Merchandising", label: "Buyer-Season" },
        { parent: "Merchandising", label: "Team-Master" },
        { parent: "Merchandising", label: "Team-Details" },
        { parent: "Merchandising", label: "Style-Master" },
        { parent: "Merchandising", label: "reference_dashboard" },
        { parent: "Merchandising", label: "puchase-order" },
        { parent: "Merchandising", label: "addPurchaseOrder" },
        { parent: "Merchandising", label: "Fabric-Composition" },
        { parent: "Merchandising", label: "Fabric-Composition-Approval" },
        { parent: "Merchandising", label: "Buyer-Wise-Event" },
        { parent: "Merchandising", label: "Work-Order-Report" },
        { parent: "Merchandising", label: "Wash-Approval" },
        { parent: "Merchandising", label: "Stock-Confirmation" },
        { parent: "Merchandising", label: "Work-Order-Dashboard" },
        { parent: "Merchandising", label: "Add-Pofrom-Newref" },
        { parent: "Merchandising", label: "size-sequence" },
        { parent: "Merchandising", label: "update-pofrom-newref" },
        { parent: "Procurement", label: "Invoice Report" },

        { parent: "Merchandising", label: "Final-Cost-Sheet" },
        { parent: "Merchandising", label: "Final-Cost-Sheet-Approval" },
        { parent: "Merchandising", label: "specultive-dashboard" },
        { parent: "Procurement", label: "Invoice Report" },
        { parent: "Merchandising", label: "reference_dashboard" },
        { parent: "Merchandising", label: "puchase-order" },
        { parent: "Merchandising", label: "addPurchaseOrder" },
        { parent: "Merchandising", label: "Fabric-Composition" },
        { parent: "Merchandising", label: "Fabric-Composition-Approval" },
        { parent: "Merchandising", label: "tna-dashboard" },
        { parent: "Merchandising", label: "Yarn-Pi-Report" },
        { parent: "Merchandising", label: "Work-Order-Approval" },

        { parent: "Merchandising", label: "Work-Order-Dashboard" },
        { parent: "Merchandising", label: "Thread" },
        { parent: "Merchandising", label: "SMV" },
        { parent: "Merchandising", label: "CAD" },
        { parent: "Merchandising", label: "WASH" },
        { parent: "Merchandising", label: "Pi-Dashboard" },
        { parent: "Merchandising", label: "pi-approval" },
        { parent: "Merchandising", label: "Order-Delete-Request-Dashboard" },
        { parent: "Merchandising", label: "Order-Delete-Request-Approval" },
        { parent: "Merchandising", label: "Fabric-Booking" },
        { parent: "Merchandising", label: "Fabric-Booking-Dashboard" },
        { parent: "Merchandising", label: "Fabric-Booking-Edit" },
        { parent: "Merchandising", label: "Fabric-Booking-Approval" },
        { parent: "Merchandising", label: "Fabric-Booking-List-Dashboard" },
        { parent: "Merchandising", label: "Knitting-and-Dyeing-Booking-List" },
        { parent: "Merchandising", label: "Sample-Fabric-Booking-Dashboard" },
        { parent: "Merchandising", label: "Insert-Sample-Fabric-Booking" },
        { parent: "Merchandising", label: "Block-Fabric-Booking-Dashboard" },
        { parent: "Merchandising", label: "Sample-Fabric-Booking-Approval" },
        { parent: "Merchandising", label: "Block-Fabric-Approval" },
        { parent: "Merchandising", label: "Po-Searching-Dashboard" },
        { parent: "Merchandising", label: "Yarn-Pi-Closing-Dashboard" },
        { parent: "Merchandising", label: "Orderwise-Fabric-Booking-Create" },
        { parent: "Merchandising", label: "Yarn-Pi-Closing-Approval" },
        { parent: "Merchandising", label: "Knitting-Dying-Payment-Process" },
        { parent: "Merchandising", label: "Tna-Main-Dashboard" },
        { parent: "Merchandising", label: "Pvh-Dashboard" },
        { parent: "Merchandising", label: "Price-Request-Approval" },
        { parent: "Merchandising", label: "Non-Pay-Sms-Workorder" },
        { parent: "Merchandising", label: "Our-Reference-Wise-Receive-Details" },
        { parent: "Merchandising", label: "Block-Extra-Consumption-Budget" },
        { parent: "Merchandising", label: "Block-Extra-Consumption-Dashboard" },
        { parent: "Merchandising", label: "Buyer-Wise-Supplier-Nomination" },
        { parent: "Merchandising", label: "Style-Tracker" },

        { parent: "Production", label: "Production-Update-Dashboard" },

        { parent: "Commercial", label: "Export-Lc-Dashboard" },
        { parent: "Commercial", label: "Commission-Dashboard" },
        { parent: "Commercial", label: "Add-Export-Lc" },
        { parent: "Commercial", label: "Export-Amendment-List" },
        { parent: "Commercial", label: "update-Mlc" },
        { parent: "Commercial", label: "Back-To-Back-Lc-Dashboard" },
        { parent: "Commercial", label: "acceptance-dashboard" },
        { parent: "Commercial", label: "foreign-lc-acceptance-dashboard" },
        { parent: "Commercial", label: "Foreign-Grn-Dashboard" },
        { parent: "Commercial", label: "Acceptance-Report" },
        { parent: "Commercial", label: "Create-Import-Lc" },
        { parent: "Commercial", label: "Back-To-Back-Lc" },
        { parent: "Commercial", label: "Back-To-Back-TT" },
        { parent: "Commercial", label: "Back-To-Back-LC-Dashboard" },
        { parent: "Commercial", label: "Update-Back-To-Back-Lc" },
        { parent: "Commercial", label: "Back-To-Back-Amendment-List" },
        { parent: "Commercial", label: "Export-Invoice-Dashboard" },
        { parent: "Commercial", label: "Add-Export-Invoice" },
        { parent: "Commercial", label: "Update-Export-Invoice" },
        { parent: "Commercial", label: "Export-Payment-Due-Dashboard" },
        { parent: "Commercial", label: "Packing-Dashboard" },
        { parent: "Commercial", label: "All-Packing-Dashboard" },
        { parent: "Commercial", label: "add-packing" },
        { parent: "Commercial", label: "insert-packing" },
        { parent: "Commercial", label: "update-packing" },
        { parent: "Commercial", label: "assort-creation" },
        { parent: "Commercial", label: "assort-dashboard" },
        { parent: "Commercial", label: "export-challan" },
        { parent: "Commercial", label: "export-challan-dashboard" },
        { parent: "Commercial", label: "Export-Challan-Approval" },
        { parent: "Commercial", label: "import-acceptance-dashboard" },
        { parent: "Commercial", label: "local-lc-approval" },
        { parent: "Commercial", label: "lot-dashboard" },
        { parent: "Commercial", label: "Back-To-Back-T-T-Dashboard" },
        { parent: "Commercial", label: "Back-To-Back-T-T-Create" },
        { parent: "Commercial", label: "Back-To-Back-T-T-Insert" },
        { parent: "Commercial", label: "Transfer-Sc-To-Lc-Dashboard" },
        { parent: "Commercial", label: "Create-Transfer-Sc-To-Lc" },
        { parent: "Commercial", label: "Transfer-Broken-Sc-To-Lc" },
        { parent: "Commercial", label: "Transfer-Broken-Sc-To-New-Lc" },
        { parent: "Commercial", label: "Ud-Dashboard" },
        { parent: "Commercial", label: "Invoice-Bundle-Dashboard" },
        { parent: "Commercial", label: "Acceptance-Receive-Dashboard" },
        { parent: "Commercial", label: "Commercial-Documents" },
        { parent: "Commercial", label: "Create-Documents" },
        { parent: "Commercial", label: "Commercial-Invoice-Levis" },
        { parent: "Commercial", label: "Commercial-BBLC-Dashboard" },
        { parent: "Commercial", label: "Insert-BBLC" },
        { parent: "Commercial", label: "Update-BBLC" },
        { parent: "Commercial", label: "PI-To-Realize-Dashboard" },
        { parent: "Commercial", label: "Local-LC-Acceptance-Dashboard" },

        //New Pages

        { parent: "Commercial", label: "BBLC-Dashboard" },
        { parent: "Commercial", label: "Create-BBLC" },
        { parent: "Commercial", label: "BBLC-Amendment-Dashboard" },
        { parent: "Commercial", label: "Lc-Amendment-Dashboard" },

        { parent: "Commercial", label: "Lc-Amendment" },

        { parent: "Commercial", label: "Invoice-Dashboard" },
        { parent: "Commercial", label: "Insert-Invoice" },
        { parent: "Commercial", label: "Edit-Invoice" },

        //Personal
        { parent: "Commercial", label: "Customer-PI-Main" },
        { parent: "Commercial", label: "Create-Manual-Pi" },
        { parent: "Commercial", label: "BBLC-Invoice-Dashboard" },
        { parent: "Commercial", label: "Purchase-Order-History" },
        { parent: "Commercial", label: "Wash-Export-Invoice-Dashboard" },

        //New Pages End
        { parent: "Tech-Service", label: "category" },
        { parent: "Tech-service", label: "sub-category" },
        { parent: "Tech-Service", label: "machine-master" },
        { parent: "Tech-Service", label: "spare-parts-category" },
        { parent: "Tech-Service", label: "machine-location" },
        { parent: "Tech-Service", label: "machine-assign" },
        { parent: "Tech-service", label: "maintenance-type" },
        { parent: "Tech-Service", label: "maintenance-period" },
        { parent: "Tech-Service", label: "sudden-breakdown" },
        { parent: "Tech-service", label: "line-plan" },
        { parent: "Tech-Service", label: "machine-layout" },
        { parent: "Tech-Service", label: "machine-overview" },

        // Fiance Start
        { parent: "Finance", label: "Cost-Center" },
        { parent: "Finance", label: "Auto-Journal-dashboard" },
        { parent: "Finance", label: "Customer-Bill-Dashboard" },
        { parent: "Finance", label: "Finance-Export-Dashboard" },

        { parent: "Finance", label: "Service-Bill" },
        { parent: "Finance", label: "Bank" },
        { parent: "Finance", label: "Account" },
        { parent: "Finance", label: "Chart-of-Accounting" },
        { parent: "Finance", label: "Sub-Group" },
        { parent: "Finance", label: "Category" },
        { parent: "Finance", label: "Sub-Category" },
        { parent: "Finance", label: "Ledger" },
        { parent: "Finance", label: "Sub-Ledger" },
        { parent: "Finance", label: "Journal" },
        { parent: "Finance", label: "Journal-Entry" },
        { parent: "Finance", label: "Transport" },
        { parent: "Finance", label: "Transport-Approval" },
        { parent: "Finance", label: "CNF" },
        { parent: "Finance", label: "Cnf-Approval" },
        { parent: "Finance", label: "Journal-Approval" },
        { parent: "Finance", label: "Daybook" },
        { parent: "Finance", label: "Courier-Bill" },
        { parent: "Finance", label: "Courier-Invoice-Approval" },
        { parent: "Finance", label: "Cheque-Enrollment" },
        { parent: "Finance", label: "Journal-Entry-Dashboard" },
        { parent: "Finance", label: "IoU" },
        { parent: "Finance", label: "Vendor-Advance" },
        { parent: "Finance", label: "Courier-Invoice-DB" },
        { parent: "Finance", label: "Others-Bill" },
        { parent: "Finance", label: "Ledger-Dashboard" },
        { parent: "Finance", label: "Insurance-Dashboard" },
        { parent: "Finance", label: "Insurance-Entry" },
        { parent: "Finance", label: "Iou-Approval" },
        { parent: "Finance", label: "Currency-Conversion" },
        { parent: "Finance", label: "Trial-Balance" },
        { parent: "Finance", label: "Others-Bill-Approval" },
        { parent: "Finance", label: "PL-Statement" },
        { parent: "Finance", label: "Service-Invoice-Dashboard" },
        { parent: "Finance", label: "Service-Bill-Approval" },
        { parent: "Finance", label: "Service-Bill-Invoice" },
        { parent: "Finance", label: "Balance-Sheet" },
        { parent: "Finance", label: "Cheque-Disbursement" },
        { parent: "Finance", label: "Cheque-Issue" },
        { parent: "Finance", label: "Delivery-Challan-Recieve-Dashboard" },
        { parent: "Finance", label: "Fixed-Asset-Scheduler" },
        { parent: "Finance", label: "Fixed-Asset-Dashboard" },
        { parent: "Finance", label: "Payment-Voucher-Approval" },
        { parent: "Finance", label: "Other-Bill-Report" },
        { parent: "Finance", label: "Upas-Loan-Dashboard" },
        { parent: "Finance", label: "Insurance-Category" },
        { parent: "Finance", label: "Journal-Voucher-Upload" },
        { parent: "Finance", label: "Petty-Cash" },
        { parent: "Finance", label: "Pettycash-Approval-Dashboard" },
        { parent: "Finance", label: "payment-requisition-dashboard" },
        { parent: "Finance", label: "payment-requisition-details" },
        { parent: "Finance", label: "payment-requisition-approval-dashboard" },
        { parent: "Finance", label: "payment-requisition-approval-details" },
        { parent: "Finance", label: "Party-Advance-Requisition" },
        { parent: "Finance", label: "Party-Advance-Requisition-Approval" },
        { parent: "Finance", label: "Loan" },

        { parent: "Finance", label: "Budget" },
        { parent: "Finance", label: "GatepassFor-Approval" },
        { parent: "Finance", label: "Budget-Approval-Dashboard" },
        { parent: "Finance", label: "Company-Wise-Budget-Dashboard" },
        { parent: "Finance", label: "Pettycash-Requisition-Approval-Dashboard" },
        { parent: "Finance", label: "Pettycash-Dashboard" },
        { parent: "Finance", label: "payment-requisition-report" },
        { parent: "Finance", label: "journal-payment-requisition" },
        { parent: "Finance", label: "journal-payment-requisition-approval" },
        { parent: "Finance", label: "Payment-Requisition-Approval" },
        { parent: "Finance", label: "Vendor-Advance-Approval" },
        { parent: "Finance", label: "Acceptance-Dashboard" },
        { parent: "Finance", label: "Acceptance-Bank-Ref-Dashboard" },
        { parent: "Finance", label: "Acceptance-Bank-Ref-Approval" },
        { parent: "Finance", label: "Finance-Back-To-Back-LC-Dashboard" },
        { parent: "Finance", label: "Supply-Chain-LC-Dashboard" },
        { parent: "Finance", label: "Issuing-Cheque-Dashboard" },
        { parent: "Finance", label: "Sc-Acceptance-Bank-Ref-Dashboard" },
        { parent: "Finance", label: "Sc-Acceptance-Bank-Ref-Entry" },
        { parent: "Finance", label: "Sc-Acceptance-Bank-Ref-Approval" },
        { parent: "Finance", label: "Loan-Approval" },
        { parent: "Finance", label: "Procurement-PO" },

        // Fiance end
        // Shop Floor Management
        { parent: "Shop-Floor-Management", label: "Production-Dashboard" },
        { parent: "Shop-Floor-Management", label: "Plan-Information" },
        { parent: "Shop-Floor-Management", label: "Cutting-Details" },
        { parent: "Shop-Floor-Management", label: "Tag-Assign" },
        { parent: "Shop-Floor-Management", label: "Swing-Starting" },
        { parent: "Shop-Floor-Management", label: "Quality-Check" },
        { parent: "Shop-Floor-Management", label: "Add-Plan-Information" },
        { parent: "Shop-Floor-Management", label: "Operation" },
        { parent: "Shop-Floor-Management", label: "Operation-Assign" },
        { parent: "Shop-Floor-Management", label: "Bundle-Cut-Dashboard" },
        { parent: "Shop-Floor-Management", label: "Insert-Cutting" },
        { parent: "Shop-Floor-Management", label: "Bundle-Cut-Details" },
        { parent: "Shop-Floor-Management", label: "Bundle-Production-Scanner" },
        { parent: "BI", label: "Report-Dashboard" },
        { parent: "BI", label: "Report" },
        { parent: "BI", label: "Sub-Report" },
        { parent: "BI", label: "Report-Permission" },
        { parent: "Planning", label: "TnA" },
        { parent: "Planning", label: "Event-Master" },
        { parent: "Planning", label: "Event-Relative" },
        { parent: "Planning", label: "Tna-Wise-Events" },

        //ProductDevelopment Start
        { parent: "NPD", label: "Buyer" },
        { parent: "NPD", label: "Production-Process-Dashboard" },
        { parent: "NPD", label: "Buyer" },
        { parent: "NPD", label: "Brand" },
        { parent: "NPD", label: "Program" },
        { parent: "NPD", label: "Product-Category" },
        { parent: "NPD", label: "Product-Sub-Category" },
        { parent: "NPD", label: "Customer-Profile" },
        { parent: "NPD", label: "Sample-Request-Dashboard" },
        { parent: "NPD", label: "Cost-Sheet-Request-Dashboard" },
        { parent: "NPD", label: "Cost-Sheet-Dashboard" },
        { parent: "NPD", label: "Cost-Sheet-Approval-Dashboard" },
        { parent: "NPD", label: "New-Sample-Dashboard" },
        // 29-03-2023
        { parent: "NPD", label: "Sample-Job-Tracking" },
        { parent: "NPD", label: "Sample-Job-Tracking-Status" },
        { parent: "NPD", label: "Team-Wise-Marketing-Details-Dashboard" },
        { parent: "NPD", label: "Sample-Designer-Dashboard" },

        //Ali
        { parent: "PD", label: "Sample-Submit-Dashboard" },
        { parent: "PD", label: "Sample-Request-Approval" },
        { parent: "PD", label: "Customer-Approval" },
        { parent: "PD", label: "Sample-Request-Approval" },
        { parent: "PD", label: "Sample-Approval" },

        //ProductDevelopment End

        // Order
        { parent: "Order", label: "SampleGeneralDashboard" },
        { parent: "Order", label: "work-order-dashboard" },
        { parent: "Order", label: "approval-dashboard" },
        { parent: "Order", label: "challan-receive-dashboard" },
        { parent: "Order", label: "Matalan-XML-Upload" },
        { parent: "Order", label: "Order-Tracking" },
        { parent: "Order", label: "Work-Order-Approval" },
        { parent: "Order", label: "Job-Bag-Tracking-Dashboard" },

        //Dispatch Start
        { parent: "Dispatch", label: "Finish-Good-Receive-Dashboard" },
        { parent: "Dispatch", label: "Delivery-Challan-Create" },
        { parent: "Dispatch", label: "Delivery-Challan-Dashboard" },
        { parent: "Dispatch", label: "Delivery-Challan-Approval-Dashboard" },
        { parent: "Dispatch", label: "Gate-Pass-Entry" },
        { parent: "Dispatch", label: "Delivery-Challan-Receive-Dashboard" },
        { parent: "Dispatch", label: "Delivery-Challan-Approval" },
        { parent: "Dispatch", label: "Send-To-Gate" },
        { parent: "Dispatch", label: "Gate-Pass-Scan" },
        { parent: "Dispatch", label: "Gate-Pass-Dashboard" },
        { parent: "Dispatch", label: "Gate-Pass-Approval" },
        { parent: "Dispatch", label: "Sample-Gate-Pass-Approval" },
        { parent: "Dispatch", label: "Security-Gate-Pass-Dashboard" },
        { parent: "Dispatch", label: "Sample-GatePass-Dashboard" },

        //Dispatch End

        //PRODUCTION START
        { parent: "Production", label: "Daily-Production-Update" },
        { parent: "Production", label: "Daily-QC-Update" },
        { parent: "Production", label: "Trims-Accesories-Requisition" },

        //PRODUCTION END
        { parent: "PreCosting", label: "Costing" },
        { parent: "PreCosting", label: "Costing-Approval" },

        // Product Development New Page
        // Approved Sample List Dashboard
        { parent: "PD", label: "Approved-Sample-List-Dashboard" },
        { parent: "PD", label: "production-process-temp-db" },
        { parent: "Production", label: "Production-Update-Dashboard" },
        { parent: "Planning", label: "Operation-Assign-Dashboard" },

        { parent: "Transport", label: "Transport-Truck-Dashboard" },
        { parent: "Transport", label: "Transport-Requisition" },
        { parent: "Transport", label: "Transport-Requisition-Dashboard" },
        { parent: "Transport", label: "Transport-Trip-Entry-Dashboard" },
        { parent: "Transport", label: "Transport-Trip-Dashboard" },

        { parent: "Finance", label: "Other-Revenue-Dashboard" },
        { parent: "Finance", label: "Other-Revenue-Approval-Dashboard" },
        { parent: "Finance", label: "Other-Revenue-Approval" },
        { parent: "Finance", label: "Debit-Credit-Note-Dashboard" },
        { parent: "Finance", label: "Export-Debit-Credit-Note" },
        
        { parent: "HRM", label: "Employee-Job-Description-Template" },
        { parent: "HRM", label: "Employee-Hiring-Requisition" },
        { parent: "HRM", label: "Hiring-Requisition-Approval" },
        
        { parent: "Commercial", label: "Export-LC-PO-History" },
        { parent: "Commercial", label: "TT-Provision-Dashboard" },
        
        // IE
        { parent: "IE", label: "SMV-Data-Bank" },
        { parent: "IE", label: "Process-Dashboard" },
        { parent: "IE", label: "Bulletin-Dashboard" },
        
        { parent: "Merchandising", label: "Material-Wise-Approved-Price-Dashboard" },
        //ADMIN | Issue Raise
        { parent: "Admin", label: "Issue-Raise-Dashboard" },
        { parent: "Admin", label: "Issue-Assign-Dashboard" },
        { parent: "Admin", label: "Issue-Fixed-Dashboard" },
        { parent: "Admin", label: "Issue-Tracking-Dashboard" },
        { parent: "Merchandising", label: "PVH-Order-Tracking-Dashboard" },
        { parent: "Merchandising", label: "Close-Costing-Review" },
        { parent: "Merchandising", label: "Close-Costing-Review-Approval" },
        
        { parent: "Commercial", label: "Wash-PI-Entry" },
        { parent: "Commercial", label: "Wash-PI-List" },
        // { parent: "Commercial", label: "Wash-PI-List" },
        { parent: "Commercial", label: "Wash-PI-Update" },
        { parent: "IA", label: "Internal-Audit-Dashboard" },
        { parent: "HRM", label: "Night-Bill-List" },
        
        { parent: "Inventory", label: "FOC-Order-Receive" },
        { parent: "Merchandising", label: "Kiabi-Order-Tracking" },
        { parent: "HRM", label: "Shift-Copy" },
        { parent: "HRM", label: "Employee-Hiring-Approval" },
        { parent: "HRM", label: "Man-Power-Budget" },
        
        //Management
        { parent: "Management", label: "Post-Costing-Summary" },
        { parent: "Management", label: "Fabric-Stock-Summary" },
        { parent: "Management", label: "Gate-Pass-Summary" },
        { parent: "Management", label: "Leftover-Summary" },
        { parent: "Management", label: "Shipment-Summary" },
        { parent: "Management", label: "FOB-Analysis" },
        { parent: "Management", label: "Daily-Production-Summary" },
        { parent: "Merchandising", label: "MRC-Close-Order-Information" },
        { parent: "Merchandising", label: "Buyer-Wise-Fabric" },
        { parent: "Merchandising", label: "Reference-Wise-Stock" },
        { parent: "Management", label: "Fabric-Stock-Valuation-Summary" },
        
        //MRC-Dashboard
        { parent: "MRC", label: "Merchandising-Dashboard" },
        { parent: "MRC", label: "Work-Order-Details" },
        { parent: "ProvidentFund", label: "PF-Contribution-Dashboard" },
        
        // HR
        { parent: "HRM", label: "Employee-Mail-Service" },
        { parent: "Admin", label: "Dashboard-New-Permission-Create" },
        { parent: "Admin", label: "Functional-Approval-Dashboard" },
        
        { parent: "Management", label: "Daily-Gate-Pass-Summary" },
        
        { parent: "Inventory", label: "KLUBHAUS-PO" },
        { parent: "Inventory", label: "KLUBHAUS-PO-Approval" },
        { parent: "Sample", label: "Sample-Gallery" },
        { parent: "Sample", label: "Sample-Entry" },
        { parent: "Management", label: "Buyer-Wise-Sales-Cont-Summary" },
        { parent: "Management", label: "Pending-Area-Monitoring" },
        { parent: "Management", label: "Commercial-Area-Monitoring" },
        { parent: "Management", label: "Klubhaus-Stock-Summary" },
        { parent: "Management", label: "Extra-Booking-Summary" },
        
        //Commercial
        { parent: "Commercial", label: "Commercial-Dashboard" },
        
        { parent: "Procurement", label: "Project-Assignment" },
        { parent: "Procurement", label: "Project-Linking" },
        
        { parent: "Production", label: "New-Production-Update-Dashboard" },
        { parent: "Commercial", label: "Realization-Journal-Pending" },
        { parent: "Production", label: "Production-Reconciliation-Dashboard" },
        { parent: "HRM", label: "Dekko-Award-Voting" },
        { parent: "Admin", label: "Voting-Department-Assign" },
        { parent: "Admin", label: "MGT-Wise-Dept-Assign" },
        { parent: "HRM", label: "Factory-Team-Nominations" },
        { parent: "HRM", label: "Best-Performer-People-Choice" },
        { parent: "Management", label: "Negative-Costing" },
        
        //PF
        { parent: "ProvidentFund", label: "PF-Policy" },
        { parent: "ProvidentFund", label: "PF-Investment" },
        { parent: "ProvidentFund", label: "PF-Settlement-Policy" },

        //Sub_Contact
        { parent: "Finance", label: "Sub-Contract-List-View" },
        { parent: "Finance", label: "Sub-Contract-Acceptance-List" },
        { parent: "Finance", label: "Sub-Contract-Acceptance" },
        { parent: "Finance", label: "Sub-Contract-Bank-Reference" },
        { parent: "Finance", label: "Sub-Contract-Acceptance-Dashboard" },
        { parent: "Finance", label: "Sub-Contract-Acceptance-Approval" },
    ];

    useEffect(() => {
        if (menuMode === "overlay") {
            hideOverlayMenu();
        }
        if (menuMode === "static") {
            setDesktopMenuActive(true);
        }
    }, [menuMode]);

    useEffect(() => {
        onColorModeChange(colorMode);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onMenuThemeChange = (theme) => {
        setMenuTheme(theme);
    };

    const onTopbarThemeChange = (theme) => {
        setTopbarTheme(theme);
    };

    useEffect(() => {
        // const appLogoLink = document.getElementById("app-logo");
        // if (topbarTheme === "white" || topbarTheme === "yellow" || topbarTheme === "amber" || topbarTheme === "orange" || topbarTheme === "lime") {
        //     appLogoLink.src = "assets/layout/images/logo-dark.png";
        // } else {
        //     appLogoLink.src = "assets/layout/images/logo-dark.png";
        // }
    }, [topbarTheme]);

    const replaceLink = (linkElement, href, callback) => {
        if (isIE()) {
            linkElement.setAttribute("href", href);

            if (callback) {
                callback();
            }
        } else {
            const id = linkElement.getAttribute("id");
            const cloneLinkElement = linkElement.cloneNode(true);

            cloneLinkElement.setAttribute("href", href);
            cloneLinkElement.setAttribute("id", id + "-clone");

            linkElement.parentNode.insertBefore(cloneLinkElement, linkElement.nextSibling);

            cloneLinkElement.addEventListener("load", () => {
                linkElement.remove();
                cloneLinkElement.setAttribute("id", id);

                if (callback) {
                    callback();
                }
            });
        }
    };

    const onInputStyleChange = (inputStyle) => {
        setInputStyle(inputStyle);
    };

    const onRipple = (e) => {
        PrimeReact.ripple = e.value;
        setRipple(e.value);
    };

    const onInlineMenuPositionChange = (mode) => {
        setInlineMenuPosition(mode);
    };

    const onMenuModeChange = (mode) => {
        setMenuMode(mode);
    };

    const onRTLChange = () => {
        setRTL((prevState) => !prevState);
    };

    const onMenuClick = (event) => {
        menuClick = true;
    };

    const onMenuButtonClick = (event) => {
        menuClick = true;

        if (isDesktop()) setDesktopMenuActive((prevState) => !prevState);
        else setMobileMenuActive((prevState) => !prevState);

        event.preventDefault();
    };

    const onTopbarItemClick = (event) => {
        topbarItemClick = true;
        if (activeTopbarItem === event.item) setActiveTopbarItem(null);
        else {
            setActiveTopbarItem(event.item);
        }

        event.originalEvent.preventDefault();
    };

    const onSearch = (event) => {
        searchClick = true;
        setSearchActive(event);
    };

    const hideOverlayMenu = () => {
        setMobileMenuActive(false);
        setDesktopMenuActive(false);
    };

    const isDesktop = () => {
        return window.innerWidth > 1024;
    };

    const isHorizontal = () => {
        return menuMode === "horizontal";
    };

    const isSlim = () => {
        return menuMode === "slim";
    };

    const isIE = () => {
        return /(MSIE|Trident\/|Edge\/)/i.test(window.navigator.userAgent);
    };

    const onInlineMenuClick = (e, key) => {
        let menuKeys = { ...inlineMenuActive };
        if (key !== currentInlineMenuKey.current && currentInlineMenuKey.current) {
            menuKeys[currentInlineMenuKey.current] = false;
        }

        menuKeys[key] = !menuKeys[key];
        setInlineMenuActive(menuKeys);
        currentInlineMenuKey.current = key;
        inlineMenuClick = true;
    };

    const layoutContainerClassName = classNames("layout-wrapper ", "layout-menu-" + menuTheme + " layout-topbar-" + topbarTheme, {
        "layout-menu-static": menuMode === "static",
        "layout-menu-overlay": menuMode === "overlay",
        "layout-menu-slim": menuMode === "slim",
        "layout-menu-horizontal": menuMode === "horizontal",
        "layout-menu-active": desktopMenuActive,
        "layout-menu-mobile-active": mobileMenuActive,
        "layout-topbar-mobile-active": mobileTopbarActive,
        "layout-rightmenu-active": rightMenuActive,
        "p-input-filled": inputStyle === "filled",
        "p-ripple-disabled": !ripple,
        "layout-rtl": isRTL,
    });

    const onMenuItemClick = (event) => {
        if (!event.item.items && (menuMode === "overlay" || !isDesktop())) {
            hideOverlayMenu();
        }

        if (!event.item.items && (isHorizontal() || isSlim())) {
            setMenuActive(false);
        }
    };

    const onRootMenuItemClick = (event) => {
        setMenuActive((prevState) => !prevState);
    };

    const onRightMenuButtonClick = () => {
        setRightMenuActive((prevState) => !prevState);
    };
    const onMessageButtonClick = () => {
        setMessageMenuActive((prevState) => !prevState);
    };

    const onMobileTopbarButtonClick = (event) => {
        setMobileTopbarActive((prevState) => !prevState);
        event.preventDefault();
    };

    const onDocumentClick = (event) => {
        if (!searchClick && event.target.localName !== "input") {
            setSearchActive(false);
        }

        if (!topbarItemClick) {
            setActiveTopbarItem(null);
        }

        if (!menuClick && (menuMode === "overlay" || !isDesktop())) {
            if (isHorizontal() || isSlim()) {
                setMenuActive(false);
            }
            hideOverlayMenu();
        }

        if (inlineMenuActive[currentInlineMenuKey.current] && !inlineMenuClick) {
            let menuKeys = { ...inlineMenuActive };
            menuKeys[currentInlineMenuKey.current] = false;
            setInlineMenuActive(menuKeys);
        }

        if (!menuClick && (isSlim() || isHorizontal())) {
            setMenuActive(false);
        }

        searchClick = false;
        topbarItemClick = false;
        inlineMenuClick = false;
        menuClick = false;
    };

    const onThemeChange = (theme) => {
        setTheme(theme);
        const themeLink = document.getElementById("theme-css");
        const themeHref = "assets/theme/" + theme + "/theme-" + colorMode + ".css";
        replaceLink(themeLink, themeHref);
    };

    const onColorModeChange = (mode) => {
        setColorMode(mode);
        setIsInputBackgroundChanged(true);

        if (isInputBackgroundChanged) {
            if (mode === "dark") {
                setInputStyle("filled");
            } else {
                setInputStyle("outlined");
            }
        }

        if (mode === "dark") {
            setMenuTheme("dark");
            setTopbarTheme("dark");
        } else {
            setMenuTheme("light");
            setTopbarTheme("blue");
        }

        const layoutLink = document.getElementById("layout-css");
        const layoutHref = "assets/layout/css/layout-" + mode + ".css";
        replaceLink(layoutLink, layoutHref);

        const themeLink = document.getElementById("theme-css");
        const urlTokens = themeLink.getAttribute("href").split("/");
        urlTokens[urlTokens.length - 1] = "theme-" + mode + ".css";
        const newURL = urlTokens.join("/");

        replaceLink(themeLink, newURL, () => {
            setNewThemeLoaded(true);
        });
    };

    return (
        <div className={layoutContainerClassName} onClick={onDocumentClick}>
            <AppTopbar
                horizontal={isHorizontal()}
                activeTopbarItem={activeTopbarItem}
                onMenuButtonClick={onMenuButtonClick}
                onTopbarItemClick={onTopbarItemClick}
                onRightMenuButtonClick={onRightMenuButtonClick}
                onMessageMenuClick={onMessageButtonClick}
                onConfigButtonClick={() => setConfigActive(true)}
                onMobileTopbarButtonClick={onMobileTopbarButtonClick}
                mobileTopbarActive={mobileTopbarActive}
                searchActive={searchActive}
                onSearch={onSearch}
            />

            <div className="menu-wrapper" onClick={onMenuClick}>
                <div className="layout-menu-container">
                    {(inlineMenuPosition === "top" || inlineMenuPosition === "both") && <AppInlineMenu menuKey="top" inlineMenuActive={inlineMenuActive} onInlineMenuClick={onInlineMenuClick} horizontal={isHorizontal()} menuMode={menuMode} />}
                    <AppMenu model={menuItem} onMenuItemClick={onMenuItemClick} onRootMenuItemClick={onRootMenuItemClick} menuMode={menuMode} active={menuActive} />
                    {(inlineMenuPosition === "bottom" || inlineMenuPosition === "both") && <AppInlineMenu menuKey="bottom" inlineMenuActive={inlineMenuActive} onInlineMenuClick={onInlineMenuClick} horizontal={isHorizontal()} menuMode={menuMode} />}
                </div>
            </div>

            <div className="layout-main">
                <AppBreadcrumb routes={routes} />

                <div className="layout-content">{children}</div>
                <AppFooter colorMode={colorMode} />
            </div>

            <AppConfig
                active={configActive}
                onActiveChange={setConfigActive}
                inputStyle={inputStyle}
                onInputStyleChange={onInputStyleChange}
                rippleEffect={ripple}
                onRippleEffect={onRipple}
                menuMode={menuMode}
                onMenuModeChange={onMenuModeChange}
                inlineMenuPosition={inlineMenuPosition}
                onInlineMenuPositionChange={onInlineMenuPositionChange}
                colorMode={colorMode}
                onColorModeChange={onColorModeChange}
                menuTheme={menuTheme}
                onMenuThemeChange={onMenuThemeChange}
                topbarTheme={topbarTheme}
                onTopbarThemeChange={onTopbarThemeChange}
                theme={theme}
                onThemeChange={onThemeChange}
                isRTL={isRTL}
                onRTLChange={onRTLChange}
            />

            <AppRightMenu rightMenuActive={rightMenuActive} onRightMenuButtonClick={onRightMenuButtonClick} />
            {mobileMenuActive && <div className="layout-mask modal-in"></div>}
        </div>
    );
}
