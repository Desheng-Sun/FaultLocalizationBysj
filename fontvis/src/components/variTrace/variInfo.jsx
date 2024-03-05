// src/app.js
import React, { useState, useEffect } from "react";
import "./variTrace.css";
import { Tabs, Button } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import ReactJson from "react-json-view";

function VariInfoChart({
  h,
  w,
  variTraceAll,
  id,
  changeCloseId,
  deleteVariTraceAll,
  changeChooseVariTraceLine,
  changeNowSelectVari,
}) {
  const [variTraceName, setVariTraceName] = useState([]);
  const [variTraceInfo, setVariTraceInfo] = useState({});
  useEffect(() => {
    let useData = [];
    if (variTraceName.length === 0 && variTraceAll.length !== 0) {
      setVariTraceInfo(variTraceAll[0]);
    }
    for (let i of variTraceAll) {
      for (let j in i) useData.push(j);
    }
    setVariTraceName(useData);
  }, [variTraceAll, variTraceName.length]);
  const onVariSelect = function (e) {
    if (e.namespace.length > 1) {
      changeChooseVariTraceLine([
        e.namespace[0].split(": ")[0],
        e.namespace[1],
      ]);
    } else {
      changeChooseVariTraceLine([e.namespace[0].split(": ")[0], e.name]);
    }
  };
  const variTraceChange = function (e) {
    for (let i of variTraceAll) {
      for (let j in i) {
        if (j === e) {
          setVariTraceInfo(i);
        }
      }
    }
  };
  const closeThisPage = function () {
    changeCloseId(id);
  };
  const onEdit = function (targetKey) {
    deleteVariTraceAll(targetKey);
    changeNowSelectVari(["", 0, ""]);
  };

  return (
    <div className="variInfo-chart" style={{ width: w, height: h }}>
      <div className="variInfo-chart-titles">
        <div className="variInfo-chart-titles-tabs">
          <Tabs
            defaultActiveKey="1"
            size="small"
            type="editable-card"
            items={variTraceName.map((name) => {
              return {
                label: name,
                key: name,
              };
            })}
            hideAdd
            onEdit={onEdit}
            onChange={variTraceChange}
          />
        </div>
        <div className="variInfo-chart-titles-clickButton">
          <Button
            type="default"
            shape="circle"
            icon={<CloseCircleOutlined />}
            size="small"
            onClick={closeThisPage}
          />
        </div>
      </div>
      <div className="variInfo-chart-variInfo">
        <ReactJson
          src={variTraceInfo}
          width={w}
          name={false}
          displayDataTypes={false}
          displayObjectSize={false}
          enableClipboard={false}
          onSelect={onVariSelect}
        />
      </div>
    </div>
  );
}

export default VariInfoChart;
