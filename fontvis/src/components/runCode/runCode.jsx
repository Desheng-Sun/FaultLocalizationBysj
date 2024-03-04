// src/app.js
import React, { useState, useEffect } from "react";
import { getFuncInvokeStatic } from "../../api/interface";
import "./runCode.css";
import { FileTextOutlined, BranchesOutlined } from "@ant-design/icons";

// Render editor
import ChartHeader from "../chartHeader/chart-header";
import RunCodeChartText from "./runCodeData";
import RunCodeBranch from "./runCodeBranch";

function RunCodeChart({
  h,
  nowVersion,
  nowCodeVersion,
  firstTest,
  secondTest,
  cursorInFunc,
  highlightFunc,
  isTestCompare,
  sourceCodeCursorLine,
  nowSelectVari,
  variTraceAll,
  chooseVariTraceLine,
  firstTestRunData,
  secondTestRunData,
  changeFirstTestRunData,
  changeSecondTestRunData,
  changeFirstTestRunCode,
  changeSecondTestRunCode,
  changeCursorInFunc,
  changeHighlightFunc,
  changeRunCodeChooseLine,
  changeRunCodeChooseLineVari,
  changeVariTraceAll,
  changeIsWaitData,
}) {
  // 当前数据的展示方式
  const [showStyle, setShowStyle] = useState("text");
  //静态函数信息
  const [funcStatic, setFuncStatic] = useState({});
  useEffect(() => {
    getFuncInvokeStatic(nowVersion).then((res) => {
      setFuncStatic(res);
    });
  }, [nowVersion]);

  return (
    <div className="runCode-chart" style={{ height: h }}>
      <ChartHeader chartName="测试用例执行过程" />
      <div className="runCode-chart-legend">
        <FileTextOutlined
          onClick={() => {
            setShowStyle("text");
          }}
          style={{
            color: `${showStyle === "text" ? "#000" : "#aaa"}`,
          }}
          className="runCode-icon"
        />
        <BranchesOutlined
          onClick={() => {
            setShowStyle("branch");
          }}
          style={{
            color: `${showStyle === "branch" ? "#000" : "#aaa"}`,
          }}
          className="runCode-icon"
        />
        <div className="runCode-chart-legend-legend">
          <svg width={230} height={"100%"}>
            <defs>
              <linearGradient id="GradientFuncLevel">
                <stop offset="0%" stopColor="white" />
                <stop offset="100%" stopColor="rgb(144,238,144)" />
              </linearGradient>
            </defs>
            <text x="0" y="20" fontSize="12">
              代码函数层级
            </text>
            <rect
              x="75"
              y="7.5"
              width="45"
              height="15"
              fill="url(#GradientFuncLevel)"
            />
            <text x="140" y="20" fontSize="12">
              变量追踪
            </text>
            <rect
              x="200"
              y="7.5"
              width="7.5"
              height="15"
              fill="rgb(250,128,114)"
            />
            <rect
              x="207.5"
              y="7.5"
              width="7.5"
              height="15"
              fill="rgb(217, 247, 208)"
            />
          </svg>
        </div>
      </div>
      <div className="runCode-content">
        {showStyle === "text" && (
          <>
            <RunCodeChartText
              nowVersion={nowVersion}
              nowCodeVersion={nowCodeVersion}
              nowTest={firstTest}
              funcStatic={funcStatic}
              componentId={"_1"}
              cursorInFunc={cursorInFunc}
              highlightFunc={highlightFunc}
              sourceCodeCursorLine={sourceCodeCursorLine}
              nowSelectVari={nowSelectVari}
              variTraceAll={variTraceAll}
              chooseVariTraceLine={chooseVariTraceLine}
              changeTestRunData={changeFirstTestRunData}
              changeTestRunCode={changeFirstTestRunCode}
              changeCursorInFunc={changeCursorInFunc}
              changeHighlightFunc={changeHighlightFunc}
              changeRunCodeChooseLine={changeRunCodeChooseLine}
              changeRunCodeChooseLineVari={changeRunCodeChooseLineVari}
              changeVariTraceAll={changeVariTraceAll}
              changeIsWaitData={changeIsWaitData}
            />

            {isTestCompare && (
              <RunCodeChartText
                nowVersion={nowVersion}
                nowCodeVersion={nowCodeVersion}
                nowTest={secondTest}
                funcStatic={funcStatic}
                componentId={"_2"}
                cursorInFunc={cursorInFunc}
                highlightFunc={highlightFunc}
                sourceCodeCursorLine={sourceCodeCursorLine}
                nowSelectVari={nowSelectVari}
                variTraceAll={variTraceAll}
                chooseVariTraceLine={chooseVariTraceLine}
                changeTestRunData={changeSecondTestRunData}
                changeTestRunCode={changeSecondTestRunCode}
                changeCursorInFunc={changeCursorInFunc}
                changeHighlightFunc={changeHighlightFunc}
                changeRunCodeChooseLine={changeRunCodeChooseLine}
                changeRunCodeChooseLineVari={changeRunCodeChooseLineVari}
                changeVariTraceAll={changeVariTraceAll}
                changeIsWaitData={changeIsWaitData}
              />
            )}
          </>
        )}
        {showStyle === "branch" && (
          <RunCodeBranch
            nowVersion={nowVersion}
            nowCodeVersion={nowCodeVersion}
            cursorInFunc={cursorInFunc}
            highlightFunc={highlightFunc}
            firstTest={firstTest}
            secondTest={secondTest}
            firstTestRunData={firstTestRunData}
            secondTestRunData={secondTestRunData}
          />
        )}
      </div>
    </div>
  );
}

export default RunCodeChart;
