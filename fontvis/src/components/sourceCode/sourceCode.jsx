// src/app.js
import React, { useState, useEffect, useCallback } from "react";
import {
  getFileItem,
  getLineTestCase,
  getDoubtData,
  getSourceCode,
  getCodeLineInFunc,
  getNewVersionCode,
} from "../../api/interface";
import { Select, Button, Menu } from "antd";
import "./sourceCode.css";
import * as d3 from "d3";

import AceEditor from "react-ace";

// Render editor
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools";
import ChartHeader from "../chartHeader/chart-header";
import * as echarts from "echarts";

function SourceCodeChart({
  h,
  nowVersion,
  nowCodeVersion,
  firstTestRunCode,
  secondTestRunCode,
  runCodeChooseLine,
  changeFilterTestCase,
  changeHighlightTestCase,
  changeCursorInFunc,
  changeHighlightFunc,
  changeNowCodeVersion,
  changeSourceCodeCursorLine,
  changeFirstTestRunData,
  changeSecondTestRunData,
}) {
  // 获取列表数据和每一行所在的测试用例------------------------------------------------
  const [lineTestCase, setLineTestCase] = useState({});
  const [fileItemData, setFileItemData] = useState([]);
  const [lineInfuncData, setLineInFuncData] = useState({});

  useEffect(() => {
    let useVersion = nowVersion;
    if (nowCodeVersion !== nowVersion) {
      useVersion = nowCodeVersion;
    }
    getFileItem(useVersion).then((res) => {
      setFileItemData(res);
    });
    getLineTestCase(nowVersion).then((res) => {
      setLineTestCase(res);
      let valueData = [];
      for (let i in res) {
        if (res[i].length > 0) {
          valueData.push([i, res[i].length / 4130]);
        }
      }
      valueData = valueData.sort((a, b) => b[1] - a[1]);
      drawCoverBar(valueData);
    });
    getCodeLineInFunc(nowVersion).then((res) => {
      setLineInFuncData(res);
    });
  }, [nowVersion, nowCodeVersion]);

  // 当前选择的文件名，并获取对应的代码信息---------------------------------------------------------------------------------
  const [sourceCode, setSourceCode] = useState("");
  const [checkFile, setCheckFile] = useState("print_tokens.c");
  const checkFileChange = function (data) {
    let fileName = data.key.split("/");
    fileName = fileName[fileName.length - 1];
    if (data.key !== "") {
      setCheckFile(fileName);
    }
  };

  useEffect(() => {
    let useVersion = nowVersion;
    if (nowCodeVersion !== nowVersion) {
      useVersion = nowCodeVersion;
    }
    getSourceCode(checkFile, useVersion).then((res) => {
      setSourceCode(res.info);
    });
  }, [checkFile, nowVersion, nowCodeVersion]);

  useEffect(() => {
    if (nowVersion !== nowCodeVersion) {
      getFileItem(nowCodeVersion).then((res) => {
        setFileItemData(res);
      });
    }
  }, [nowVersion, nowCodeVersion]);
  //代码怀疑度---------------------------------------------------------------------------------
  // 获取每一行的代码怀疑度
  const [selectDoubtMethod, setSelectDoubtMethod] = useState("Tarantula");
  const [lineDoubtData, setLineDoubtData] = useState({});
  const doubtMethods = ["Tarantula", "Jaccard", "Ochiai", "D*"];
  useEffect(() => {
    getDoubtData(selectDoubtMethod, nowVersion).then((res) => {
      let max = 0;
      for (let i in res) {
        max = Math.max(res[i], max);
      }
      let nowData = {};
      for (let i in res) {
        if (max > 1) {
          nowData[i] = res[i] / max;
        } else {
          nowData[i] = res[i];
        }
      }
      setLineDoubtData(nowData);
      let valueData = [];
      for (let i in nowData) {
        if (nowData[i] > 0) {
          valueData.push([i, nowData[i]]);
        }
      }
      valueData = valueData.sort((a, b) => b[1] - a[1]);
      drawDoubtBar(valueData);
    });
  }, [selectDoubtMethod, nowVersion]);

  // 获取当前光标聚焦行---------------------------------------------------------
  const [cursorLine, setCursorLine] = useState(1);
  const changeCursorLine = function (select) {
    changeSourceCodeCursorLine(select.cursor.row + 1);
    setCursorLine(select.cursor.row + 1);
  };

  useEffect(() => {
    if (lineInfuncData && cursorLine && lineInfuncData[cursorLine]) {
      changeCursorInFunc(lineInfuncData[cursorLine]);
    } else {
      changeCursorInFunc("");
    }
  }, [lineInfuncData, cursorLine]);

  // 获取当前光标所在行--------------------------------------------------------------------
  const [cursorOverLine, setCursorOverLine] = useState(0);
  useEffect(() => {
    if (lineTestCase && cursorOverLine) {
      changeHighlightTestCase(lineTestCase[cursorOverLine]);
    } else {
      changeHighlightTestCase([]);
    }
    if (lineInfuncData && cursorOverLine && lineInfuncData[cursorOverLine]) {
      changeHighlightFunc(lineInfuncData[cursorOverLine]);
    } else {
      changeHighlightFunc("");
    }
  }, [cursorOverLine, lineTestCase, lineInfuncData]);

  // 测试用例执行代码行，改变当前页面的滚动高度，将相关代码展示出来-------------------------------------
  useEffect(() => {
    let scrollDiv = document
      .getElementById("sourceCode-chart-code-item-sourceCode")
      .getElementsByClassName("ace_scrollbar-v")[0];
    scrollDiv.scrollTop = runCodeChooseLine * 19 - 100;
    changeLineInfoTick();
  }, [runCodeChooseLine]);

  // 当前选择的语句（筛选测试用例）
  const [selectLineNum, setSelectLineNum] = useState();
  useEffect(() => {
    if (selectLineNum && lineTestCase && lineTestCase[selectLineNum]) {
      changeFilterTestCase(lineTestCase[selectLineNum]);
    } else {
      changeFilterTestCase([]);
    }
  }, [selectLineNum, lineTestCase]);

  // 异步更新视图---------------------------------------------------
  useEffect(() => {
    changeLineInfoTick();
  }, [
    firstTestRunCode,
    secondTestRunCode,
    cursorLine,
    lineDoubtData,
    sourceCode,
    cursorOverLine,
  ]);
  const [lineInfoTick, setLineInfoTick] = useState(0);

  const changeLineInfoTick = useCallback(() => {
    let data = lineInfoTick + 1;
    if (data > 100) {
      data = 0;
    }
    setLineInfoTick(data);
  }, [lineInfoTick]);

  useEffect(() => {
    setTimeout(() => {
      editorChange();
    }, 10);
  }, [lineInfoTick]);

  // 视图修改
  const editorChange = () => {
    if (!lineTestCase || !lineDoubtData || !sourceCode) {
      return;
    }
    let changeLineInfo = d3.select("#sourceCode-chart-code-item-lineInfo");
    changeLineInfo.select("svg").remove();
    // 获取当前滚动高度
    let scrollDiv = d3
      .select(".sourceCode-chart-code")
      .selectAll(".ace_text-layer")._groups[0][0];
    let srcollHeight;
    try {
      srcollHeight = scrollDiv.style.transform.split(",")[1].replace("px)", "");
    } catch {
      srcollHeight = scrollDiv.style.top.replace("px", "");
    }
    // 获取当前页面偏移高度
    let contentDiv = d3
      .select(".sourceCode-chart-code")
      .selectAll(".ace_content")._groups[0][0];
    let contentHeight;
    try {
      contentHeight = contentDiv.style.transform
        .split(",")[1]
        .replace("px)", "");
    } catch {
      contentHeight = contentDiv.style.top.replace("px", "");
    }
    let nowsvg = changeLineInfo
      .append("svg")
      .attr("width", "130px")
      .attr("height", changeLineInfo.style("height"))
      .attr("transform", "translate(10,0)");
    let sourceCodeDiv = d3
      .select("#sourceCode-chart-code-item-sourceCode")
      .selectAll(".ace_gutter-cell ");
    sourceCodeDiv.style("background", "rgb(246,246,246)");
    let sourceCodeShow = d3
      .select("#sourceCode-chart-code-item-sourceCode")
      .selectAll(".ace_line ");
    sourceCodeShow.style("background", "rgb(255,255,255)");
    sourceCodeShow = sourceCodeShow._groups[0];
    let lineRange = 0;
    let firstTestRunCodeSet = new Set(firstTestRunCode);
    let secondTestRunCodeSet = new Set(secondTestRunCode);
    let allCodeRun = Array.from(
      firstTestRunCodeSet.intersection(secondTestRunCodeSet)
    );
    let onlyFirstTestRunCode = Array.from(
      firstTestRunCodeSet.difference(secondTestRunCodeSet)
    );
    let onlySecondTestRunCode = Array.from(
      secondTestRunCodeSet.difference(firstTestRunCodeSet)
    );
    for (let i of sourceCodeDiv) {
      let yValue =
        i.style.top.replace("px", "") - -srcollHeight - -contentHeight;
      // 添加阴影效果
      let cursorData = nowsvg
        .append("rect")
        .attr("y", yValue)
        .attr("height", "19px")
        .attr("width", "130px")
        .attr("fill", "rgb(220,220,220)")
        .attr("opacity", 0)
        .on("mouseover", function () {
          d3.select(this).attr("opacity", 1);
          setCursorOverLine(i.innerText);
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", 0);
          setCursorOverLine(0);
        });

      if (i.innerText === cursorLine) {
        cursorData.attr("opacity", 1);
        if (lineRange < sourceCodeShow.length) {
          sourceCodeShow[lineRange].style.background = "rgb(220,220,220)";
        }
      }
      // 高亮当前选择的代码行--------------------------------------------
      else if (i.innerText === runCodeChooseLine) {
        if (lineRange < sourceCodeShow.length) {
          sourceCodeShow[lineRange].style.background = "#D5F3F4";
        }
        i.style.background = "#D5F3F4";
        cursorData.attr("fill", "#D5F3F4").attr("opacity", 1);
      }
      // 高亮当前运行的代码行;
      else if (allCodeRun.includes(i.innerText)) {
        if (lineRange < sourceCodeShow.length) {
          sourceCodeShow[lineRange].style.background = "rgb(255,250,205)";
        }
      } else if (onlyFirstTestRunCode.includes(i.innerText)) {
        if (lineRange < sourceCodeShow.length) {
          sourceCodeShow[lineRange].style.background = "#90EE90";
        }
      } else if (onlySecondTestRunCode.includes(i.innerText)) {
        if (lineRange < sourceCodeShow.length) {
          sourceCodeShow[lineRange].style.background = "#FA8072";
        }
      }

      // 添加怀疑度长度条-----------------------------------------------------------
      let doubt = 0;
      if (lineDoubtData[i.innerText]) {
        doubt = lineDoubtData[i.innerText].toFixed(2);
      }
      if (doubt !== 0) {
        nowsvg
          .append("rect")
          .attr("y", yValue + 5)
          .attr("height", "10px")
          .attr("width", doubt * 65)
          .attr("transform", `translate(${130 - doubt * 65},0)`)
          .style("fill", "rgb(250,128,114)");
      }

      // 添加覆盖率长度条-------------------------------------------------------------
      let overlapData = 0;
      if (lineTestCase[i.innerText]) {
        overlapData = lineTestCase[i.innerText].length / 4130;
        overlapData = overlapData.toFixed(2);
      }
      if (overlapData !== 0) {
        nowsvg
          .append("rect")
          .attr("y", yValue + 5)
          .attr("height", "10px")
          .attr("width", overlapData * 60)
          .style("fill", "rgb(217, 247, 208)");
      }
      lineRange += 1;
    }
  };

  const drawDoubtBar = (nowUseData) => {
    let chartDom = document.getElementById(
      "sourceCode-chart-code-infoChart-cover"
    );
    // 判断dom是否已经被实例化, 如果已存在实例，则dispose()
    let existInstance = echarts.getInstanceByDom(chartDom);
    if (existInstance !== undefined) {
      echarts.dispose(existInstance);
    }

    let myChart = echarts.init(chartDom);
    let option = {
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        borderColor: "transparent",
        padding: 2,
        textStyle: {
          color: "black",
          fontSize: "12px",
        },
      },
      title: {
        text: "语句怀疑度",
        textStyle: {
          fontSize: "12px",
        },
      },
      xAxis: {
        type: "category",
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      dataZoom: {
        type: "inside",
        start: 0,
        end: 50,
      },
      yAxis: {
        type: "value",
        show: false,
      },

      grid: {
        left: "5%",
        right: "5%",
        top: "20%",
        bottom: "30%",
      },
      series: {
        type: "bar",
        itemStyle: {
          color: "rgb(250,128,114)",
        },
        data: nowUseData,
      },
    };
    option && myChart.setOption(option, true);
    myChart.on("click", function (params) {
      setSelectLineNum(params["data"][0]);
    });
    myChart.on("mouseover", function (params) {
      setCursorOverLine(params["data"][0]);
    });
    myChart.on("mouseout", function () {
      setCursorOverLine(0);
    });
    window.addEventListener("resize", function () {
      myChart.resize();
    });
  };

  const drawCoverBar = (nowUseData) => {
    let chartDom = document.getElementById(
      "sourceCode-chart-code-infoChart-doubt"
    );
    // 判断dom是否已经被实例化, 如果已存在实例，则dispose()
    let existInstance = echarts.getInstanceByDom(chartDom);
    if (existInstance !== undefined) {
      echarts.dispose(existInstance);
    }

    let myChart = echarts.init(chartDom);
    let option = {
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        borderColor: "transparent",
        padding: 2,
        textStyle: {
          color: "black",
          fontSize: "12px",
        },
      },
      title: {
        text: "测试覆盖率",
        textStyle: {
          fontSize: "12px",
        },
      },
      xAxis: {
        type: "category",
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      dataZoom: {
        type: "inside",
        start: 0,
        end: 50,
      },
      yAxis: {
        type: "value",
        show: false,
      },

      grid: {
        left: "5%",
        right: "5%",
        top: "20%",
        bottom: "30%",
      },
      series: {
        type: "bar",
        itemStyle: {
          color: "rgb(217, 247, 208)",
        },
        data: nowUseData,
      },
    };

    option && myChart.setOption(option, true);
    window.addEventListener("resize", function () {
      myChart.resize();
    });
    myChart.on("click", function (params) {
      setSelectLineNum(params["data"][0]);
    });
    myChart.on("mouseover", function (params) {
      setCursorOverLine(params["data"][0]);
    });
    myChart.on("mouseout", function () {
      setCursorOverLine(0);
    });
  };

  const changeSourceCodeConfirm = useCallback(() => {
    let nextVersion = parseInt(nowVersion.replace("v", "")) + 1;
    nextVersion = "v" + nextVersion;
    changeFirstTestRunData(false);
    changeSecondTestRunData(false);
    getNewVersionCode(nextVersion, checkFile, sourceCode).then(() => {
      changeNowCodeVersion(nextVersion);
    });
  }, [nowVersion, sourceCode, checkFile]);

  return (
    <div style={{ height: h }} className="sourceCode-chart">
      <ChartHeader chartName="源代码信息" />
      <div className="sourceCode-chart-legend">
        <Menu
          theme="light"
          className="sourceCode-chart-legend-menu"
          inlineIndent={4}
          items={fileItemData}
          onSelect={checkFileChange}
        />
        <div className="sourceCode-chart-legend-control">
          怀疑度方法:
          <Select
            value={selectDoubtMethod}
            onChange={(data) => {
              setSelectDoubtMethod(data);
            }}
            options={doubtMethods.map((data) => {
              return {
                value: data,
                label: data,
              };
            })}
            style={{
              width: 100,
              height: 30,
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
            onClick={changeSourceCodeConfirm}
          >
            保存修改
          </Button>
        </div>
        <div className="sourceCode-chart-legend-control">
          筛选测试用例：
          <Select
            value={selectLineNum}
            onChange={(data) => {
              setSelectLineNum(data);
            }}
            options={Object.keys(lineTestCase).map((data) => {
              return {
                value: data,
                label: data,
              };
            })}
            style={{
              width: 60,
              height: 30,
              marginRight: 10,
            }}
            allowClear
            showSearch
          />
        </div>
        <svg width={370} height={"100%"}>
          <text x="0" y="20" fontSize="12">
            测试覆盖率
          </text>
          <rect
            x="60"
            y="10"
            width="30"
            height="10"
            fill="rgb(217, 247, 208)"
          />
          <text x="110" y="20" fontSize="12">
            语句怀疑度
          </text>
          <rect x="170" y="10" width="30" height="10" fill="rgb(250,128,114)" />
          <text x="220" y="20" fontSize="12">
            执行切片
          </text>
          <rect x="270" y="10" width="80" height="10" fill="#90EE90" />
          <text x="278" y="20" fontSize="12">
            code xxx xxx
          </text>
        </svg>
      </div>
      <div className="sourceCode-chart-code">
        <div className="sourceCode-chart-code-item">
          <div id="sourceCode-chart-code-item-lineInfo"></div>
          <div id="sourceCode-chart-code-item-sourceCode">
            <AceEditor
              mode="c_cpp"
              theme="tomorrow"
              showPrintMargin={true}
              fontSize={16}
              value={sourceCode}
              height="100%"
              width="100%"
              name="sourceCode-chart-code-codeShow"
              onScroll={changeLineInfoTick}
              onCursorChange={changeCursorLine}
              onChange={(data) => {
                setSourceCode(data);
              }}
            />
          </div>
        </div>
        <div className="sourceCode-chart-code-infoChart">
          <div id="sourceCode-chart-code-infoChart-cover" />
          <div id="sourceCode-chart-code-infoChart-doubt" />
        </div>
      </div>
    </div>
  );
}

export default SourceCodeChart;
