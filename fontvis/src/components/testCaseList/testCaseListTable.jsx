import React, { useState, useEffect, useMemo } from "react";
import { Table } from "antd";
import "./testCaseList.css";

function TestCaseListTable({
  nowVersion,
  firstTest,
  secondTest,
  testCase,
  filterTestCase,
  highlightTestCase,
}) {
  const [useTestCase, setUseTestCase] = useState([]);
  const [tableTitle, setTableTitle] = useState([]);
  useEffect(() => {
    
    let nowTestCase = [];
    let nowTableTitle = [];
    let num = 0;
    nowTableTitle.push({
      title: "序号",
      dataIndex: "list",
      fixed: "left",
      width: 50,
    });
    for (let i in testCase) {
      for (let j in testCase[i]) {
        if (num === 0) {
          nowTableTitle.push({
            title: j,
            dataIndex: j,
            key: j,
            isVersion: true,
            width: 70,
            filters: [
              {
                text: "正确",
                value: "True",
              },
              {
                text: "错误",
                value: "False",
              },
            ],
            onFilter: (value, record) => record[j] === value,
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
      width: 100,
      sorter: (a, b) => a.runTime - b.runTime,
    });
    nowTableTitle.push({
      title: "结果",
      dataIndex: "result",
      width: 300,
    });
    for (let i in testCase) {
      nowTestCase[i]["runTime"] = testCase[i][nowVersion][1];
      nowTestCase[i]["result"] = testCase[i][nowVersion][2];
    }
    let nowUseTestCase = [];
    for (let i in nowTestCase) {
      if (filterTestCase && filterTestCase.length > 0) {
        if (filterTestCase.includes(parseInt(i))) {
          if (i === firstTest || i === secondTest) {
            nowUseTestCase.unshift(nowTestCase[i]);
          } else {
            nowUseTestCase.push(nowTestCase[i]);
          }
        }
      } else {
        if (i === firstTest || i === secondTest) {
          nowUseTestCase.unshift(nowTestCase[i]);
        } else {
          nowUseTestCase.push(nowTestCase[i]);
        }
      }
    }
    setUseTestCase(nowUseTestCase);
    setTableTitle(nowTableTitle);
  }, [firstTest, nowVersion, secondTest, testCase, filterTestCase]);

  // 获取当前测试用例的输出结果
  const column = useMemo(() => {
    return tableTitle.map((tempData) => {
      const isVersionResult = tempData["isVersion"];
      let useStyle = {
        height: "40px",
        textAlign: "center",
        lineHeight: "40px",
      };
      if (tempData["title"] === "结果") {
        useStyle = {
          ...useStyle,
          overflow: "auto",
          lineHeight: "20px",
        };
      }
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
          return <div style={useStyle}>{text}</div>;
        },
        ...tempData,
      };
    });
  }, [tableTitle]);
  return (
    <Table
      dataSource={useTestCase}
      columns={column}
      scroll={{ y: 400 }}
      size="small"
    />
  );
}

export default TestCaseListTable;
