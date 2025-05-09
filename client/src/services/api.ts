import axios, { InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';

// 将 GenerateIstPayload 接口定义移到这里，并设 expires_at 为可选
export interface GenerateIstPayload {
  script_id: string;
  expires_at?: string; 
}

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api' : '',
});

// 请求拦截器，自动带JWT
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = Cookies.get(TOKEN_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// 响应拦截器，处理401错误
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // 清除token前先二次验证
      let reallyInvalid = true;
      try {
        // 再次验证token有效性
        const valid = await checkAuth();
        if (valid) {
          reallyInvalid = false;
        }
      } catch {}
      if (reallyInvalid) {
        Cookies.remove(TOKEN_KEY);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// 登录
export const loginUser = async (username: string, password: string) => {
  const res = await api.post('/admin/auth/login', { username, password });
  if (res.data.token) {
    Cookies.set(TOKEN_KEY, res.data.token, { expires: 7 }); // 7天过期
  }
  return res.data;
};

// 获取脚本列表
export const fetchScripts = async () => {
  const res = await api.get('/admin/scripts');
  return res.data;
};

// 上传脚本
export const uploadScriptFile = async (formData: FormData) => {
  const res = await api.post('/admin/scripts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// 获取IST列表
export const fetchIsts = async () => {
  const res = await api.get('/admin/ists');
  return res.data;
};

// 生成IST
export const generateIst = async (data: GenerateIstPayload) => {
  const res = await api.post('/admin/ists/generate', data);
  return res.data;
};

// 检查是否有管理员
export const checkHasAdmin = async () => {
  const res = await api.get('/admin/auth/has-admin');
  return res.data;
};

// 管理员注册（仅首次）
export const registerAdmin = async (username: string, password: string) => {
  const res = await api.post('/admin/auth/register', { username, password });
  return res.data;
};

// 检查token是否有效
export const checkAuth = async () => {
  try {
    await api.get('/admin/auth/check');
    return true;
  } catch {
    return false;
  }
};

// 删除IST
export const deleteIst = async (id: string | number) => {
  const res = await api.delete(`/admin/ists/${String(id)}`);
  return res.data;
};

// 删除脚本
export const deleteScript = async (id: string | number) => {
  const res = await api.delete(`/admin/scripts/${String(id)}`);
  return res.data;
};
