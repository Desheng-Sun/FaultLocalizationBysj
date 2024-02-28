import ControlPanel from "../control/control";
import TestCaseList from "../testCaseList/testCaseList";
import "./layout.css";
import { useState, useEffect } from "react";

export default function Layout() {
  // 当前选择的版本号---------------------------------------------------------------
  const [nowVersion, setNowVersion] = useState("v0");
  const changeNowVersion = function (data) {
    setNowVersion(data);
  };
  const [nowCodeVersion, setNowCodeVersion] = useState([0, 0]);
  const changeNowCodeVersion = function (data) {
    setNowCodeVersion(data);
  };

  // 当前是否开启测试用例对比，当前选择的测试用例
  const [isTestCompare, setIsTestCompare] = useState(false);
  const changeIsTestCompare = function (data) {
    setIsTestCompare(data);
  };
  const [firstTest, setFirstTest] = useState("");
  const changeFirstTest = function (data) {
    setFirstTest(data);
  };
  const [secondTest, setSecondTest] = useState("");
  const changeSecondTest = function (data) {
    setSecondTest(data);
  };
  return (
    <div id="layout">
      <div id="title">软件故障定位可视分析系统</div>
      <div id="content">
        <div id="controlPanel">
          <ControlPanel
            isTestCompare={isTestCompare}
            changeIsTestCompare={changeIsTestCompare}
            changeFirstTest={changeFirstTest}
            changeSecondTest={changeSecondTest}
            firstTest={firstTest}
            secondTest={secondTest}
          />
        </div>
        <div id="testList">
          <TestCaseList
            nowVersion={nowVersion}
            changeFirstTest={changeFirstTest}
            firstTest={firstTest}
            secondTest={secondTest}
          />
        </div>
        <div id="changeHistory"></div>
        <div id="sourceCode"></div>
        <div id="funcInvoke"></div>
        <div id="runCode"></div>
        <div id="lineVari"></div>
        <div id="variTrace"></div>
      </div>
    </div>
  );
}
