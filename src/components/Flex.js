import styled from "styled-components";

export const Flex = styled.div(({ row, md, xs, sm, theme, justifyCenter,padding }) => {
  let gridRatioMD = (md || sm || xs || theme.grid) / theme.grid;
  let gridRatioSM = (sm || xs || theme.grid) / theme.grid;
  let gridRatioXS = (xs || theme.grid) / theme.grid;
  return row
    ? `
      display: flex;
      box-sizing: border-box;
      flex-wrap: wrap;
      width: 100%;
      flex-direction: row;
      /* align-items: center; */

      /* &>div:last-child{
        padding-right: 0px !important;
      } */
      
      /* &>div:first-child{
        padding-left: 0px !important;
      } */
      ${justifyCenter ? "justify-content:center;" : ""}
     
    `
    : `
      padding: ${padding?padding:"10px"};
      box-sizing: border-box;
      flex-basis:${gridRatioMD * 100 + "%"};
      width:${gridRatioMD * 100 + "%"};
  
      @media(max-width:${theme.layout.xs}){
        flex-basis:
          ${gridRatioXS * 100 + "%"};
        width:
          ${gridRatioXS * 100 + "%"};
        
        padding-left: ${gridRatioXS == 1 ? "0px !important" : "10px"};
        padding-right: 0px;
      }
  
      @media(max-width:${theme.layout.sm}) and (min-width:${theme.layout.xs}){
        flex-basis:${gridRatioSM * 100 + "%"};
        
        width:${gridRatioSM * 100 + "%"};
        
        padding-left: ${gridRatioSM == 1 ? "0px !important" : "10px"};
        padding-right: ${gridRatioSM == 1 ? "0px !important" : "10px"};
      }
  
      @media(min-width: ${theme.layout.sm}){
        flex-basis:${gridRatioMD * 100 + "%"};
        width:${gridRatioMD * 100 + "%"};
        padding-left: ${gridRatioMD == 1 ? "0px !important" : "10px"};
        padding-right: ${gridRatioMD == 1 ? "0px !important" : "10px"};
      }
  
    `;
});