import { get, post } from './http.js';


// 获取当前使用的版本
export const getUseVersion = () => {
  return get('getUseVersion');
};

export const changeUseVersion = (nowVersion, nowCodeVersion) => {
  return post('changeUseVersion', {nowVersion, nowCodeVersion});
};

// 获取所有的测试用例
export const getAllTestCase = () => {
  return get('getAllTestCase');
};

// 获取项目源代码目录结构
export const getFileItem = (nowVersion) => {
  return post('getFileItem', {nowVersion});
};

// 获取项目源代码
export const getSourceCode = (filePath, nowVersion) => {
  return post('getSourceCode', {filePath, nowVersion});
};

// 获取每一行代码执行的测试用例
export const getLineTestCase = (nowVersion) => {
  return post('getLineTestCase', {nowVersion});
};

// 获取每一行代码执行所在的函数
export const getCodeLineInFunc = (nowVersion) => {
  return post('getCodeLineInFunc', {nowVersion});
};

// 获取代码怀疑度
export const getDoubtData = (doubtMethod, nowVersion) => {
  return post('getDoubtData', {doubtMethod, nowVersion});
};

//获取源代码函数调用结构
export const getFuncInvokeStatic = (nowVersion) => {
  return post('getFuncInvokeStatic', {nowVersion});
};

// 获取测试用例运行代码
export const getTestRunCode = (testCaseNum, nowVersion) => {
  return post('getTestRunCode', {testCaseNum, nowVersion});
};


// 获取代码执行后的函数调用层级结构等信息
export const getRunCodeLineFuncLevel = (testCaseNum, nowVersion) => {
  return post('getRunCodeLineFuncLevel', {testCaseNum, nowVersion});
};

// 获取代码执行后当前函数的实际调用信息
export const getRunCodeFuncInvoke = (testCaseNum, nowVersion) => {
  return post('getRunCodeFuncInvoke', {testCaseNum, nowVersion});
};

// 获取代码执行后的分支跳转信息
export const getRunCodeBranchSkip = (testCaseNum, nowVersion) => {
  return post('getRunCodeBranchSkip', {testCaseNum, nowVersion});
};

//获取源代码的控制流图信息
export const getFunCFG = (nowVersion) => {
  return post('getFunCFG', {nowVersion});
};

//获取源代码的代码块的跳转数据
export const getBranchSkip = (nowVersion) => {
  return post('getBranchSkip', {nowVersion});
};
// 获取当前测试用例的实际输出------------------------------------------------------------
export const getTestOutput = (testCaseNum, nowVersion) => {
  return post('getTestOutput', {testCaseNum, nowVersion});
};

// 获取当前测试用例的实际输出------------------------------------------------------------
export const getNewVersionCode = (nowVersion, nowFile, nowCode) => {
  return post('getNewVersionCode', {nowVersion, nowFile, nowCode});
};

// 获取代码的更改历史
export const getCodeChangeHistory = () => {
  return get('getCodeChangeHistory');
};

//获取新版本的数据
export const getNewVersionData = (nowVersion) => {
  return post('getNewVersionData', {nowVersion});
};

