import { get, post } from './http.js';

// 获取所有的测试用例
export const getAllTestCase = () => {
  return get('getAllTestCase');
};
