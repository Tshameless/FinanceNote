<template>
  <div class="login-page">
    <div class="login-card fn-glass-card">
      <div class="card-header">
        <h1 class="fn-gradient-title">FinanceNote</h1>
        <p class="subtitle">财报与书籍深度研读笔记系统</p>
      </div>

      <el-tabs v-model="activeTab" class="auth-tabs">
        <!-- 登录表单 -->
        <el-tab-pane label="账号登录" name="login">
          <el-form :model="loginForm" label-position="top" @keyup.enter="handleLogin">
            <el-form-item label="用户名">
              <el-input v-model="loginForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" type="password" show-password placeholder="请输入密码" />
            </el-form-item>
            <el-button type="primary" class="submit-btn" :loading="loading" @click="handleLogin">
              登 录
            </el-button>
          </el-form>
        </el-tab-pane>

        <!-- 注册表单 -->
        <el-tab-pane label="新用户注册" name="register">
          <el-form :model="registerForm" label-position="top" @keyup.enter="handleRegister">
            <el-form-item label="用户名">
              <el-input v-model="registerForm.username" placeholder="设置用户名 (至少 3 位)" />
            </el-form-item>
            <el-form-item label="电子邮箱">
              <el-input v-model="registerForm.email" placeholder="输入合法的电子邮箱" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="registerForm.password" type="password" show-password placeholder="设置密码 (至少 6 位)" />
            </el-form-item>
            <el-button type="primary" class="submit-btn" :loading="loading" @click="handleRegister">
              立 即 注 册
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="card-footer">
        <span>🔒 必须登录方可读取受保护的财报与书籍资源</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录与注册视图 (LoginView.vue)
 * 
 * 核心安全点：登录成功后由后端写入 HttpOnly Cookie，前端不接触 JWT 内容。
 */

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref<'login' | 'register'>('login');
const loading = ref<boolean>(false);

const loginForm = ref({
  username: '',
  password: '',
});

const registerForm = ref({
  username: '',
  email: '',
  password: '',
});

async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请填写完整的用户名和密码！');
    return;
  }

  loading.value = true;
  try {
    await authStore.login(loginForm.value.username, loginForm.value.password);
    ElMessage.success('登录成功！欢迎进入 FinanceNote 研读工作台');
    router.push('/');
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  if (!registerForm.value.username || !registerForm.value.email || !registerForm.value.password) {
    ElMessage.warning('请填写完整的注册信息！');
    return;
  }

  loading.value = true;
  try {
    await authStore.register(registerForm.value.username, registerForm.value.email, registerForm.value.password);
    ElMessage.success('注册并登录成功！');
    router.push('/');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 70%);
}

.login-card {
  width: 420px;
  padding: 36px;
}

.card-header {
  text-align: center;
  margin-bottom: 24px;
}

.card-header h1 {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin-top: 4px;
}

.auth-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: #334155;
}

.auth-tabs :deep(.el-tabs__item) {
  color: #94a3b8;
  font-size: 15px;
}

.auth-tabs :deep(.el-tabs__item.is-active) {
  color: #6366f1;
  font-weight: 600;
}

.submit-btn {
  width: 100%;
  margin-top: 12px;
  height: 40px;
  font-weight: 600;
}

.card-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: #64748b;
}
</style>
