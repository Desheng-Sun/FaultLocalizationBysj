// src/app.js
import React, { useState, useEffect, useCallback } from "react";
import {
  getRunCodeLineFuncLevel,
  getTestOutput,
  getTestRunCode,
} from "../../api/interface";
import "./runCode.css";
import * as d3 from "d3";

import AceEditor from "react-ace";

// Render editor
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools";

function RunCodeChartText({
  nowVersion,
  nowCodeVersion,
  nowTest,
  funcStatic,
  componentId,
  cursorInFunc,
  highlightFunc,
  sourceCodeCursorLine,
  nowSelectVari,
  variTraceAll,
  chooseVariTraceLine,
  changeTestRunData,
  changeTestRunCode,
  changeCursorInFunc,
  changeHighlightFunc,
  changeRunCodeChooseLine,
  changeRunCodeChooseLineVari,
  changeVariTraceAll,
  changeIsWaitData,
}) {
  // 当前测试用例实际执行的代码行----------------------------
  const [runCodeData, setRunCodeData] = useState({});

  // 获取当前测试用例的输出结果
  const [nowTestOutputs, setNowTestOutputs] = useState(["true", "", ""]);
  const [levelMax, setLevelMax] = useState(0);
  useEffect(() => {
    if (nowTest !== "") {
      let useVersion = nowVersion;
      if (nowVersion !== nowCodeVersion) {
        useVersion = nowCodeVersion;
      }
      changeIsWaitData(true);
      changeTestRunData(false);
      getTestRunCode(nowTest, useVersion)
        .then((res) => {
          setRunCodeData(res);
          let useData = new Set();
          for (let i of res["line"]) {
            useData.add(i);
          }
          changeTestRunCode(Array.from(useData));
          setLevelMax(Math.max(...res["level"]));
          let useRunCode = "";
          for (let i in res["code"]) {
            useRunCode += res["spaceLen"][i] + res["code"][i];
          }
          setRunCode(useRunCode);
        })
        .then(() => {
          getRunCodeLineFuncLevel(nowTest, useVersion).then((res) => {
            changeIsWaitData(false);
            changeTestRunData(true);
            setRunCodeFuncLevel(res);
          });
        });
      getTestOutput(nowTest, useVersion).then((res) => {
        setNowTestOutputs(res);
      });
    }
  }, [nowTest, nowVersion, nowCodeVersion]);

  // 当前实际运行的代码行信息
  const [runCode, setRunCode] = useState("");
  // 当前的代码调用层级信息
  const [runCodeFuncLevel, setRunCodeFuncLevel] = useState([]);

  // 当前鼠标光标改变位置
  const [nowCursorLine, setNowCursorLine] = useState(0);
  const onCursorChange = function (e) {
    if (Object.keys(runCodeData).length > 0) {
      changeRunCodeChooseLine(runCodeData["line"][e.cursor.row]);
      changeHighlightFunc(runCodeData["func"][e.cursor.row]);
      setNowCursorLine(e.cursor.row + 1);
      changeRunCodeChooseLineVari([
        nowTest,
        e.cursor.row + 1,
        {
          ...runCodeData["variables"][e.cursor.row],
          ...runCodeData["definedVari"],
        },
      ]);
    }
  };

  //当前追踪了执行过程中的变量
  useEffect(() => {
    if (
      Object.keys(runCodeData).length > 0 &&
      nowSelectVari[0] === nowTest &&
      nowSelectVari[1] === nowCursorLine
    ) {
      let nowIdInfo = runCodeData["lineId"][nowCursorLine - 1];
      for (let i of variTraceAll) {
        if (i[nowTest + ": " + nowIdInfo["id"] + ": " + nowSelectVari[2]]) {
          return;
        }
      }

      // 获取当前选择的行数
      let useLine = [];
      for (let i in runCodeData["lineId"]) {
        // 只获取同一个层级的变量
        if (runCodeData["lineId"][i]["id"] === nowIdInfo["id"]) {
          useLine.push(i);
        }
      }
      let useData = {};
      for (let i of useLine) {
        if (runCodeData["variables"][i][nowSelectVari[2]]) {
          useData[parseInt(i) + 1] =
            runCodeData["variables"][i][nowSelectVari[2]];
        }
      }
      variTraceAll.push({
        [nowTest + ": " + nowIdInfo["id"] + ": " + nowSelectVari[2]]: useData,
      });
      changeVariTraceAll([...variTraceAll]);
    }
  }, [runCodeData, nowSelectVari, nowTest, nowCursorLine, variTraceAll.length]);

  // 获取变量在每一行是否发生改变
  const [variTraceLine, setVariTraceLine] = useState([]);
  useEffect(() => {
    let useData = [];
    for (let i of variTraceAll) {
      for (let j in i) {
        if (j.split(": ")[0] === nowTest) {
          let nowKey = j.replace(`${nowTest}: `, "");
          let nowVariData = {
            [nowKey]: {},
          };
          let lastData = "";
          for (let k in i[j]) {
            let nowData = JSON.stringify(i[j][k]);
            if (lastData === nowData) {
              nowVariData[nowKey][k] = false;
            } else {
              lastData = nowData;
              nowVariData[nowKey][k] = true;
            }
          }
          useData.push(nowVariData);
        }
      }
    }
    setVariTraceLine(useData);
  }, [variTraceAll, nowTest]);

  // 改变当前页面的滚动高度，将相关代码展示出来-------------------------------------
  useEffect(() => {
    if (
      chooseVariTraceLine[0] === nowTest &&
      nowTest !== "" &&
      Object.keys(runCodeData) > 0
    ) {
      let scrollDiv = document
        .getElementById(`runCode_code${componentId}`)
        .getElementsByClassName("ace_scrollbar-v")[0];
      scrollDiv.scrollTop = chooseVariTraceLine[1] * 19 - 100;
      if (chooseVariTraceLine[1] >= 1) {
        changeCursorInFunc(runCodeData["func"][chooseVariTraceLine[1] - 1]);
      }
      changeLineInfoTick();
    }
  }, [chooseVariTraceLine, runCodeData]);

  // 异步更新----------------------------------------------------------------------------
  useEffect(() => {
    changeLineInfoTick();
  }, [
    nowCursorLine,
    sourceCodeCursorLine,
    cursorInFunc,
    highlightFunc,
    variTraceAll,
    chooseVariTraceLine,
    runCodeFuncLevel.length,
  ]);

  const [runCodeLineInfoTick, setRunCodeLineInfoTick] = useState(0);
  const changeLineInfoTick = useCallback(() => {
    let data = runCodeLineInfoTick + 1;
    if (data > 100) {
      data = 0;
    }
    setRunCodeLineInfoTick(data);
  }, [runCodeLineInfoTick]);

  useEffect(() => {
    setTimeout(() => {
      editorChange();
    }, 10);
  }, [runCodeLineInfoTick]);

  const colorList = d3
    .scaleLinear()
    .domain([0, 1])
    .range(["rgb(246,253,230)", "#90EE90"]);

  const editorChange = function () {
    if (
      runCodeFuncLevel.length === 0 ||
      Object.keys(runCodeData).length === 0
    ) {
      return;
    }

    // 获取当前滚动高度
    let scrollDiv = d3
      .select(`#runCode_code${componentId}`)
      .selectAll(".ace_text-layer")._groups[0][0];
    let srcollHeight;
    try {
      srcollHeight = scrollDiv.style.transform.split(",")[1].replace("px)", "");
    } catch {
      srcollHeight = scrollDiv.style.top.replace("px", "");
    }
    // 获取当前页面偏移高度
    let contentDiv = d3
      .select(`#runCode_code${componentId}`)
      .selectAll(".ace_content")._groups[0][0];
    let contentHeight;
    try {
      contentHeight = contentDiv.style.transform
        .split(",")[1]
        .replace("px)", "");
    } catch {
      contentHeight = contentDiv.style.top.replace("px", "");
    }
    let funcLevelDiv = d3.select(`#runCode_funcLevel${componentId}`);
    funcLevelDiv.select("svg").remove();
    let funcLevelSvg = funcLevelDiv
      .append("svg")
      .attr("width", "120px")
      .attr("height", funcLevelDiv.style("height"));

    // 获取当前展示的代码内容
    let runCodeShowNow = d3
      .select(`#runCode_code${componentId}`)
      .selectAll(".ace_line")._groups[0];

    let runCodeNowLine = "";
    // 当前实际展示的行号
    let nowShowLineHeight = {};
    let nowShowLine = [];
    // 获取当前展示的行号
    let sourceCodeDiv = d3
      .select(`#runCode_code${componentId}`)
      .selectAll(".ace_gutter-cell ");
    sourceCodeDiv.style("background", "rgb(246,246,246)");

    let variTraceDiv = d3.select(`#runCode_variTrace${componentId}`);
    variTraceDiv.select("svg").remove();
    let variTraceSvg = variTraceDiv
      .append("svg")
      .attr("width", variTraceLine.length * 20)
      .attr("height", variTraceDiv.style("height"))
      .attr("fill", "rgb(235,235,235)");

    for (let i of sourceCodeDiv) {
      let yValue =
        i.style.top.replace("px", "") - -srcollHeight - -contentHeight;
      nowShowLineHeight[i.innerText] = yValue;
      nowShowLine.push(i.innerText);
      // 添加阴影效果
      let cursorData = variTraceSvg
        .append("rect")
        .attr("y", yValue)
        .attr("height", "19px")
        .attr("width", variTraceLine.length * 20)
        .attr("fill", "rgb(220,220,220)")
        .attr("opacity", 0);

      let nowLineInfo = i.innerText - 1;
      if (
        i.innerText === chooseVariTraceLine[1] &&
        nowTest === chooseVariTraceLine
      ) {
        i.style.background = "#D5F3F4";
        cursorData.attr("fill", "#D5F3F4").attr("opacity", 1);
      }
      // 添加其在源代码中的行数
      if (runCodeData["line"][nowLineInfo]) {
        if (i.innerText === nowCursorLine) {
          i.style.background = "rgb(220,220,220)";
          cursorData.attr("opacity", 1);
          runCodeNowLine += `
          <div
            class='runCode-chart-text-chart-codeLineInfo-lineValue lineValue-choose'
            style="top: ${yValue}px"
          >
            ${runCodeData["line"][nowLineInfo]}
          </div>`;
        } else if (
          sourceCodeCursorLine === parseInt(runCodeData["line"][nowLineInfo])
        ) {
          i.style.background = "#D5F3F4";
          cursorData.attr("opacity", 1).attr("fill", "#D5F3F4");
          runCodeNowLine += `
          <div
            class='runCode-chart-text-chart-codeLineInfo-lineValue lineValue-inSourceCode'
            style="top: ${yValue}px"
          >
            ${runCodeData["line"][nowLineInfo]}
          </div>`;
        } else {
          runCodeNowLine += `
          <div
            class='runCode-chart-text-chart-codeLineInfo-lineValue'
            style="top: ${yValue}px"
          >
            ${runCodeData["line"][nowLineInfo]}
          </div>`;
        }
      }

      // 添加变量追踪的热力图
      for (let j in variTraceLine) {
        let nowVariTraceData = variTraceLine[j];
        for (let k in nowVariTraceData) {
          if (nowVariTraceData[k][i.innerText] !== undefined) {
            if (nowVariTraceData[k][i.innerText]) {
              variTraceSvg
                .append("rect")
                .attr("y", yValue)
                .attr("height", "19px")
                .attr("width", "19px")
                .attr("fill", "rgb(250,128,114)")
                .attr("transform", `translate(${j * 20} ,0)`);
            } else {
              variTraceSvg
                .append("rect")
                .attr("y", yValue)
                .attr("height", "19px")
                .attr("width", "19px")
                .attr("fill", "rgb(217, 247, 208)")
                .attr("transform", `translate(${j * 20} ,0)`);
            }
          }
        }
      }
    }

    // 为每一个追踪变量添加数值
    for (let j in variTraceLine) {
      let nowVariTraceData = variTraceLine[j];
      for (let k in nowVariTraceData) {
        variTraceSvg
          .append("text")
          .attr("y", 10)
          .style("writing-mode", "tb-rl")
          .attr("opacity", 1)
          .attr("transform", `translate(${j * 20 + 10} ,0)`)
          .attr("fill", "#000")
          .text(k);
      }
    }
    document.getElementById(`runCode_nowLine${componentId}`).innerHTML =
      runCodeNowLine;

    let minShowLine = nowShowLine[0];
    let maxShowLine = nowShowLine[nowShowLine.length - 1];
    // 添加函数实际执行时的代码调用逻辑-----------------------------------------------
    let funcHeight =
      parseInt(funcLevelDiv.style("height")) / runCode.split("\n").length;
    const tooltip = d3.select(`#runCode_funcLevel_tooltip${componentId}`);
    let useFuncHeight = 0;
    for (let i in runCodeFuncLevel) {
      let nowData = runCodeFuncLevel[i];
      let nowFuncMinLine = nowData["line"][0];
      let nowFuncMaxLine = nowData["line"][nowData["line"].length - 1];
      let nowRGBColor = colorList(nowData["level"] / levelMax);
      let toolTipHTML =
        funcStatic[nowData["func"]]["funcType"] + " " + nowData["func"] + "\n";
      for (let j of funcStatic[nowData["func"]]["funcArgs"]) {
        toolTipHTML += j.trim() + ",";
      }
      // 当该函数所在行都不在屏幕范围内时
      let useFillColor = "rgb(240,240,240)";
      if (
        nowData["func"] === cursorInFunc ||
        nowData["func"] === highlightFunc
      ) {
        useFillColor = "#90EE90";
      }
      if (nowFuncMaxLine < minShowLine || nowFuncMinLine > maxShowLine) {
        funcLevelSvg
          .append("rect")
          .attr("fill", useFillColor)
          .attr("height", nowData["line"].length * funcHeight - 1)
          .attr("width", "35px")
          .attr(
            "transform",
            `translate(${nowData["level"] * 5}, ${funcHeight * useFuncHeight})`
          )
          .on("click", function () {
            changeCursorInFunc(nowData["func"]);
          })
          .on("mouseover", function () {
            d3.select(this).attr("fill", nowRGBColor);
            changeHighlightFunc(nowData["func"]);
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(toolTipHTML)
              .style("left", "50px")
              .style("top", i * funcHeight + "px");
          })
          .on("mouseout", function () {
            d3.select(this).attr("fill", useFillColor);
            changeHighlightFunc("");
            tooltip.transition().duration(500).style("opacity", 0);
          });
      } else {
        let nowMinShowLine = Math.max(nowFuncMinLine, minShowLine);
        let nowMaxShowLine = Math.min(nowFuncMaxLine, maxShowLine);
        funcLevelSvg
          .append("rect")
          .attr("fill", nowRGBColor)
          .attr("height", nowData["line"].length * funcHeight - 1)
          .attr("width", "35px")
          .attr(
            "transform",
            `translate(${nowData["level"] * 5}, ${funcHeight * useFuncHeight})`
          )
          .on("click", function () {
            changeCursorInFunc(nowData["func"]);
          })
          .on("mouseover", function () {
            changeHighlightFunc(nowData["func"]);
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(toolTipHTML)
              .style("left", "50px")
              .style("top", i * funcHeight + "px");
          })
          .on("mouseout", function () {
            changeHighlightFunc("");
            tooltip.transition().duration(500).style("opacity", 0);
          });

        funcLevelSvg
          .append("rect")
          .attr("fill", nowRGBColor)
          .attr("height", (nowMaxShowLine - nowMinShowLine + 1) * 19 - 1)
          .attr("width", "35px")
          .attr(
            "transform",
            `translate(${nowData["level"] * 5 + 50}, ${
              nowShowLineHeight[nowMinShowLine]
            })`
          )
          .on("click", function () {
            changeCursorInFunc(nowData["func"]);
          })
          .on("mouseover", function () {
            changeHighlightFunc(nowData["func"]);
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(toolTipHTML)
              .style("left", "100px")
              .style("top", nowShowLineHeight[nowMinShowLine] + "px");
          })
          .on("mouseout", function () {
            changeHighlightFunc("");
            tooltip.transition().duration(500).style("opacity", 0);
          });
        for (
          let k = nowMinShowLine - minShowLine;
          k <= nowMaxShowLine - minShowLine && k < runCodeShowNow.length;
          k++
        ) {
          runCodeShowNow[k].style.backgroundColor = nowRGBColor;
        }
      }
      useFuncHeight += nowData["line"].length;
    }
  };

  return (
    <>
      {nowTest !== "" && (
        <div className="runCode-chart-text">
          <div className="runCode-chart-text-result">
            <div
              className="runCode-chart-text-result-isTrue"
              style={{
                backgroundColor: `${
                  nowTestOutputs[0] === "true" ? "#90EE90" : "#FA8072"
                }`,
              }}
            >
              {nowTestOutputs[0] === "true" ? "正确" : "错误"}
            </div>
            <div
              className="runCode-chart-text-result-result"
              style={{ backgroundColor: "rgb(230, 230, 230)" }}
            >
              <div>{nowTestOutputs[2]}</div>
            </div>
            <div
              className="runCode-chart-text-result-result"
              style={{ backgroundColor: "#90EE90" }}
            >
              <div>{nowTestOutputs[1]}</div>
            </div>
          </div>
          <div className="runCode-chart-text-chart">
            <div className="runCode-chart-text-chart-codeLineInfo">
              <div
                className="runCode-chart-text-chart-codeLineInfo-funcLevel"
                id={`runCode_funcLevel${componentId}`}
              >
                <div
                  className="runCode-chart-text-chart-codeLineInfo-funcLevel-tooltip"
                  id={`runCode_funcLevel_tooltip${componentId}`}
                />
              </div>
              <div
                className="runCode-chart-text-chart-codeLineInfo-variTrace"
                id={`runCode_variTrace${componentId}`}
              />
              <div
                className="runCode-chart-text-chart-codeLineInfo-nowLine"
                id={`runCode_nowLine${componentId}`}
              />
            </div>

            <div
              className="runCode-chart-code"
              id={`runCode_code${componentId}`}
            >
              <AceEditor
                mode="c_cpp"
                theme="tomorrow"
                showPrintMargin={true}
                fontSize={16}
                value={runCode}
                height="100%"
                width="100%"
                name={`runCode-chart-code-codeShow${componentId}`}
                onScroll={changeLineInfoTick}
                onCursorChange={onCursorChange}
                readOnly={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RunCodeChartText;
