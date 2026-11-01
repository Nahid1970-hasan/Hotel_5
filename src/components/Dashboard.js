import ProductionSummary from "pages/Management/DailyProductionSummary/DailyProductionSummary";
import CommercialDashboard from "pages/Commercial/CommercialDashboard/CommercialDashboard";
import MerchandisingDashboard from "pages/Merchandise/MrcDashboard/MerchandisingDashboard";
import InventoryDashboard from "pages/Inventory/InventoryDashboard/InventoryDashboard";
import InternalAuditDashboard from "pages/InternalAudit/InternalAuditDashboard";
import NotificationPage from "pages/Admin/NotificationPage/NotificationPage";
import CompanyWiseStock from "pages/Management/FabricStock/CompanyWiseStock";
import BuyerWiseFabric from "pages/Management/FabricStock/BuyerWiseFabric";
import AgeWiseFabric from "pages/Management/FabricStock/AgeWiseFabric";
import PostCostingSummary from "pages/Management/PostCostingSummary";
import { errorHandler } from "utilities/errorHandler/errorHandler";
import { TableForDashboard } from "./Table/TableForDashboard";
import { getMasterDashboard } from "./DashboardApi/api";
import { Skeleton } from "primereact/skeleton";
import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Chart } from "primereact/chart";
import InvoicePendingAgainstChallan from "pages/Commercial/CommercialDashboard/InvoicePendingAgainstChallan";
import InvoiceCreatedandSubmittedtoBank from "pages/Commercial/CommercialDashboard/InvoiceCreatedandSubmittedtoBank";
import BLPending from "pages/Commercial/CommercialDashboard/BLPending";
import InvoicetoPayment from "pages/Management/CommercialAreaMonitoring/InvoicetoPayment";
import MonthlyShipment from "../pages/Management/PendingAreaMonitoring/MonthlyShipment/MonthlyShipment";
import ShipmentMonitoring from "../pages/Management/PendingAreaMonitoring/ShipmentMonitoring/ShipmentMonitoring";
import ExportPaymentAging from "pages/Commercial/CommercialDashboard/ExportPaymentAging";
import ShipmentFollowUpChart from "pages/Commercial/CommercialDashboard/ShipmentFollowUpChart";
import MisDashboard from "pages/Merchandise/MrcDashboard/MisDashboard";
import RealizeCollectionSummary from "pages/Management/CommercialAreaMonitoring/RealizeCollectionSummary";

// Start Pie Chart Options
const getPieChartOptions = () => {
    const textColor = getComputedStyle(document.body).getPropertyValue("--text-color") || "rgba(0, 0, 0, 0.87)";
    const fontFamily = getComputedStyle(document.body).getPropertyValue("--font-family");

    return {
        plugins: {
            legend: {
                position: "right",
                labels: {
                    fontFamily,
                    color: textColor,
                    boxWidth: 20,
                    padding: 20,
                    font: {
                        size: 14,
                    },
                },
            },
            tooltip: {
                bodyFont: { size: 14, family: fontFamily },
                titleFont: { size: 16, family: fontFamily },
            },
        },
        maintainAspectRatio: false,
        animation: {
            animateScale: true,
            animateRotate: true,
        },
    };
}; // End

