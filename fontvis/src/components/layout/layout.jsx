import CodeChangeHistoryChart from "../codeChangeHistory/codeChangeHistory";
import ControlPanel from "../control/control";
import FuncInvokeChart from "../funcInvoke/funcInvoke";
import LineVariChart from "../lineVari/lineVari";
import RunCodeChart from "../runCode/runCode";
import SourceCodeChart from "../sourceCode/sourceCode";
import TestCaseList from "../testCaseList/testCaseList";
import VariTraceChart from "../variTrace/variTrace";
import "./layout.css";
import { useState, useEffect } from "react";

export default function Layout() {
  // 各个视图的实际高度
  const [testCaseListWidth, setTestCaseListWidth] = useState(0);
  const [codeChangeHistoryHeight, setCodeChangeHistory] = useState(0);
  const [sourceCodeHeight, setSourceCodeHeight] = useState(0);
  const [funcInvokeiHeight, setFuncInvokeiHeight] = useState(0);
  const [runCodeHeight, setRunCodeHeight] = useState(0);
  const [lineVariHeight, setLineVariHeight] = useState(0);
  const [lineVariWidth, setLineVariWidth] = useState(0);
  const [variTraceHeight, setVariTraceHeight] = useState(0);
  const [variTraceiWidth, setVariTraceiWidth] = useState(0);
  useEffect(() => {
    setTestCaseListWidth(
      document.getElementById("testList").getBoundingClientRect().width
    );
    setCodeChangeHistory(
      document.getElementById("changeHistory").getBoundingClientRect().width
    );
    setSourceCodeHeight(
      document.getElementById("sourceCode").getBoundingClientRect().height
    );
    setFuncInvokeiHeight(
      document.getElementById("funcInvoke").getBoundingClientRect().height
    );
    setRunCodeHeight(
      document.getElementById("runCode").getBoundingClientRect().height
    );
    setLineVariHeight(
      document.getElementById("lineVari").getBoundingClientRect().height
    );
    setLineVariWidth(
      document.getElementById("lineVari").getBoundingClientRect().width
    );
    setVariTraceHeight(
      document.getElementById("variTrace").getBoundingClientRect().height
    );
    setVariTraceiWidth(
      document.getElementById("variTrace").getBoundingClientRect().width
    );
  });

  // 当前选择的版本号---------------------------------------------------------------
  const [nowVersion, setNowVersion] = useState("v0");
  const changeNowVersion = function (data) {
    setNowVersion(data);
  };
  const [nowCodeVersion, setNowCodeVersion] = useState("v0");
  const changeNowCodeVersion = function (data) {
    setNowCodeVersion(data);
  };

  // 当前是否开启测试用例对比，当前选择的测试用例
  const [isTestCompare, setIsTestCompare] = useState(false);
  const changeIsTestCompare = function (data) {
    setIsTestCompare(data);
  };
  // 首要选择的测试用
  const [firstTest, setFirstTest] = useState("");
  const changeFirstTest = function (data) {
    setFirstTest(data);
  };
  // 进行对比的测试用例
  const [secondTest, setSecondTest] = useState("");
  const changeSecondTest = function (data) {
    setSecondTest(data);
  };
  // 当前筛选的测试用例
  const [filterTestCase, setFilterTestCase] = useState([]);
  const changeFilterTestCase = function (data) {
    setFilterTestCase(data);
  };
  // 当前高亮的测试用例
  const [highlightTestCase, setHighlightTestCase] = useState([]);
  const changeHighlightTestCase = function (data) {
    setHighlightTestCase(data);
  };

  // 当前用户鼠标所在函数
  const [cursorInFunc, setCursorInFunc] = useState("");
  const changeCursorInFunc = function (data) {
    setCursorInFunc(data);
  };

  // 当前需要高亮的函数
  const [highlightFunc, setHighlightFunc] = useState("");
  const changeHighlightFunc = function (data) {
    setHighlightFunc(data);
  };
  // 当前源代码视图中鼠标所在行
  const [sourceCodeCursorLine, setSourceCodeCursorLine] = useState(0);
  const changeSourceCodeCursorLine = (data) => {
    setSourceCodeCursorLine(data);
  };
  // 测试用例执行数据获取完成
  const [firstTestRunData, setFirstTestRunData] = useState(false);
  const changeFirstTestRunData = (data) => {
    setFirstTestRunData(data);
  };
  const [secondTestRunData, setSecondTestRunData] = useState(false);
  const changeSecondTestRunData = (data) => {
    setSecondTestRunData(data);
  };

  // 当前测试用例执行的代码行
  const [firstTestRunCode, setFirstTestRunCode] = useState([]);
  const changeFirstTestRunCode = (data) => {
    setFirstTestRunCode(data);
  };
  const [secondTestRunCode, setSecondTestRunCode] = useState([]);
  const changeSecondTestRunCode = (data) => {
    setSecondTestRunCode(data);
  };

  // 执行代码视图中选择的代码行
  const [runCodeChooseLine, setRunCodeChooseLine] = useState(0);
  const changeRunCodeChooseLine = (data) => {
    setRunCodeChooseLine(data);
  };

  // 执行代码视图中选择的行数对应的变量值
  const [runCodeChooseLineVari, setRunCodeChooseLineVari] = useState([
    "",
    "",
    {},
  ]);
  const changeRunCodeChooseLineVari = (data) => {
    console.log(data);
    setRunCodeChooseLineVari(data);
  };
  useEffect(() => {
    if (isTestCompare === false) {
      setSecondTest("");
      setSecondTestRunCode([]);
      setSecondTestRunData(false);
    }
  }, [isTestCompare]);

  // 当前用户选择追踪的变量
  const [variTraceAll, setVariTraceAll] = useState([]);
  const changeVariTraceAll = (data) => {
    setVariTraceAll(data);
  };
  // 当前选择进行追踪的变量
  const [nowSelectVari, setNowSelectVari] = useState(["", 0, ""]);
  const changeNowSelectVari = (data) => {
    setNowSelectVari(data);
  };

  // 当前追踪变量选择的代码行-------------------------------------------------------------
  const [chooseVariTraceLine, setChooseVariTraceLine] = useState(["", -1]);
  const changeChooseVariTraceLine = function (data) {
    setChooseVariTraceLine(data);
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
            w={testCaseListWidth}
            nowVersion={nowVersion}
            changeFirstTest={changeFirstTest}
            firstTest={firstTest}
            secondTest={secondTest}
            filterTestCase={filterTestCase}
            highlightTestCase={highlightTestCase}
          />
        </div>
        <div id="changeHistory">
          <CodeChangeHistoryChart
            h={codeChangeHistoryHeight}
            nowVersion={nowVersion}
            nowCodeVersion={nowCodeVersion}
            changeNowVersion={changeNowVersion}
            changeNowCodeVersion={changeNowCodeVersion}
          />
        </div>
        <div id="sourceCode">
          <SourceCodeChart
            h={sourceCodeHeight}
            nowVersion={nowVersion}
            nowCodeVersion={nowCodeVersion}
            firstTestRunCode={firstTestRunCode}
            secondTestRunCode={secondTestRunCode}
            runCodeChooseLine={runCodeChooseLine}
            changeFilterTestCase={changeFilterTestCase}
            changeHighlightTestCase={changeHighlightTestCase}
            changeCursorInFunc={changeCursorInFunc}
            changeHighlightFunc={changeHighlightFunc}
            changeNowCodeVersion={changeNowCodeVersion}
            changeSourceCodeCursorLine={changeSourceCodeCursorLine}
          />
        </div>
        <div id="funcInvoke">
          <FuncInvokeChart
            h={funcInvokeiHeight}
            nowVersion={nowVersion}
            nowCodeVersion={nowCodeVersion}
            cursorInFunc={cursorInFunc}
            highlightFunc={highlightFunc}
            firstTest={firstTest}
            secondTest={secondTest}
            firstTestRunData={firstTestRunData}
            secondTestRunData={secondTestRunData}
          />
        </div>
        <div id="runCode">
          <RunCodeChart
            h={runCodeHeight}
            nowVersion={nowVersion}
            nowCodeVersion={nowCodeVersion}
            firstTest={firstTest}
            secondTest={secondTest}
            cursorInFunc={cursorInFunc}
            highlightFunc={highlightFunc}
            isTestCompare={isTestCompare}
            sourceCodeCursorLine={sourceCodeCursorLine}
            nowSelectVari={nowSelectVari}
            variTraceAll={variTraceAll}
            chooseVariTraceLine={chooseVariTraceLine}
            firstTestRunData={firstTestRunData}
            secondTestRunData={secondTestRunData}
            changeFirstTestRunData={changeFirstTestRunData}
            changeSecondTestRunData={changeSecondTestRunData}
            changeFirstTestRunCode={changeFirstTestRunCode}
            changeSecondTestRunCode={changeSecondTestRunCode}
            changeCursorInFunc={changeCursorInFunc}
            changeHighlightFunc={changeHighlightFunc}
            changeRunCodeChooseLine={changeRunCodeChooseLine}
            changeRunCodeChooseLineVari={changeRunCodeChooseLineVari}
            changeVariTraceAll={changeVariTraceAll}
          />
        </div>
        <div id="lineVari">
          <LineVariChart
            h={lineVariHeight}
            w={lineVariWidth}
            runCodeChooseLineVari={runCodeChooseLineVari}
            changeNowSelectVari={changeNowSelectVari}
          />
        </div>
        <div id="variTrace">
          <VariTraceChart
            h={variTraceHeight}
            w={variTraceiWidth}
            variTraceAll={variTraceAll}
            changeNowSelectVari={changeNowSelectVari}
            changeVariTraceAll={changeVariTraceAll}
            changeChooseVariTraceLine={changeChooseVariTraceLine}
          />
        </div>
      </div>
    </div>
  );
}
