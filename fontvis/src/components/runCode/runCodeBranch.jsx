// src/app.js
import React, { useState, useEffect, useCallback } from "react";
import {
  getFunCFG,
  getRunCodeBranchSkip,
  getBranchSkip,
} from "../../api/interface";
import "./runCode.css";
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import { Tabs } from "antd";

function RunCodeBranch({
  nowVersion,
  nowCodeVersion,
  cursorInFunc,
  highlightFunc,
  firstTest,
  secondTest,
  firstTestRunData,
  secondTestRunData,
}) {
  const [funCFG, setFunCFG] = useState({});
  useEffect(() => {
    let useVersion = nowVersion;
    if (nowCodeVersion !== nowVersion) {
      useVersion = nowCodeVersion;
    }
    getFunCFG(useVersion).then((res) => {
      let useData = {};
      for (let i in res) {
        let nodes = [];
        let edges = [];
        for (let j in res[i]["node"]) {
          nodes.push({
            id: j,
            label: res[i]["node"][j].join(" "),
          });
        }
        for (let j of res[i]["edges"]) {
          edges.push({
            source: j[0],
            target: j[1],
          });
        }
        useData[i] = {
          nodes: nodes,
          edges: edges,
        };
      }
      setFunCFG(useData);
    });
  }, [nowVersion, nowCodeVersion]);
  const [showFunc, setShowFunc] = useState("main");
  useEffect(() => {
    if (cursorInFunc) {
      setShowFunc(cursorInFunc);
    }
  }, [cursorInFunc]);
  const [funBranchSkip, setFunBranchSkip] = useState({});
  useEffect(() => {
    let useVersion = nowVersion;
    if (nowCodeVersion !== nowVersion) {
      useVersion = nowCodeVersion;
    }
    getBranchSkip(useVersion).then((res) => {
      setFunBranchSkip(res);
    });
  }, [nowVersion, nowCodeVersion]);
  const [funCFGShowData, setFunCFGShowData] = useState({});
  useEffect(() => {
    if (Object.keys(funCFG).length > 0) {
      if (showFunc) {
        setFunCFGShowData(funCFG[showFunc]);
        funCFGChartSVG(funCFG[showFunc]);
      } else {
        setFunCFGShowData(funCFG[Object.keys(funCFG[0])]);
        funCFGChartSVG(funCFG[Object.keys(funCFG[0])]);
      }
    }
  }, [showFunc, funCFG]);

  const funCFGChartSVG = (data) => {
    let g = new dagreD3.graphlib.Graph();
    //设置图
    g.setGraph({
      rankdir: "TB",
      nodesep: 20,
    });
    data.nodes.forEach((item) => {
      g.setNode(item.id, {
        id: item.id,
        //节点标签
        label: item.label,
        //节点形状
        shape: "rect",
        //节点样式
        style: "fill:#fff;stroke:#000",
        labelStyle: "fill:#000",
      });
    });
    data.edges.forEach((item) => {
      g.setEdge(item.source, item.target, {
        id: item.source + "->" + item.target,
        //边样式
        style: "fill:#fff;stroke-width:1px;opacity:0.5;stroke:#000;",
      });
    });
    // 选择 svg 并添加一个g元素作为绘图容器.
    let chartDiv = d3.select("#runCode-content-branch-chart");
    chartDiv.select("svg").remove();
    let svgGroup = chartDiv
      .append("svg")
      .attr("width", chartDiv.style("width"))
      .attr("viewBox", "0 0 1500 1500");
    let svg = d3.select("#runCode-content-branch-chart").select("svg");
    let renderG = svgGroup.append("g");
    let zoom = d3.zoom().on("zoom", function (e) {
      renderG.attr("transform", e.transform);
    });
    svg.call(zoom);
    // 创建渲染器
    let render = new dagreD3.render();
    render(renderG, g);
  };

  const [firstTestRunFunCFG, setFirstTestRunFunCFG] = useState([]);
  const [secondTestRunFunCFG, setSecondTestRunFunCFG] = useState([]);
  useEffect(() => {
    if (firstTest && firstTestRunData) {
      let useVersion = nowVersion;
      if (nowCodeVersion !== nowVersion) {
        useVersion = nowCodeVersion;
      }
      getRunCodeBranchSkip(firstTest, useVersion).then((res) => {
        setFirstTestRunFunCFG(res);
      });
    }
  }, [firstTest, firstTestRunData, nowVersion, nowCodeVersion]);

  useEffect(() => {
    if (secondTest && secondTestRunData) {
      let useVersion = nowVersion;
      if (nowCodeVersion !== nowVersion) {
        useVersion = nowCodeVersion;
      }
      getRunCodeBranchSkip(secondTest, useVersion).then((res) => {
        setSecondTestRunFunCFG(res);
      });
    } else {
      setSecondTestRunFunCFG([]);
    }
  }, [secondTest, secondTestRunData, nowVersion, nowCodeVersion]);

  // 当前悬浮的函数
  useEffect(() => {
    if (Object.keys(funCFGShowData).length > 0) {
      let firstTestNodes = new Set();
      let firstTestEdges = new Set();
      for (let i of firstTestRunFunCFG) {
        if (funBranchSkip[i]) {
          if (funBranchSkip[i][2] === showFunc) {
            firstTestEdges.add(
              funBranchSkip[i][0] + "->" + funBranchSkip[i][1]
            );
            firstTestNodes.add(funBranchSkip[i][0]);
            firstTestNodes.add(funBranchSkip[i][1]);
          }
        }
      }
      firstTestNodes = Array.from(firstTestNodes);
      firstTestEdges = Array.from(firstTestEdges);
      let secondTestNodes = new Set();
      let secondTestEdges = new Set();
      for (let i of secondTestRunFunCFG) {
        if (funBranchSkip[i]) {
          if (funBranchSkip[i][2] === showFunc) {
            secondTestEdges.add(
              funBranchSkip[i][0] + "->" + funBranchSkip[i][1]
            );
            secondTestNodes.add(funBranchSkip[i][0]);
            secondTestNodes.add(funBranchSkip[i][1]);
          }
        }
      }

      secondTestNodes = Array.from(secondTestNodes);
      secondTestEdges = Array.from(secondTestEdges);
      let useNodes = {};
      for (let i of funCFGShowData["nodes"]) {
        let fillTestColor = "#fff";
        let strokeColor = "#000";
        if (firstTestNodes.length > 0 || secondTestNodes.length > 0) {
          strokeColor = "#aaa";
          let isInFirstTest = firstTestNodes.includes(i.id);
          let isInSecondTest = secondTestNodes.includes(i.id);
          if (isInFirstTest && isInSecondTest) {
            fillTestColor = "rgb(255,250,205)";
            strokeColor = "#000";
          } else if (isInFirstTest && !isInSecondTest) {
            fillTestColor = "#90EE90";
            strokeColor = "#000";
          } else if (!isInFirstTest && isInSecondTest) {
            fillTestColor = "#FA8072";
            strokeColor = "#000";
          }
        }
        useNodes[i.id] = `fill:${fillTestColor};stroke:${strokeColor}`;
      }
      let useEdges = {};
      let useEdgeLabel = {};
      for (let i of funCFGShowData["edges"]) {
        let nowEdges = i.source + "->" + i.target;
        let useColor = "#000";
        if (firstTestEdges.length > 0 || secondTestEdges.length > 0) {
          let isInFirstTest = firstTestEdges.includes(nowEdges);
          let isInSecondTest = secondTestEdges.includes(nowEdges);
          useColor = isInFirstTest || isInSecondTest ? "#000" : "#aaa";
        }
        useEdges[
          nowEdges
        ] = `stroke:${useColor};fill:#fff;stroke-width:1px;opacity:0.5;`;

        useEdgeLabel[nowEdges + ":label"] = `fill:${useColor};`;
      }
      funcInvokeChartChange(useNodes, useEdges, useEdgeLabel);
    }
  }, [funCFGShowData, firstTestRunFunCFG, secondTestRunFunCFG, funBranchSkip, showFunc]);

  const funcInvokeChartChange = function (useNodes, useEdges, useEdgeLabel) {
    let chartSvgG = d3.select("#runCode-content-branch-chart").selectAll("g");
    for (let i of chartSvgG.selectAll(".node")) {
      d3.select(i)
        .select("rect")
        .attr("style", useNodes[d3.select(i).attr("id")]);
    }
    for (let i of chartSvgG.selectAll(".edgePath")) {
      d3.select(i)
        .select("path")
        .attr("style", useEdges[d3.select(i).attr("id")]);
    }
    for (let i of chartSvgG.selectAll(".edgeLabel")) {
      d3.select(i)
        .select("text")
        .attr("style", useEdgeLabel[d3.select(i).select("g").attr("id")]);
    }
  };
  return (
    <div className="runCode-content-branch">
      <div className="runCode-content-branch-tabs">
        <Tabs
          activeKey={showFunc}
          size="small"
          type="editable-card"
          items={Object.keys(funCFG).map((name) => {
            return {
              label: name,
              key: name,
            };
          })}
          hideAdd
          onChange={(data) => {
            setShowFunc(data);
          }}
        />
      </div>
      <div id="runCode-content-branch-chart" />
    </div>
  );
}

export default RunCodeBranch;
