// src/app.js
import React, { useState, useEffect } from "react";
import "./control.css";
import ChartHeader from "../chartHeader/chart-header";
import { Checkbox, Select } from "antd";
import { getAllTestCase } from "../../api/interface";

function ControlPanel({
  isTestCompare,
  changeIsTestCompare,
  changeFirstTest,
  changeSecondTest,
  firstTest,
  secondTest
}) {
  const [totalTest, setTotalTest] = useState([]);
  useEffect(() => {
    getAllTestCase().then((res) => {
      const nowTest = [];
      for (let i in res) {
        nowTest.push({ value: i });
      }
      setTotalTest(nowTest);
    });
  }, []);

  return (
    <div style={{ background: "#fff", height: "100%" }}>
      <ChartHeader chartName="控制面板" />
      <div className="controlTest">
        <div>
          <Checkbox
            checked={isTestCompare}
            onChange={() => {
              changeIsTestCompare(!isTestCompare);
            }}
          >
            开启测试用例对比
          </Checkbox>
        </div>
        <div className="testSelect">
          <div
            className="testCaseColor"
            style={{ background: "#90EE90" }}
          ></div>
          <Select
            placeholder="选择一个测试用例"
            className={"selectStyle"}
            options={totalTest}
            virtual
            showSearch
            onSelect={(value) => {
              changeFirstTest(value);
            }}
            value={firstTest}
          />
        </div>
        <div className="testSelect" >
          <div
            className="testCaseColor"
            style={{ background: "#FA8072" }}
          ></div>
          <Select
            placeholder="选择一个测试用例"
            className={"selectStyle"}
            options={totalTest}
            disabled={!isTestCompare}
            virtual
            showSearch
            onSelect={(value) => {
              changeSecondTest(value);
            }}
            value={secondTest}
          />
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
