import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginApi, registerApi, getProfileApi, UserProfile } from '../api/auth';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('fn_access_token') || '');
  const user = ref<UserProfile | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(username: string, password: string) {
    const res = await loginApi({ username, password });
    token.value = res.accessToken;
    user.value = res.user;
    localStorage.setItem('fn_access_token', res.accessToken);
    return res;
  }

  async function register(username: string, email: string, password: string) {
    const res = await registerApi({ username, email, password });
    token.value = res.accessToken;
    user.value = res.user;
    localStorage.setItem('fn_access_token', res.accessToken);
    return res;
  }

  async function fetchProfile() {
    if (!token.value) return;
    try {
      user.value = await getProfileApi();
    } catch (e) {
      logout(true);
    }
  }

  function logout(shouldRedirect = false) {
    token.value = '';
    user.value = null;
    localStorage.removeItem('fn_access_token');
    if (shouldRedirect || window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    fetchProfile,
    logout,
  };
});
