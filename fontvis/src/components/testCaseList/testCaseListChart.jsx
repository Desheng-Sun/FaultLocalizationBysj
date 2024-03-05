import React, { useState, useEffect } from "react";
import { Radio, Pagination } from "antd";
import "./testCaseList.css";
import * as d3 from "d3";

function TestCaseListChart({
  nowVersion,
  firstTest,
  testCase,
  highlightTestCase,
  changeFirstTest,
}) {
  // 获取当前所有测试用例显示的页数---------------------------------------
  const [totalTest, setTotalTest] = useState(1);
  // 获取所有的测试用例----------------------------------
  const [useTestCase, setUseTestCase] = useState({});
  // 获取当前页面---------------------------------------------------
  const [testPage, setTestPage] = useState(1);
  const onPageChange = (current) => {
    setTestPage(current);
  };
  useEffect(() => {
    setTotalTest(Math.ceil(Object.keys(testCase).length / 10));
    setUseTestCase(testCase);
    setTestPage(1);
  }, [testCase]);

  // 判断当前选择的测试用例类别------------------------
  const [chartTCType, setChartTCType] = useState("all");
  const onTypeChange = ({ target: { value } }) => {
    setChartTCType(value);
  };
  // 获取当前类别显示的测试用例-----------------------------------
  useEffect(() => {
    let useData = {};
    if (chartTCType !== "all") {
      for (let i in testCase) {
        if (testCase[i][nowVersion][0] === chartTCType) {
          useData[i] = testCase[i];
        }
      }
    } else {
      useData = testCase;
    }
    setUseTestCase(useData);
    setTestPage(1);
    setTotalTest(Math.ceil(Object.keys(useData).length / 10));
  }, [chartTCType, nowVersion, testCase]);

  // 获取当前测试用例的输出结果
  const [testResult, setTestResult] = useState("");
  const colorRight = d3.scaleSqrt().domain([0, 20]).range(["white", "#90EE90"]);
  const colorFault = d3.scaleSqrt().domain([0, 20]).range(["white", "#FA8072"]);

  useEffect(() => {
    if (Object.keys(useTestCase).length > 0) {
      if (useTestCase[Object.keys(useTestCase)[0]][nowVersion]) {
        let showData = [];
        let num = 0;
        for (let i in useTestCase) {
          num += 1;
          if (num > (testPage - 1) * 100 && num <= testPage * 100) {
            showData.push([i, ...useTestCase[i][nowVersion]]);
          }
        }
        updateChart(showData);
      }
    }
  }, [nowVersion, testPage, useTestCase, highlightTestCase]);

  const updateChart = function (showData) {
    let svgWidth = document
      .getElementById("testList-case-chart")
      .getBoundingClientRect().width;
    let svgHeight =
      document.getElementById("testList-case-chart").getBoundingClientRect()
        .height - 30;
    // // 删除div下canvas 重新绘制
    document.getElementById("testList-case-chart-shape").remove();
    document.getElementById("testList-case-chart-mouse").remove();
    let canvas = document.createElement("canvas");
    canvas.id = "testList-case-chart-shape";
    let canvas_mouse = document.createElement("canvas");
    canvas_mouse.id = "testList-case-chart-mouse";
    document.getElementById("testList-case-chart").appendChild(canvas);
    document.getElementById("testList-case-chart").appendChild(canvas_mouse);

    const hdlMouseMove = (event) => {
      event.stopPropagation();
      let { x, y } = getMousePosition(event, canvas);
      let r = Math.floor(y / squareSize);
      let c = Math.floor(x / squareSize);
      let index = r * oneLine + c;
      if (index >= 0 && index < showData.length) {
        ctx_mouse.clearRect(0, 0, boundedWidth, boundedHeight);
        ctx_mouse.strokeStyle = "#333";
        ctx_mouse.strokeRect(
          (index % oneLine) * squareSize,
          parseInt(index / oneLine) * squareSize,
          squareSize,
          squareSize
        );
        // 显示当前数值
        setTestResult(showData[index][0] + ": " + showData[index][3]);
      } else {
        ctx_mouse.clearRect(0, 0, boundedWidth, boundedHeight);
        if (firstTest) {
          setTestResult(firstTest + ": " + testCase[firstTest][nowVersion][2]);
        }
      }
    };
    const hdlClick = (event) => {
      let { x, y } = getMousePosition(event, canvas);
      let r = Math.floor(y / squareSize);
      let c = Math.floor(x / squareSize);
      let index = r * oneLine + c;
      try {
        changeFirstTest(showData[index][0]);
      } catch {
        console.log(index, showData);
      }
    };
    // 获取视图的长宽比例，确定每一个正方形的大小
    const dimensions = {
      width: svgWidth - 20,
      height: svgHeight - 20,
    };
    const boundedWidth = dimensions.width;
    const boundedHeight = dimensions.height;
    let containerRatio = dimensions.width / dimensions.height;
    let squareSize =
      dimensions.height / Math.ceil(Math.sqrt(100 / containerRatio));
    let oneLine = Math.floor(boundedWidth / squareSize); //需要画多少列 画不下完整一列时，增加列数 列数取floor

    canvas = document.getElementById("testList-case-chart-shape");
    canvas.height = boundedHeight;
    canvas.width = boundedWidth;
    const ctx = canvas.getContext("2d");

    canvas_mouse = document.getElementById("testList-case-chart-mouse");
    canvas_mouse.height = boundedHeight;
    canvas_mouse.width = boundedWidth;
    const ctx_mouse = canvas_mouse.getContext("2d");
    ctx_mouse.globalAlpha = 1;
    for (let d in showData) {
      ctx.globalAlpha = 1;

      if (showData[d][1] === "True") {
        ctx.fillStyle = colorRight(Math.sqrt(showData[d][2]));
      } else {
        ctx.fillStyle = colorFault(Math.sqrt(showData[d][2]));
      }
      if (highlightTestCase.includes(parseInt(showData[d][0]))) {
        ctx.fillStyle = showData[d][1] == "True" ? "#90EE90" : "#FA8072";
        ctx_mouse.strokeStyle = "#333";
        ctx_mouse.strokeRect(
          (d % oneLine) * squareSize,
          parseInt(d / oneLine) * squareSize,
          squareSize,
          squareSize
        );
      }
      ctx.fillRect(
        (d % oneLine) * squareSize,
        parseInt(d / oneLine) * squareSize,
        squareSize,
        squareSize
      );
    }

    function getMousePosition(event, canvas) {
      const { clientX, clientY } = event;
      //  获取 canvas 的边界位置
      const { top, left } = canvas.getBoundingClientRect();
      //  计算鼠标在 canvas 在位置
      const x = clientX - left;
      const y = clientY - top;
      return {
        x,
        y,
      };
    }

    canvas_mouse.addEventListener("mousemove", hdlMouseMove, false);
    canvas_mouse.addEventListener("click", hdlClick, false);
  };

  return (
    <>
      <div className="testList-case-control">
        <div className="testList-case-control-type">
          <Radio.Group
            defaultValue={chartTCType}
            size="small"
            button-style="solid"
            onChange={onTypeChange}
          >
            <Radio.Button value="all">all</Radio.Button>
            <Radio.Button value="True">True</Radio.Button>
            <Radio.Button value="False">False</Radio.Button>
          </Radio.Group>
        </div>
        <div className="testList-case-control-page">
          <Pagination
            simple
            size="small"
            current={testPage}
            total={totalTest}
            onChange={onPageChange}
            showSizeChanger={false}
          />
        </div>
      </div>

      <div className="testList-case-info">{testResult}</div>
      <div id="testList-case-chart">
        <canvas id="testList-case-chart-shape"></canvas>
        <canvas id="testList-case-chart-mouse"></canvas>
      </div>
    </>
  );
}

export default TestCaseListChart;
