import request from './request';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

export function registerApi(data: { username: string; email: string; password: string }) {
  return request.post<{ user: UserProfile }>('/auth/register', data) as unknown as Promise<{ user: UserProfile }>;
}

export function loginApi(data: { username: string; password: string }) {
  return request.post<{ user: UserProfile }>('/auth/login', data) as unknown as Promise<{ user: UserProfile }>;
}

export function getProfileApi() {
  return request.get<UserProfile>('/auth/me') as unknown as Promise<UserProfile>;
}

export function logoutApi() {
  return request.post<{ message: string }>('/auth/logout') as unknown as Promise<{ message: string }>;
}
