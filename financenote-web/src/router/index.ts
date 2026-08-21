/**
 * Vue Router 4 路由导航配置
 */

import { createRouter, createWebHistory } from 'vue-router';
import { defineAsyncComponent } from 'vue';

const LoginView = defineAsyncComponent(() => import('../views/LoginView.vue'));
const DashboardView = defineAsyncComponent(() => import('../views/DashboardView.vue'));

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
    },
    {
      path: '/',
      name: 'Dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
  ],
});

// 路由守卫：校验是否已登录
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('fn_authenticated');
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router;
