import React, { useState, useEffect } from "react";
import { getAllTestCase } from "../../api/interface";
import { PieChartOutlined, TableOutlined } from "@ant-design/icons";
import "./testCaseList.css";
import ChartHeader from "../chartHeader/chart-header";
import TestCaseListChart from "./testCaseListChart.jsx";
import TestCaseListTable from "./testCaseListTable.jsx";

function TestCaseList({ nowVersion, changeFirstTest, firstTest, secondTest }) {
  // 当前数据的展示方式
  const [showStyle, setShowStyle] = useState("chart");

  // 获取所有的测试用例------------------------------------------------------------
  const [testCase, setTestCase] = useState({});
  useEffect(() => {
    getAllTestCase().then((res) => {
      setTestCase(res);
    });
  }, []);

  return (
    <div
      style={{ background: "#fff", height: "100%" }}
      className="testCaseList"
    >
      <ChartHeader chartName="测试用例列表" />
      <div className="testCaseList-showStyle">
        <PieChartOutlined
          onClick={() => {
            setShowStyle("chart");
          }}
          style={{
            color: `${showStyle === "chart" ? "#000" : "#aaa"}`,
          }}
          className="testCaseList-icon"
        />
        <TableOutlined
          onClick={() => {
            setShowStyle("table");
          }}
          style={{
            color: `${showStyle === "table" ? "#000" : "#aaa"}`,
          }}
          className="testCaseList-icon"
        />
        <div id="testList-case-chart-legend">
          <svg width={170} height={"100%"}>
            <defs>
              <linearGradient id="Gradient1">
                <stop class="stop1" offset="0%" stopColor="#90EE90" />
                <stop class="stop3" offset="50%" stopColor="white" />
                <stop class="stop3" offset="100%" stopColor="#FA8072" />
              </linearGradient>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            <text x="0" y="20" fontSize="12">
              正确
            </text>
            <text x="135" y="20" fontSize="12">
              错误
            </text>
            <rect
              x="30"
              y="7.5"
              width="100"
              height="15"
              fill="url(#Gradient1)"
            />
            <line
              x1="40"
              y1="10"
              x2="65"
              y2="20"
              stroke="black"
              marker-end="url(#arrow)"
            />
            <line
              x1="95"
              y1="20"
              x2="120"
              y2="10"
              stroke="black"
              marker-end="url(#arrow)"
            />
          </svg>
        </div>
      </div>
      <div className="testCaseList-content">
        {showStyle === "chart" && (
          <TestCaseListChart
            nowVersion={nowVersion}
            changeFirstTest={changeFirstTest}
            firstTest={firstTest}
            showStyle={showStyle}
            testCase={testCase}
          />
        )}
        {showStyle === "table" && (
          <TestCaseListTable
            nowVersion={nowVersion}
            firstTest={firstTest}
            secondTest={secondTest}
            testCase={testCase}
          />
        )}
      </div>
    </div>
  );
}

export default TestCaseList;
