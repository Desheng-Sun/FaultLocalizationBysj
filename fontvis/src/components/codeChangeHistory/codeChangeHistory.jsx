// src/app.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCodeChangeHistory, getNewVersionData } from "../../api/interface";
import { Select, Button } from "antd";
import "./codeChangeHistory.css";
import ChartHeader from "../chartHeader/chart-header";

function CodeChangeHistoryChart({
  h,
  nowVersion,
  nowCodeVersion,
  changeNowVersion,
  changeNowCodeVersion,
  changeIsWaitData,
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
  const addVersion = useCallback(() => {
    let nextVersion = parseInt(nowVersion.replace("v", "")) + 1;
    nextVersion = "v" + nextVersion;
    changeIsWaitData(true);
    getNewVersionData(nextVersion).then(() => {
      changeIsWaitData(false);
      changeNowVersion(nextVersion);
      changeNowCodeVersion(nextVersion);
    });
  }, [nowVersion]);

  useEffect(() => {
    getCodeChangeHistory().then((res) => {
      setCodeChangeHistory(res);
    });
  }, [nowVersion, nowCodeVersion]);

  useEffect(() => {
    console.log(codeChangeHistory);
    if (Object.keys(codeChangeHistory).length > 0) {
      setNowChangeHistory(codeChangeHistory[nowSelectVersion]);
    }
  }, [nowSelectVersion, codeChangeHistory]);

  const optionData = useMemo(() => {
    if (Object.keys(codeChangeHistory).length) {
      return Object.keys(codeChangeHistory).map((name) => {
        return {
          label: name,
          value: name,
        };
      });
    }
    return [];
  }, [codeChangeHistory]);
  return (
    <div className="codeChangeHistory-chart" style={{ height: h }}>
      <ChartHeader chartName="代码修改历史" />
      <div className="codeChangeHistory-chart-legend">
        <svg width={"100%"} height={"100%"}>
          <text x="5" y="20" fontSize="12">
            新增代码
          </text>
          <rect
            x="55"
            y="10"
            width="30"
            height="10"
            fill="rgb(217, 247, 208)"
          />
          <text x="105" y="20" fontSize="12">
            删除代码
          </text>
          <rect x="160" y="10" width="30" height="10" fill="rgb(250,128,114)" />
          <text x="210" y="20" fontSize="12">
            修改代码
          </text>
          <rect x="265" y="10" width="30" height="10" fill="rgb(255,250,205)" />
        </svg>
      </div>
      <div className="codeChangeHistory-chart-legend">
        <div className="codeChangeHistory-chart-legend-control">
          历史版本:
          <Select
            options={optionData}
            value={nowSelectVersion}
            defaultValue={nowSelectVersion}
            onChange={(value) => {
              setNowSelectVersion(value);
            }}
            style={{
              width: 100,
              height: 30,
              marginLeft: 10,
              marginRight: 10,
            }}
          />
        </div>
        <Button
          type="default"
          size="middle"
          style={{
            width: 100,
            height: 30,
            marginRight: 10,
            marginLeft: 10,
          }}
          onClick={addVersion}
        >
          确认修改
        </Button>
      </div>
      <div className="codeChangeHistory-chart-historyData">
        {nowChangeHistory.map((lineData) => {
          return (
            <div className="codeChangeHistory-chart-historyData-lineChange">
              {lineData.map((lineValue) => {
                return (
                  <div className="codeChangeHistory-chart-historyData-lineData">
                    <div
                      className={`codeChangeHistory-chart-historyData-lineData ${lineValue[0][1]}`}
                    >
                      {lineValue[0][0]}
                    </div>
                    <div className="codeChangeHistory-chart-historyData-lineData-linecode">
                      {lineValue.map((line, index) => {
                        if (index === 0) {
                          return <></>;
                        }
                        return <span className={line[1]}>{line[0]}</span>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CodeChangeHistoryChart;
