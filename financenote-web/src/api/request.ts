/**
 * 前端 Axios HTTP 网络请求封装 (request.ts)
 * 
 * 核心功能：
 * 1. 自动注入 localStorage 中的 JWT AccessToken 到 Authorization: Bearer <Token>
 * 2. 统一拦截 401 Unauthorized 异常并跳转至登录页
 * 3. 统一提取 backend 标准 JSON `{ code, message, data }` 结构
 */

import axios from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create({
  baseURL: '/api',
  timeout: 60000, // 默认 60s
});

// 请求拦截器：自动注入 JWT Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fn_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 如果返回的标准 JSON 中的 code 为 200，则直接解包返回 data
    if (res.code === 200) {
      return res.data;
    }
    ElMessage.error(res.message || '网络请求发生异常');
    return Promise.reject(new Error(res.message || 'Error'));
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '服务器连接失败';

    if (status === 401) {
      ElMessage.warning('身份凭证失效或未登录，请重新登录！');
      localStorage.removeItem('fn_access_token');
      window.location.href = '/login';
    } else if (status === 403) {
      ElMessage.error('抱歉：您无权访问该受保护的书籍/财报资源！');
    } else {
      ElMessage.error(message);
    }
    return Promise.reject(error);
  }
);

export default request;
