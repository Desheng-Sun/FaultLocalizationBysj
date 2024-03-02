// src/app.js
import React, { useState, useEffect, useCallback } from "react";
import { getCodeChangeHistory, getNewVersionData } from "../../api/interface";
import { Select, Button } from "antd";
import "./codeChangeHistory.css";
import * as d3 from "d3";
import ChartHeader from "../chartHeader/chart-header";

function CodeChangeHistoryChart({
  h,
  nowVersion,
  nowCodeVersion,
  changeNowVersion,
  changeNowCodeVersion,
}) {
  const [codeChangeHistory, setCodeChangeHistory] = useState({});
  const [nowChangeHistory, setNowChangeHistory] = useState([]);
  const [nowSelectVersion, setNowSelectVersion] = useState("v0");
  useEffect(() => {
    if (nowVersion !== nowCodeVersion) {
      setNowSelectVersion(nowCodeVersion);
    } else {
      setNowSelectVersion(nowVersion);
    }
  }, [nowVersion, nowCodeVersion]);
  const addVersion = useCallback (() => {
    let nextVersion = parseInt(nowVersion.replace("v", "")) + 1;
    nextVersion = "v" + nextVersion;
    getNewVersionData(nextVersion).then(() => {
      changeNowVersion(nextVersion);
      changeNowCodeVersion(nextVersion)
    });
  }, [nowVersion]);
  useEffect(() => {
    getCodeChangeHistory().then((res) => {
      setCodeChangeHistory(res);
    });
  }, [nowVersion, nowCodeVersion]);

  useEffect(() => {
    if (Object.keys(codeChangeHistory).length > 0) {
      setNowChangeHistory(codeChangeHistory[nowSelectVersion]);
    }
  }, [nowSelectVersion, codeChangeHistory]);
  return (
    <div className="codeChangeHistory-chart" style={{ height: h }}>
      <ChartHeader chartName="代码修改历史" />
      <div className="sourceCode-chart-legend">
        <svg width={400} height={"100%"}>
          <text x="0" y="20" fontSize="12">
            当前版本
          </text>
          <rect
            x="65"
            y="7.5"
            width="45"
            height="15"
            fill="rgb(217, 247, 208)"
          />
          <text x="140" y="20" fontSize="12">
            上版本
          </text>
          <rect
            x="205"
            y="7.5"
            width="45"
            height="15"
            fill="rgb(250,128,114)"
          />
        </svg>
      </div>
      <div className="sourceCode-chart-legend">
        <div className="sourceCode-chart-legend-control">
          历史版本:
          <Select
            value={nowVersion}
            onChange={(data) => {
              setNowSelectVersion(data);
            }}
            options={Object.keys(codeChangeHistory).map((name) => {
              return {
                label: name,
                key: name,
              };
            })}
            style={{
              width: 50,
              height: 30,
              marginLeft: 10,
              marginRight: 10,
            }}
          />
        </div>
        <div className="sourceCode-chart-legend-control">
          <Button
            type="default"
            size="middle"
            style={{
              width: 80,
              height: 30,
              marginRight: 10,
              marginLeft: 10,
            }}
            onClick={addVersion}
          >
            确认修改
          </Button>
        </div>
      </div>
      <div id="nodifyList-chart-historyData">
        {/* {nowChangeHistory.map((data) => {
          return <div className={data[0]}>{data[1]}</div>;
        })} */}
      </div>
    </div>
  );
}

export default CodeChangeHistoryChart;
