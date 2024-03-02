// src/app.js
import React, { useCallback } from "react";
import "./lineVari.css";
import ReactJson from "react-json-view";
import ChartHeader from "../chartHeader/chart-header";

function LineVariChart({ h, w, runCodeChooseLineVari, changeNowSelectVari }) {
  const onVariSelect = useCallback(
    (e) => {
      if (e.namespace.length > 0) {
        changeNowSelectVari([
          runCodeChooseLineVari[0],
          runCodeChooseLineVari[1],
          e.namespace[0],
        ]);
      } else {
        changeNowSelectVari([
          runCodeChooseLineVari[0],
          runCodeChooseLineVari[1],
          e.name,
        ]);
      }
    },
    [runCodeChooseLineVari[0], runCodeChooseLineVari[1]]
  );
  return (
    <div className="lineVari-chart" style={{ height: h, width: w }}>
      <ChartHeader chartName="代码行对应变量值" />
      <div className={"lineVari-chart-lineJson"}>
        <ReactJson
          src={runCodeChooseLineVari[2]}
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

export default LineVariChart;