export const Dashboard = (props) => {
    useEffect(() => {
        fetchAndGetMasterDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // START DATA FETCH
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState([]);
    const [singleData, setSingleData] = useState([]);
    const [dashboardPermission, setDashboardPermission] = useState(null);
    const [dataList, setDataList] = useState([]);
    const [pieChartData, setPieCharts] = useState(null);
    const [tableData, setTableData] = useState(null);

    // Add these state variables near your other state variables
    const [selectedTable, setSelectedTable] = useState(null);
    const [tableDialogVisible, setTableDialogVisible] = useState(false);

    // Add this handler function near your other handlers
    const handleTableClick = (tableData) => {
        setSelectedTable(tableData);
        setTableDialogVisible(true);
    };

    const fetchAndGetMasterDashboard = async () => {
        const date = new Date();
        try {
            setLoading(true);
            const response = await getMasterDashboard(date?.toISOString());
            setDashboardPermission(response?.dashboardPermission);
            setDashboardData(response.barChart);
            setSingleData(response.singleData);
            setDataList(response.dataList);
            setPieCharts(response.pieChart.map(transformPieData));
            setTableData(response.tableData);
            setLoading(false);
        } catch (err) {
            errorHandler();
            setLoading(false);
        }
    }; //end

    // Pie Chart Function:
    const transformPieData = (apiData) => {
        const colors = getColors(props.colorMode);
        const colorKeys = Object.keys(colors);
        const borderColor = getComputedStyle(document.body).getPropertyValue("--divider-color") || "rgba(160, 167, 181, .3)";

        return {
            dashboardTitle: apiData.dashboardTitle,
            labels: apiData.labels,
            datasets: apiData.datasets.map((dataset, index) => ({
                label: dataset.label,
                data: dataset.data.map(Number),
                backgroundColor: apiData.labels.map((_, i) => colors[colorKeys[(i + index) % colorKeys.length]]),
                borderColor: borderColor,
                hoverOffset: 15,
                borderWidth: 1,
            })),
        };
    };

    const getColors = (colorMode) => {
        const isLight = colorMode === "light";
        return {
            pinkColor: isLight ? "#EC407A" : "#F48FB1",
            purpleColor: isLight ? "#AB47BC" : "#CE93D8",
            deeppurpleColor: isLight ? "#7E57C2" : "#B39DDB",
            indigoColor: isLight ? "#5C6BC0" : "#9FA8DA",
            blueColor: isLight ? "#42A5F5" : "#90CAF9",
            lightblueColor: isLight ? "#29B6F6" : "#81D4FA",
            cyanColor: isLight ? "#00ACC1" : "#4DD0E1",
            tealColor: isLight ? "#26A69A" : "#80CBC4",
            greenColor: isLight ? "#66BB6A" : "#A5D6A7",
            lightgreenColor: isLight ? "#9CCC65" : "#C5E1A5",
            limeColor: isLight ? "#D4E157" : "#E6EE9C",
            yellowColor: isLight ? "FFEE58" : "#FFF59D",
            amberColor: isLight ? "#FFCA28" : "#FFE082",
            orangeColor: isLight ? "#FFA726" : "#FFCC80",
            deeporangeColor: isLight ? "#FF7043" : "#FFAB91",
            brownColor: isLight ? "#8D6E63" : "#BCAAA4",
        };
    };
    //end

    const getLightTheme = () => {
        let basicOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        color: "#495057",
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: "#495057",
                    },
                    grid: {
                        color: "#ebedef",
                    },
                },
                y: {
                    ticks: {
                        color: "#495057",
                    },
                    grid: {
                        color: "#ebedef",
                    },
                },
            },
        };

        return {
            basicOptions,
        };
    };
    const { basicOptions } = getLightTheme();

    // Define an array of colors for your datasets
    const colors = [
        "#00ACC1",
        "#F9E07F",
        "#A7D676",
        "#EAB595",
        "#7E9680",
        "#AE6378",
        "#A8DEE0",
        "#C2649A",
        // Add more colors as needed
    ];

    // Start Single Data
    const parseLabelAndValue = (str) => {
        if (!str) return null;
        const [label, val] = str.split(" - ");
        return {
            label: label?.trim(),
            value: val?.trim() || "0",
        };
    };

    const formatNumber = (num) => {
        const number = parseFloat(num);
        if (isNaN(number)) return num || "0";

        const decimalPart = num.toString().split(".")[1];
        if (!decimalPart) return number.toString();
        if (decimalPart.length > 2) return number.toFixed(2);
        return number.toString();
    };

    const getCardColor = (label) => {
        const colorMap = {
            Total: ["#6366f1", "#8b5cf6"],
            Male: ["#3b82f6", "#60a5fa"],
            Female: ["#ec4899", "#f472b6"],
            New: ["#22c55e", "#4ade80"],
            Left: ["#ef4444", "#f87171"],
            Expense: ["#ef4444", "#f87171"],
            Revenue: ["#10b981", "#34d399"],
            Assets: ["#f59e0b", "#fbbf24"],
        };
        return {
            start: colorMap[label]?.[0] || "#64748b",
            end: colorMap[label]?.[1] || "#94a3b8",
        };
    };

    const getCardIcon = (label) => {
        const icons = {
            Total: "pi-users",
            Male: "pi-male",
            Female: "pi-female",
            New: "pi-user-plus",
            Left: "pi-user-minus",
            Expense: "pi-money-bill",
            Revenue: "pi-chart-line",
            Assets: "pi-briefcase",
        };
        return icons[label] || "pi-info-circle";
    }; // End Single Data

    // START LAODING
    const SimpleCardSkeleton = () => (
        <div className="bg-white shadow-md rounded-2xl p-5 flex flex-col min-h-[270px] gap-y-4">
            <Skeleton width="60%" height="1.5rem" />
            <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height="3rem" className="rounded-lg" />
                ))}
            </div>
        </div>
    );

    const SimpleChartSkeleton = () => (
        <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse">
            <div className="h-full flex items-center justify-center text-gray-400">
                <i className="pi pi-chart-line text-4xl" />
            </div>
        </div>
    );

    const SimpleListSkeleton = () => (
        <div className="card h-full">
            <Skeleton width="50%" height="1.5rem" className="mb-4" />
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between mb-3">
                    <Skeleton width="40%" height="1rem" />
                    <Skeleton width="20%" height="1rem" />
                </div>
            ))}
        </div>
    );
    // END LAODING

    // Start Table
    const generateTableColumns = (sampleData) => {
        if (!sampleData) return [];

        const columns = [];
        let i = 1;

        while (sampleData[`columnName${i}`]) {
            columns.push({
                field: `columnValue${i}`,
                header: sampleData[`columnName${i}`] || `Column ${i}`,
                style: { width: "30%" },
            });
            i++;
        }

        return columns;
    };

    return (
        <div>
            {/* START OTHER DASHBAORD */}
            {dashboardPermission?.includes("Notification Dashboard") && (
                <div>
                    <NotificationPage />
                </div>
            )}

            {/* Realize Collection Summary */}
            {dashboardPermission?.includes("Realize Collection Summary") && (
                <div className="mb-20">
                    <RealizeCollectionSummary />
                </div>
            )}
          
            {/* Shipment Follow Up Chart */}
            {dashboardPermission?.includes("Shipment Follow Up Chart") && (
                <div className="mb-20">
                    <ShipmentFollowUpChart />
                </div>
            )}

            {/* Invoice to Payment */}
            {dashboardPermission?.includes("Invoice to Payment") && (
                <div className="mb-20">
                    <InvoicetoPayment />
                </div>
            )}

            {/* Export Payment Aging */}
            {dashboardPermission?.includes("Export Payment Aging") && (
                <div className="mb-20">
                    <ExportPaymentAging />
                </div>
            )}

            {/* Invoice Pending Against Challan */}
            {dashboardPermission?.includes("Invoice Pending Against Challan") && (
                <div className="mb-20">
                    <InvoicePendingAgainstChallan />
                </div>
            )}

            {/* BL Pending */}
            {dashboardPermission?.includes("BL Pending") && (
                <div className="mb-20">
                    <BLPending />
                </div>
            )}

            {/* Invoice Created & Submitted to Bank */}
            {dashboardPermission?.includes("Invoice Created & Submitted to Bank") && (
                <div className="mb-20">
                    <InvoiceCreatedandSubmittedtoBank />
                </div>
            )}

            {/* Export Monthly Shipment Summary */}
            {dashboardPermission?.includes("Export Monthly Shipment Summary") && (
                <div className="mb-20">
                    <MonthlyShipment />
                </div>
            )}

            {/* Export Invoice Summary */}
            {dashboardPermission?.includes("Export Invoice Summary") && (
                <div className="mb-20">
                    <ShipmentMonitoring />
                </div>
            )}

            {/* START_FABRIC_STOCK_DASHBOARD */}
            {dashboardPermission?.includes("Fabric Stock Aging Dashboard") && (
                <div className="mb-20">
                    <AgeWiseFabric />
                </div>
            )}
            {dashboardPermission?.includes("Fabric Stock Dashboard") && (
                <div className="mb-20">
                    <CompanyWiseStock />
                </div>
            )}
            {dashboardPermission?.includes("Buyer Wise Fabric Stock Dashboard") && (
                <div className="mb-20">
                    <BuyerWiseFabric />
                </div>
            )}
            {/* END_FABRIC_STOCK_DASHBOARD */}

            {dashboardPermission?.includes("Post Costing Analysis") && (
                <div className="px-2 py-5">
                    <div className="border-2 border-[#1565C0] rounded-lg">
                        <div className="mb-3">
                            <h2 className="text-xl font-bold text-center bg-[#1565C0] text-white rounded-tl-lg rounded-tr-lg py-2 uppercase">POST COSTING ANALYSIS</h2>
                        </div>

                        <PostCostingSummary paginatorCondition={1} />
                    </div>
                </div>
            )}
            {dashboardPermission?.includes("Merchandising Dashboard") && (
                <div>
                    <MerchandisingDashboard />
                </div>
            )}

            <div className="p-6">
                {/* START_INVENTORY_DASHBOARD */}
                {dashboardPermission?.includes("Inventory Dashboard") && (
                    <div className="mb-20">
                        <InventoryDashboard />
                    </div>
                )}
                {/* END_INVENTORY_DASHBOARD */}

                {/* START_INTERNAL_AUDIT_DASHBOARD */}
                {(dashboardPermission?.includes("Audit Dashboard") ||
                    dashboardPermission?.includes("Order Summary Dashboard") ||
                    dashboardPermission?.includes("Upcomming Order Closing List") ||
                    dashboardPermission?.includes("Close Order Summary Dashboard") ||
                    dashboardPermission?.includes("Buyer Wise Close Order Summary Dashboard")) && (
                    <div className="mb-20">
                        <InternalAuditDashboard dashboardPermission={dashboardPermission} loading={loading} />
                    </div>
                )}
                {/* END_INTERNAL_AUDIT_DASHBOARD */}

                {/* START_IPRODUCT_DASHBOARD */}
                {(dashboardPermission?.includes("Daily Production Summary") || dashboardPermission?.includes("Monthly Production Summary") || dashboardPermission?.includes("Buyer Wise Production Summary")) && (
                    <div className="mb-20">
                        <ProductionSummary dashboardPermission={dashboardPermission} />
                    </div>
                )}
                {/* END_IPRODUCT_DASHBOARD */}

                {/* STAR PRIVATE DASHBAORD INFO */}
                <div>
                    {/* SINGLE DATA CARD START */}
                    <div>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-10 my-5 w-full">
                                {[1, 2, 3].map((i) => (
                                    <SimpleCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-10 my-5 w-full">
                                {singleData?.map((dataItem, index) => {
                                    const dataValues = [dataItem.value, dataItem.value2, dataItem.value3].filter(Boolean);

                                    return (
                                        <div key={index} className="bg-white shadow-md rounded-2xl p-5 flex flex-col min-h-[270px] gap-y-4">
                                            <h4 className="text-lg font-bold">{dataItem.dashboardTitle}</h4>

                                            <div className="flex flex-col gap-4">
                                                {dataValues.map((rawStr, idx) => {
                                                    const parsed = parseLabelAndValue(rawStr);
                                                    if (!parsed) return null;

                                                    const { label, value } = parsed;
                                                    const color = getCardColor(label);
                                                    const icon = getCardIcon(label);
                                                    const isUpcomingOrder = dataItem.dashboardTitle === "Upcomming Order Close";

                                                    // Determine background class and text colors
                                                    let bgClass = "";
                                                    let textColor = "text-white";
                                                    let iconColor = "text-white";

                                                    if (isUpcomingOrder) {
                                                        if (label.includes("3 days")) {
                                                            bgClass = "bg-red-500";
                                                            textColor = "text-white";
                                                            iconColor = "text-white";
                                                        } else if (label.includes("7 days")) {
                                                            bgClass = "bg-red-300";
                                                            textColor = "text-black";
                                                            iconColor = "text-black";
                                                        } else if (label.includes("15 days")) {
                                                            bgClass = "bg-red-100";
                                                            textColor = "text-gray-800";
                                                            iconColor = "text-red-600";
                                                        }
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`flex items-center justify-between px-4 py-2 rounded-xl ${bgClass}`}
                                                            style={
                                                                !isUpcomingOrder
                                                                    ? {
                                                                          background: `linear-gradient(135deg, ${color.start}, ${color.end})`,
                                                                      }
                                                                    : {}
                                                            }
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <i className={`pi ${icon} ${iconColor} text-xl`} />
                                                                <span className={`font-medium ${textColor}`}>{label}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`text-2xl font-bold ${textColor}`}>{formatNumber(value)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {/* SINGLE DATA CARD END */}
                    {/* BAR CHART START */}
                    <div>
                        {" "}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {[1, 2].map((i) => (
                                    <SimpleChartSkeleton key={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="p-col-12 p-lg-12 my-8">
                                <div>
                                    {dashboardData && dashboardData.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-6">
                                            {dashboardData.map((chartData, index) => (
                                                <div key={index} className="w-full bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                                    <div className="mb-6">
                                                        <h5 className="text-xl md:text-2xl font-semibold text-gray-800">{chartData.dashboardTitle}</h5>
                                                    </div>
                                                    <div style={{ height: "500px", width: "100%" }}>
                                                        <Chart
                                                            type="bar"
                                                            data={{
                                                                ...chartData,
                                                                datasets: chartData.datasets.map((dataset, i) => ({
                                                                    ...dataset,
                                                                    backgroundColor: colors[i % colors.length],
                                                                })),
                                                            }}
                                                            options={{
                                                                ...basicOptions,
                                                                maintainAspectRatio: false,
                                                                responsive: true,
                                                                plugins: {
                                                                    legend: {
                                                                        position: "top",
                                                                        labels: {
                                                                            padding: 20,
                                                                            font: {
                                                                                size: 14,
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                scales: {
                                                                    x: {
                                                                        ticks: {
                                                                            font: {
                                                                                size: 12,
                                                                            },
                                                                        },
                                                                    },
                                                                    y: {
                                                                        ticks: {
                                                                            font: {
                                                                                size: 12,
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                            }}
                                                            style={{ height: "100%", width: "100%" }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center w-full"></div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* BAR CHART END */}
                    {/* TABLE DATA START */}
                    <div>
                        {loading ? (
                            <div className="grid col-span-1 md:grid-cols-2 gap-5 w-full my-6">
                                {[1, 2].map((i) => (
                                    <SimpleCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="grid col-span-1 md:grid-cols-2 gap-5 w-full my-6">
                                {tableData?.map((tableSection, index) => (
                                    <div key={index} className="card shadow-lg relative group w-full">
                                        {/* Clickable hover message */}
                                        <div className="table-hover-message absolute bottom-0 right-0 z-10 mb-4 mr-4 text-white bg-gray-800 px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => handleTableClick(tableSection)}>
                                            <i className="pi pi-search-plus mr-1"></i> Click to expand
                                        </div>

                                        <div className="!text-xs w-full">
                                            <TableForDashboard
                                                rows={10}
                                                emptyMessage="No data found"
                                                tableHeaderName={tableSection.dashboardTitle}
                                                isTopbarShow={true}
                                                newBtn={false}
                                                exportBtn={true}
                                                importExportBtn={true}
                                                tableColumns={generateTableColumns(tableSection.datalist[0])}
                                                data={tableSection.datalist}
                                                loading={loading}
                                                dataKey="columnValue1"
                                                actionButtonWidth={10}
                                                isSelectable={false}
                                                searchShow={false}
                                                scrollable={false}
                                                style={{ width: "100%" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* TABLE DATA END */}
                    {/* DATA LIST START */}
                    <div>
                        {loading ? (
                            <div className="grid col-span-1 md:grid-cols-3 gap-4 my-6 w-full">
                                {[1, 2, 3].map((i) => (
                                    <SimpleListSkeleton key={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="grid col-span-1 md:grid-cols-3 gap-4 my-6 w-full text-sm">
                                {dataList.map((category, index) => (
                                    <div className="col-span-1" key={index}>
                                        <div className="card height-100 widget-topsearchs">
                                            <div className="card-header">
                                                <p className="!font-semibold">{category.dashboardTitle}</p>
                                            </div>
                                            {category.value.map((item, itemIndex) => (
                                                <div className="p-d-flex p-jc-between item" key={itemIndex}>
                                                    <span>{item.dataName}</span>
                                                    <span className="text-black font-bold">{Number(parseFloat(item.value).toFixed(2)).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* DATA LIST END */}
                    {/* PIE CHART START */}
                    <div>
                        {loading ? (
                            <div className="grid col-span-1 md:grid-cols-3 gap-5 w-full">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="card h-[400px] flex items-center justify-center">
                                        <i className="pi pi-spinner pi-spin text-2xl text-gray-500" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid col-span-1 md:grid-cols-3 gap-5 w-full">
                                {loading ? (
                                    <div className="animate-pulse text-center font-semibold w-full">Loading Pie Chart..</div>
                                ) : (
                                    <>
                                        {Array.isArray(pieChartData) && pieChartData.length > 0 ? (
                                            pieChartData.map((pieData, index) => (
                                                <div className="col-span-1" key={index}>
                                                    <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300">
                                                        <div className="card-header p-py-3 p-px-4 border-bottom-1 surface-border">
                                                            <p className="text-center m-0 text-xl font-bold text-primary">{pieData?.dashboardTitle || "No Title"}</p>
                                                        </div>
                                                        <div className="p-d-flex p-jc-center p-ai-center" style={{ minHeight: "400px", padding: "1rem" }}>
                                                            {pieData ? (
                                                                <Chart
                                                                    style={{
                                                                        position: "relative",
                                                                        width: "100%",
                                                                        maxWidth: "500px",
                                                                    }}
                                                                    type="pie"
                                                                    data={pieData}
                                                                    options={getPieChartOptions()}
                                                                />
                                                            ) : (
                                                                <p>Chart data not available</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div></div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    {/* PIE CHART END */}

                    <Dialog header={selectedTable?.dashboardTitle || "Table Details"} visible={tableDialogVisible} style={{ width: "90vw", maxWidth: "1200px" }} onHide={() => setTableDialogVisible(false)} maximizable>
                        {selectedTable && (
                            <div style={{ overflow: "auto" }}>
                                <TableForDashboard
                                    rows={20}
                                    emptyMessage="No data found"
                                    tableHeaderName={selectedTable.dashboardTitle}
                                    isTopbarShow={true}
                                    newBtn={false}
                                    exportBtn={true}
                                    importExportBtn={true}
                                    tableColumns={generateTableColumns(selectedTable.datalist[0])}
                                    data={selectedTable.datalist}
                                    loading={false}
                                    dataKey="columnValue1"
                                    actionButtonWidth={10}
                                    isSelectable={false}
                                    scrollable
                                    scrollHeight="flex"
                                    searchShow={false}
                                />
                            </div>
                        )}
                    </Dialog>
                </div>
                {/* END PRIVATE DASHBAORD INFO */}
            </div>
            {/* END OTHER DASHBAORD */}
        </div>
    );
};