/**
 * 封装axios
 */
import axios from 'axios';
//开发本地代理
axios.defaults.baseURL = 'http://127.0.0.1:5000/';
//设置头部
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';
//设置响应超时时间
axios.defaults.timeout = 400000;
//设置接口拦截器
axios.interceptors.request.use((config) => {
  config.headers = { DeviceType: 'H5' };
  return config;
});

//使用promise构造get请求
export function get(url) {
  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err.data);
      });
  });
}
//使用promise构造post请求
export function post(url, params) {
  return new Promise((resolve, reject) => {
    axios
      .post(url, params)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err.data);
      });
  });
}
