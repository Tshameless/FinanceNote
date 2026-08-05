import request from './request';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

export function registerApi(data: { username: string; email: string; password: string }) {
  return request.post<{ user: UserProfile; accessToken: string }>('/auth/register', data);
}

export function loginApi(data: { username: string; password: string }) {
  return request.post<{ user: UserProfile; accessToken: string }>('/auth/login', data);
}

export function getProfileApi() {
  return request.get<UserProfile>('/auth/me');
}
