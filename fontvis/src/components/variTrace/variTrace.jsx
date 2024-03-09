// src/app.js
import React, { useState, useEffect, useCallback } from "react";
import { FloatButton } from "antd";
import { PlusCircleTwoTone } from "@ant-design/icons";
import VariInfoChart from "./variInfo";
import "./variTrace.css";
import ChartHeader from "../chartHeader/chart-header";

function VariTraceChart({
  h,
  w,
  variTraceAll,
  changeNowSelectVari,
  changeVariTraceAll,
  changeChooseVariTraceLine,
}) {
  const [variPageNum, setVariPageNum] = useState([1]);
  const [closeId, setCloseId] = useState(0);
  const addVariPage = useCallback(() => {
    if (variPageNum.length >= 3) {
      return;
    }
    variPageNum.push(variPageNum[variPageNum.length - 1] + 1);
    setVariPageNum([...variPageNum]);
  }, [variPageNum]);
  const changeCloseId = function (data) {
    setCloseId(data);
  };
  useEffect(() => {
    let useData = [];
    // 在父元素中删除对应的追踪页面
    if (variPageNum.length <= 1) {
      return;
    }
    for (let i of variPageNum) {
      if (i !== closeId) {
        useData.push(i);
      }
    }
    setVariPageNum(useData);
  }, [closeId, variPageNum]);

  const deleteVariTraceAll = function (data) {
    let useData = [];
    for (let i of variTraceAll) {
      let isDelete = false;
      for (let j in i) {
        if (j === data) {
          isDelete = true;
        }
      }
      if (!isDelete) {
        useData.push(i);
      }
    }
    changeVariTraceAll([...useData]);
  };

  return (
    <div className="variTrace-chart" style={{ width: w, height: h }}>
      <ChartHeader chartName="变量追踪" />
      <FloatButton
        shape="circle"
        type="default"
        style={{
          right: 20,
          buttom: 20,
        }}
        onClick={addVariPage}
        icon={<PlusCircleTwoTone />}
      />
      <div className="variTrace-chart-variInfo">
        {variTraceAll.length > 0 &&
          variPageNum.map((data) => {
            return (
              <div className="variTrace-chart-variInfo-page" key={data}>
                <VariInfoChart
                  h={h}
                  w={w / variPageNum.length}
                  variTraceAll={variTraceAll}
                  id={data}
                  changeCloseId={changeCloseId}
                  deleteVariTraceAll={deleteVariTraceAll}
                  changeChooseVariTraceLine={changeChooseVariTraceLine}
                  changeNowSelectVari={changeNowSelectVari}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default VariTraceChart;
