import { Toolbar } from "primereact/toolbar";
import React from "react";

const Topbar = ({leftToolbar, rightToolbar}) => {
    /**@leftToolbar => Toolbar for the left side */
    /**@rightToolbar => Toolbar for the right side */
    return <Toolbar className=" p-toolbar" left={leftToolbar} right={rightToolbar} />;
};

export default Topbar;
