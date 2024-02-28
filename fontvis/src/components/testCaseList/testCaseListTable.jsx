import React, { useState, useEffect, useMemo } from "react";
import { Table } from "antd";
import "./testCaseList.css";
import * as d3 from "d3";

function TestCaseListTable({ nowVersion, firstTest, secondTest, testCase }) {
  const [useTestCase, setUseTestCase] = useState([]);
  const [tableTitle, setTableTitle] = useState([]);
  useEffect(() => {
    let nowTestCase = [];
    let nowTableTitle = [];
    let num = 0;
    nowTableTitle.push({
      title: "序号",
      dataIndex: "list",
    });
    for (let i in testCase) {
      for (let j in testCase[i]) {
        if (num === 0) {
          nowTableTitle.push({
            title: j,
            dataIndex: j,
            key: j,
            isVersion: true,
          });
        }
        if (!nowTestCase[i]) {
          nowTestCase[i] = {
            list: i,
            key: i,
          };
        }
        nowTestCase[i][j] = testCase[i][j][0];
      }
      num += 1;
    }
    nowTableTitle.push({
      title: "执行次数",
      dataIndex: "runTime",
    });
    nowTableTitle.push({
      title: "结果",
      dataIndex: "result",
    });
    for (let i in testCase) {
      nowTestCase[i]["runTime"] = testCase[i][nowVersion][1];
      nowTestCase[i]["result"] = testCase[i][nowVersion][2];
    }
    let nowUseTestCase = [];
    for (let i in nowTestCase) {
      if (i === firstTest || i === secondTest) {
        nowUseTestCase.unshift(nowTestCase[i]);
      } else {
        nowUseTestCase.push(nowTestCase[i]);
      }
    }
    console.log(nowUseTestCase);
    setUseTestCase(nowUseTestCase);
    setTableTitle(nowTableTitle);
  }, [firstTest, nowVersion, secondTest, testCase]);

  // 获取当前测试用例的输出结果
  const column = useMemo(() => {
    return tableTitle.map((tempData) => {
      const isVersionResult = tempData["isVersion"];
      return {
        render: (text) => {
          if (isVersionResult) {
            return (
              <div
                style={{
                  background: `${text === "True" ? "#90EE90" : "#FA8072"}`,
                  width: "20px",
                  height: "20px",
                }}
              ></div>
            );
          }
          return <>{text}</>;
        },
        ...tempData,
      };
    });
  }, [tableTitle]);
  return <Table dataSource={useTestCase} columns={column}/>;
}

export default TestCaseListTable;
