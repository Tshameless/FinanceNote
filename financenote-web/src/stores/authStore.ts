import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginApi, registerApi, getProfileApi, logoutApi, changePasswordApi, UserProfile } from '../api/auth';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(sessionStorage.getItem('fn_authenticated') === '1' ? 'cookie' : '');
  const user = ref<UserProfile | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(username: string, password: string) {
    const res = await loginApi({ username, password });
    user.value = res.user;
    sessionStorage.setItem('fn_authenticated', '1');
    return res;
  }

  async function register(username: string, email: string, password: string) {
    const res = await registerApi({ username, email, password });
    user.value = res.user;
    sessionStorage.setItem('fn_authenticated', '1');
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

  async function changePassword(currentPassword: string, newPassword: string) {
    return changePasswordApi({ currentPassword, newPassword });
  }

  async function logout(shouldRedirect = false) {
    if (token.value) {
      try {
        await logoutApi();
      } catch {
        // 即使后端不可用也清理本地会话标记。
      }
    }
    token.value = '';
    user.value = null;
    sessionStorage.removeItem('fn_authenticated');
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
    changePassword,
    logout,
  };
});
