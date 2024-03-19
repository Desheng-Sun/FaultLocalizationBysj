// src/app.js
import React, { useState, useEffect } from "react";
import { getFuncInvokeStatic, getRunCodeFuncInvoke } from "../../api/interface";
import "./funcInvoke.css";
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3";
import ChartHeader from "../chartHeader/chart-header";

function FuncInvokeChart({
  h,
  nowVersion,
  nowCodeVersion,
  cursorInFunc,
  highlightFunc,
  firstTest,
  secondTest,
  firstTestRunData,
  secondTestRunData,
}) {
  const [funcInvokeStatic, setFuncInvokeStatic] = useState({});
  useEffect(() => {
    let useVersion = nowVersion;
    if (nowCodeVersion !== nowVersion) {
      useVersion = nowCodeVersion;
    }
    getFuncInvokeStatic(useVersion).then((res) => {
      let nodes = [];
      let edges = [];
      for (let i in res) {
        nodes.push({
          id: i,
          label: i,
        });
        for (let j of res[i]["children"]) {
          j = j.split(":");
          let args = j[1].split(";");
          let argsInvoke = "";
          for (let i in args) {
            argsInvoke +=
              args[i].trim() + ":" + res[j[0]]["funcArgs"][i].trim() + "\n";
          }
          edges.push({
            source: i,
            target: j[0],
            label: argsInvoke,
          });
        }
      }
      setFuncInvokeStatic({
        nodes: nodes,
        edges: edges,
      });
      funcInvokeChartSVG({
        nodes: nodes,
        edges: edges,
      });
    });
  }, [nowVersion, nowCodeVersion]);

  const funcInvokeChartSVG = (data) => {
    let g = new dagreD3.graphlib.Graph();
    //设置图
    g.setGraph({
      rankdir: "LR",
      nodesep: 20,
    });
    data.nodes.forEach((item) => {
      g.setNode(item.id, {
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
        //边标签
        label: item.label,
        //边样式
        style: "fill:#fff;stroke-width:1px;opacity:0.5;stroke:#000;",
        labelpos: "t",
        labelStyle: `fill:#000;`,
        labelId: item.source + "->" + item.target + ":label",
      });
    });
    // 选择 svg 并添加一个g元素作为绘图容器.
    let chartDiv = d3.select("#funcInvoke-chart-allFunc");
    chartDiv.select("svg").remove();
    let svgGroup = chartDiv
      .append("svg")
      .attr("width", chartDiv.style("width"))
      .attr("viewBox", "0 0 1300 1300");
    let svg = d3.select("#funcInvoke-chart-allFunc").select("svg");
    let renderG = svgGroup.append("g");
    let zoom = d3.zoom().on("zoom", function (e) {
      renderG.attr("transform", e.transform);
    });
    svg.call(zoom);
    // 创建渲染器
    let render = new dagreD3.render();
    render(renderG, g);
  };

  const [firstTestRunFunc, setFirstTestRunFunc] = useState([]);
  const [secondTestRunFunc, setSecondTestRunFunc] = useState([]);
  useEffect(() => {
    if (firstTest !== "" && firstTestRunData) {
      console.log(firstTest, firstTestRunData);
      let useVersion = nowVersion;
      if (nowCodeVersion !== nowVersion) {
        useVersion = nowCodeVersion;
      }
      getRunCodeFuncInvoke(firstTest, useVersion).then((res) => {
        setFirstTestRunFunc(res);
      });
    }
  }, [firstTest, firstTestRunData, nowVersion, nowCodeVersion]);

  useEffect(() => {
    if (secondTest !== "" && secondTestRunData) {
      let useVersion = nowVersion;
      if (nowCodeVersion !== nowVersion) {
        useVersion = nowCodeVersion;
      }
      getRunCodeFuncInvoke(secondTest, useVersion).then((res) => {
        setSecondTestRunFunc(res);
      });
    } else {
      setSecondTestRunFunc([]);
    }
  }, [secondTest, secondTestRunData, nowVersion, nowCodeVersion]);

  // 当前悬浮的函数
  useEffect(() => {
    if (Object.keys(funcInvokeStatic).length > 0) {
      let nowFuncOver = highlightFunc;
      if (highlightFunc === "") {
        nowFuncOver = cursorInFunc;
      }
      let firstTestNodes = new Set();
      let firstTestEdges = new Set();
      for (let i of firstTestRunFunc) {
        firstTestNodes.add(i[0]);
        firstTestNodes.add(i[1]);
        firstTestEdges.add(i[0] + "->" + i[1]);
      }
      firstTestNodes = Array.from(firstTestNodes);
      firstTestEdges = Array.from(firstTestEdges);
      let secondTestNodes = new Set();
      let secondTestEdges = new Set();
      for (let i of secondTestRunFunc) {
        secondTestNodes.add(i[0]);
        secondTestNodes.add(i[1]);
        secondTestEdges.add(i[0] + "->" + i[1]);
      }
      secondTestNodes = Array.from(secondTestNodes);
      secondTestEdges = Array.from(secondTestEdges);
      let highlightNodes = new Set();
      let highlightEdges = new Set();
      for (let i of funcInvokeStatic["edges"]) {
        if (i["source"] === nowFuncOver || i["target"] === nowFuncOver) {
          highlightNodes.add(i["source"]);
          highlightNodes.add(i["target"]);
          highlightEdges.add(i["source"] + "->" + i["target"]);
        }
      }
      highlightNodes = Array.from(highlightNodes);
      highlightEdges = Array.from(highlightEdges);
      let useNodes = {};
      for (let i of funcInvokeStatic["nodes"]) {
        let fillTestColor = "#fff";
        let fillHighColor =
          i.id === nowFuncOver
            ? "#D7FFF0"
            : highlightNodes.includes(i.id)
            ? "#D5F3F4"
            : "#fff";
        let strokeColor = "#000";
        if (firstTestNodes.length > 0 || secondTestNodes.length > 0) {
          let isInFirstTest = firstTestNodes.includes(i.id);
          let isInSecondTest = secondTestNodes.includes(i.id);
          strokeColor = "#aaa";
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

        let fillColor =
          fillHighColor === "#fff" ? fillTestColor : fillHighColor;
        useNodes[i.id] = `fill:${fillColor};stroke:${strokeColor}`;
      }

      let useEdges = {};
      let useEdgeLabel = {};
      for (let i of funcInvokeStatic["edges"]) {
        let nowEdges = i.source + "->" + i.target;
        let edgeColor = "#000";
        if (firstTestEdges.length > 0 || secondTestEdges.length > 0) {
          let isInFirstTest = firstTestEdges.includes(nowEdges);
          let isInSecondTest = secondTestEdges.includes(nowEdges);
          edgeColor = isInFirstTest || isInSecondTest ? "#000" : "#aaa";
        }
        useEdges[
          nowEdges
        ] = `stroke:${edgeColor};fill:#fff;stroke-width:1px;opacity:0.5;`;

        useEdgeLabel[nowEdges + ":label"] = `fill:${edgeColor};`;
      }
      funcInvokeChartChange(useNodes, useEdges, useEdgeLabel);
    }
  }, [
    funcInvokeStatic,
    cursorInFunc,
    highlightFunc,
    firstTestRunFunc,
    secondTestRunFunc,
  ]);

  const funcInvokeChartChange = function (useNodes, useEdges, useEdgeLabel) {
    let chartSvgG = d3.select("#funcInvoke-chart-allFunc").selectAll("g");
    for (let i of chartSvgG.selectAll(".node")) {
      d3.select(i).select("rect").attr("style", useNodes[d3.select(i).text()]);
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
    <div style={{ height: h }} className="funcInvoke-chart">
      <ChartHeader chartName="函数调用信息" />
      <div id="funcInvoke-chart-allFunc" />
    </div>
  );
}

export default FuncInvokeChart;
